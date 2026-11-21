// De wekelijkse bijwerking (beslissing 6 van docs/PLAN-heel-nederland.md): haal alle BGT-delta's sinds de
// stand van het afgeleide bestand bij PDOK op (één aanvraag per dag, de vijf typen samen, heel NL) en pas ze
// in volgorde toe. Werkt de stand bij in <map>/stand.json.
//
//   node tools/bgt/pas_delta.mjs <map> [--tot 2026-11-28T23:30:00Z] [--zip dag1.zip,dag2.zip --stand <tijd>]
//
// stand.json: { "stand": "2026-11-20T23:30:00Z", "delta": [{ id, van, tot, zip }] }. Bestaat het niet, dan
// komt de stand uit de <collectie>.json van bouw_bgt.mjs (de vroegste van de vijf).
// --zip: lokale deltabestanden (proef), met --stand als begin.
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { leesDelta, pasToe } from './delta.mjs'
import { COLLECTIES, API } from './bron.mjs'

const [map, ...rest] = process.argv.slice(2)
const arg = (n, std) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : std }
const KOP = { 'User-Agent': 'nopaves-graaf/bgt (wekelijkse voorbewerking)', 'Content-Type': 'application/json' }
const wacht = (ms) => new Promise((r) => setTimeout(r, ms))

async function json(url, init = {}) {
  for (let p = 0; ; p++) {
    const r = await fetch(url, { headers: KOP, ...init, signal: AbortSignal.timeout(120000) }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }))
    const t = await r.text()
    if (r.ok) return JSON.parse(t)
    if (p >= 5 || (r.status >= 400 && r.status < 500 && r.status !== 429)) throw new Error(`HTTP ${r.status} ${url}: ${t.slice(0, 300)}`)
    await wacht(5000 * 2 ** p)
  }
}

/** Eén dag-delta (alle vijf typen, heel NL) aanvragen en als zip opslaan. */
async function haalDelta(id, pad) {
  const a = await json(`${API}/delta/custom`, { method: 'POST', body: JSON.stringify({ deltaId: id, featuretypes: COLLECTIES, format: 'citygml' }) })
  let st
  for (let i = 0; ; i++) {
    st = await json(`${API}/delta/custom/${a.downloadRequestId}/status`)
    if (st.status === 'COMPLETED') break
    if (i > 400) throw new Error('delta niet klaar na ruim een uur: ' + id)
    await wacht(i < 10 ? 3000 : 10000)
  }
  const r = await fetch('https://api.pdok.nl' + st._links.download.href, { headers: { 'User-Agent': KOP['User-Agent'] } })
  if (!r.ok) throw new Error(`download HTTP ${r.status}`)
  fs.writeFileSync(pad, Buffer.from(await r.arrayBuffer()))
}

/** Tekst van één bestand in een lokale zip (via unzip -p), als stroom. */
async function* uitZip(zip, naam) {
  const p = spawn('unzip', ['-p', zip, naam])
  p.stdout.setEncoding('utf8')
  let fout = ''
  p.stderr.on('data', (d) => { fout += d })
  const klaar = new Promise((r) => p.on('close', r))
  for await (const s of p.stdout) yield s
  const code = await klaar
  if (code !== 0) throw new Error(`unzip ${zip} ${naam}: ${fout}`)
}

// stand bepalen
const standPad = path.join(map, 'stand.json')
let stand
if (fs.existsSync(standPad)) stand = JSON.parse(fs.readFileSync(standPad, 'utf8'))
else {
  const standen = COLLECTIES.map((c) => { try { return JSON.parse(fs.readFileSync(path.join(map, c + '.json'), 'utf8')).bron.stand } catch { return null } })
  if (standen.some((s) => !s) && !arg('--stand')) throw new Error('geen stand.json en niet voor alle typen een stand in <collectie>.json')
  stand = { stand: arg('--stand') || standen.sort()[0], delta: [] }
}
const t0 = Date.now()
let dagen
if (arg('--zip')) dagen = arg('--zip').split(',').map((zip, i) => ({ id: 'lokaal-' + i, zip }))
else {
  const lijst = []
  for (let page = 1; page < 20; page++) {
    const d = await json(`${API}/delta?page=${page}&count=10`)
    lijst.push(...d.deltas)
    if (!d._links?.some((l) => l.rel === 'next')) break
  }
  const tot = arg('--tot')
  const norm = (t) => new Date(t).toISOString()
  dagen = lijst.filter((d) => norm(d.timeWindow.from) >= norm(stand.stand) && (!tot || norm(d.timeWindow.to) <= norm(tot)))
    .sort((p, q) => norm(p.timeWindow.from).localeCompare(norm(q.timeWindow.from)))
  // ketencontrole: de eerste delta begint op de stand, elke volgende waar de vorige eindigt
  let vorige = norm(stand.stand)
  for (const d of dagen) {
    if (norm(d.timeWindow.from) !== vorige) throw new Error(`gat in de delta's bij ${vorige} (volgende begint ${d.timeWindow.from}); PDOK bewaart ~30 dagen: opnieuw volledig omzetten`)
    vorige = norm(d.timeWindow.to)
  }
  if (!dagen.length && lijst.length && lijst.every((d) => norm(d.timeWindow.from) > norm(stand.stand))) throw new Error(`stand ${stand.stand} is ouder dan de oudste delta: opnieuw volledig omzetten`)
  for (const d of dagen) {
    d.zip = path.join(map, `.delta-${d.id}.zip`)
    await haalDelta(d.id, d.zip)
    console.log(`delta ${d.timeWindow.from} - ${d.timeWindow.to}: ${(fs.statSync(d.zip).size / 1e6).toFixed(1)} MB`)
  }
}
const uit = { van: stand.stand, dagen: dagen.length, per: {} }
for (const c of COLLECTIES) {
  const telling = { groepen: 0, weg: 0, zet: 0 }
  async function* ops() { for (const d of dagen) yield* leesDelta(c, uitZip(d.zip, `bgt_${c}.xml`), telling) }
  uit.per[c] = { ...(await pasToe(map, c, ops())), groepen: telling.groepen }
  console.log(c, JSON.stringify(uit.per[c]))
}
if (!arg('--zip')) {
  for (const d of dagen) fs.unlinkSync(d.zip)
  if (dagen.length) stand.stand = dagen[dagen.length - 1].timeWindow.to
  stand.delta.push(...dagen.map((d) => ({ id: d.id, van: d.timeWindow.from, tot: d.timeWindow.to })))
} else if (arg('--tot')) stand.stand = arg('--tot')
fs.writeFileSync(standPad, JSON.stringify(stand, null, 1))
uit.tot = stand.stand
uit.seconden = Math.round((Date.now() - t0) / 1000)
console.log(JSON.stringify(uit))
