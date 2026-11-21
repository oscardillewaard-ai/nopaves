// Fase 1, beslissing 6: kloppen de delta's met de volledige download, en past pasToe ze goed toe?
// Neemt een volledige gmllight-download van een gebied (met historie) en de NL-delta van de dag die eindigt
// op het moment van die download, en toetst voor alle wijzigingen binnen het gebied:
//   1. elke nieuwe versie (wordt, actueel) staat precies zo bij de actuele objecten (velden, geometrie 1 cm);
//   2. elke oude versie (was) staat precies zo in de historie (afgesloten) en is niet meer actueel, of is
//      opnieuw toegevoegd;
//   3. toestand van gisteren (vandaag met de delta teruggedraaid) + pasToe = vandaag, vak voor vak.
//
//   node tools/bgt/proef_delta.mjs <map met bgt_*.gml> <map met bgt_*.xml (delta)> [uit.json]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { leesGml } from './gml.mjs'
import { leesDelta, pasToe } from './delta.mjs'
import { Schrijver, leesVak } from './afgeleid.mjs'
import { bboxVan } from './tegels.mjs'
import { COLLECTIES } from './bron.mjs'

const [volMap, deltaMap, uitPad] = process.argv.slice(2)
const VELD = ['status', 'functie', 'fysiek_voorkomen', 'plus_fysiek_voorkomen', 'type', 'relatieve_hoogteligging']
const veldenGelijk = (a, b) => VELD.every((f) => (f === 'status' ? (a.props[f] || 'bestaand') === (b.props[f] || 'bestaand') : String(a.props[f] ?? '') === String(b.props[f] ?? '')))
function geomGelijk(a, b, tol = 0.01) {
  if (a.polygonen.length !== b.polygonen.length) return false
  for (let p = 0; p < a.polygonen.length; p++) {
    if (a.polygonen[p].length !== b.polygonen[p].length) return false
    for (let r = 0; r < a.polygonen[p].length; r++) {
      const x = a.polygonen[p][r], y = b.polygonen[p][r]
      if (x.length !== y.length) return false
      for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) > tol) return false
    }
  }
  return true
}
const binnen = (b, g) => b[0] >= g[0] && b[1] >= g[1] && b[2] <= g[2] && b[3] <= g[3]

const uit = { per: {}, totaal: { zet: 0, zetGelijk: 0, was: 0, wasGelijk: 0, vakken: 0, vakkenGelijk: 0 }, voorbeelden: [] }
for (const c of COLLECTIES) {
  // volledige download: actueel en historie per lokaal_id
  const actueel = new Map()
  const historie = new Map()
  let gebied = [Infinity, Infinity, -Infinity, -Infinity]
  for await (const o of leesGml(c, fs.createReadStream(path.join(volMap, `bgt_${c}.gml`), { encoding: 'utf8', highWaterMark: 4 << 20 }), undefined, { metHistorie: true })) {
    if (o.historie) { const l = historie.get(o.props.lokaal_id); if (l) l.push(o); else historie.set(o.props.lokaal_id, [o]) } else {
      actueel.set(o.props.lokaal_id, o)
      const b = bboxVan(o.polygonen)
      gebied = [Math.min(gebied[0], b[0]), Math.min(gebied[1], b[1]), Math.max(gebied[2], b[2]), Math.max(gebied[3], b[3])]
    }
  }
  gebied = [gebied[0] + 300, gebied[1] + 300, gebied[2] - 300, gebied[3] - 300] // ruim binnen de dekking
  // delta: alleen bewerkingen helemaal binnen het gebied
  const ops = []
  for await (const op of leesDelta(c, fs.createReadStream(path.join(deltaMap, `bgt_${c}.xml`), { encoding: 'utf8', highWaterMark: 4 << 20 }))) {
    const o = op.zet || op.was
    if (o && binnen(bboxVan(o.polygonen), gebied)) ops.push(op)
  }
  const st = { zet: 0, zetGelijk: 0, was: 0, wasGelijk: 0 }
  const laatsteZet = new Map()
  for (const op of ops) if (op.zet) laatsteZet.set(op.zet.props.lokaal_id, op.zet)
  for (const [id, z] of laatsteZet) {
    st.zet++
    const a = actueel.get(id)
    if (a && veldenGelijk(a, z) && geomGelijk(a, z)) st.zetGelijk++
    else if (uit.voorbeelden.length < 10) uit.voorbeelden.push({ c, soort: 'zet', id, actueel: !!a, velden: a ? veldenGelijk(a, z) : null, delta: z.props, download: a?.props })
  }
  for (const op of ops) {
    if (!op.was) continue
    st.was++
    const h = (historie.get(op.weg) || []).some((v) => veldenGelijk(v, op.was) && geomGelijk(v, op.was))
    const nogActueelZelfde = actueel.has(op.weg) && !laatsteZet.has(op.weg)
    if (h && !nogActueelZelfde) st.wasGelijk++
    else if (uit.voorbeelden.length < 10) uit.voorbeelden.push({ c, soort: 'was', id: op.weg, inHistorie: h, nogActueel: nogActueelZelfde })
  }
  // 3. gisteren + pasToe = vandaag
  const gisteren = new Map(actueel)
  for (const id of laatsteZet.keys()) gisteren.delete(id)
  for (const op of ops) if (op.was && !gisteren.has(op.weg)) gisteren.set(op.weg, op.was)
  const tijdelijk = fs.mkdtempSync(path.join(os.tmpdir(), 'delta-'))
  const [mapG, mapV] = [path.join(tijdelijk, 'g'), path.join(tijdelijk, 'v')]
  const sg = new Schrijver(mapG, c); for (const o of gisteren.values()) sg.voegToe(o); sg.sluit()
  const sv = new Schrijver(mapV, c); for (const o of actueel.values()) sv.voegToe(o); sv.sluit()
  const tToe = await pasToe(mapG, c, (async function* () { yield* ops })())
  const bestanden = new Set([...fs.readdirSync(mapG), ...fs.readdirSync(mapV)].filter((f) => f.endsWith('.nbv.gz')))
  let vakken = 0, vakkenGelijk = 0
  for (const f of bestanden) {
    vakken++
    const lees = (m) => (fs.existsSync(path.join(m, f)) ? leesVak(fs.readFileSync(path.join(m, f))) : [])
    const a = new Map(lees(mapG).map((o) => [o.props.lokaal_id, o]))
    const b = new Map(lees(mapV).map((o) => [o.props.lokaal_id, o]))
    const gelijk = a.size === b.size && [...b].every(([k, o]) => a.has(k) && veldenGelijk(a.get(k), o) && geomGelijk(a.get(k), o, 0))
    if (gelijk) vakkenGelijk++
    else if (uit.voorbeelden.length < 10) uit.voorbeelden.push({ c, soort: 'vak', f, naDelta: a.size, vandaag: b.size })
  }
  fs.rmSync(tijdelijk, { recursive: true })
  uit.per[c] = { actueel: actueel.size, bewerkingen: ops.length, ...st, pasToe: tToe, vakken, vakkenGelijk }
  for (const k of ['zet', 'zetGelijk', 'was', 'wasGelijk']) uit.totaal[k] += st[k]
  uit.totaal.vakken += vakken
  uit.totaal.vakkenGelijk += vakkenGelijk
}
if (uitPad) fs.writeFileSync(uitPad, JSON.stringify(uit, null, 1))
console.log(JSON.stringify(uit, null, 1).slice(0, 6000))
