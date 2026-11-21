// Fase 1: geeft de BGT uit de PDOK-download (gmllight) per tegel dezelfde vlakken als de vectortegels die de
// app nu gebruikt? Vergelijkt per tegel de objecten (lokaal_id), de velden en de oppervlakte.
//
//   NODE_USE_ENV_PROXY=1 node tools/bgt/vergelijk_tegels.mjs <map met bgt_*.gml> <x0> <y0> <x1> <y1> [uit.json]
//
// x0..y1: een RD-gebied dat helemaal binnen de download valt. Tegels uit de schijfcache van haal.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { leesGml, collectieVan } from './gml.mjs'
import { haal, tegelijk } from '../graaf/haal.mjs'
import * as K from '../../public/kern.js'

const [map, ...rest] = process.argv.slice(2)
const [x0, y0, x1, y1] = rest.slice(0, 4).map(Number)
const uitPad = rest[4]
const [c0, r0] = K.tegelVan(x0, y1)
const [c1, r1] = K.tegelVan(x1, y0)
const tegels = []
for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) tegels.push([c, r])

const bboxVan = (pol) => {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity
  for (const ringen of pol) for (const r of ringen) for (let i = 0; i < r.length; i += 2) {
    if (r[i] < a) a = r[i]; if (r[i] > c) c = r[i]; if (r[i + 1] < b) b = r[i + 1]; if (r[i + 1] > d) d = r[i + 1]
  }
  return [a, b, c, d]
}
function inRing(x, y, r) {
  let binnen = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > y) !== (r[j + 1] > y) && x < ((r[j] - r[i]) * (y - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) binnen = !binnen
  }
  return binnen
}
const kruist = (ax, ay, bx, by, cx, cy, dx, dy) => {
  const o = (px, py, qx, qy, rx, ry) => Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px))
  return o(ax, ay, bx, by, cx, cy) * o(ax, ay, bx, by, dx, dy) < 0 && o(cx, cy, dx, dy, ax, ay) * o(cx, cy, dx, dy, bx, by) < 0
}
/** Raakt het vlak de tegel? */
function raakt(pol, [tx0, ty0, tx1, ty1]) {
  const hoeken = [[tx0, ty0], [tx1, ty0], [tx1, ty1], [tx0, ty1]]
  for (const ringen of pol) {
    const buiten = ringen[0]
    for (let i = 0; i < buiten.length; i += 2) if (buiten[i] >= tx0 && buiten[i] <= tx1 && buiten[i + 1] >= ty0 && buiten[i + 1] <= ty1) return true
    if (hoeken.some(([x, y]) => inRing(x, y, buiten) && !ringen.slice(1).some((g) => inRing(x, y, g)))) return true
    for (let i = 0, j = buiten.length - 2; i < buiten.length; j = i, i += 2) {
      for (let k = 0; k < 4; k++) {
        const [px, py] = hoeken[k]
        const [qx, qy] = hoeken[(k + 1) % 4]
        if (kruist(buiten[j], buiten[j + 1], buiten[i], buiten[i + 1], px, py, qx, qy)) return true
      }
    }
  }
  return false
}
const opp = (pol) => {
  let s = 0
  for (const ringen of pol) ringen.forEach((r, k) => {
    let a = 0
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) a += r[j] * r[i + 1] - r[i] * r[j + 1]
    s += (k === 0 ? 1 : -1) * Math.abs(a / 2)
  })
  return s
}

// 1. download: alle actuele objecten die het gebied raken
const t0 = Date.now()
const gml = new Map() // collectie|id -> object
const telling = {}
for (const f of fs.readdirSync(map).filter((f) => f.endsWith('.gml'))) {
  const collectie = collectieVan(f)
  telling[collectie] = { objecten: 0, historie: 0, zonderVlak: 0, actueel: 0 }
  const stroom = fs.createReadStream(path.join(map, f), { encoding: 'utf8', highWaterMark: 4 << 20 })
  for await (const o of leesGml(collectie, stroom, telling[collectie])) {
    const b = bboxVan(o.polygonen)
    if (b[2] < x0 - 300 || b[0] > x1 + 300 || b[3] < y0 - 300 || b[1] > y1 + 300) continue
    o.bbox = b
    gml.set(collectie + '|' + o.props.lokaal_id, o)
  }
}
const tLees = (Date.now() - t0) / 1000

// 2. vectortegels
const mvt = await tegelijk(tegels, 4, async ([c, r]) => {
  const b = await haal(`https://api.pdok.nl/kadaster/bgt/ogc/v1/tiles/NetherlandsRDNewQuad/12/${r}/${c}?f=mvt`, `bgt/${c}_${r}.mvt`, { maxDagen: 30 })
  return b ? K.leesTegel(b, c, r) : []
}, { naam: 'mvt', elk: 50 })

// 3. per tegel vergelijken
const stat = { tegels: tegels.length, beide: 0, alleenTegel: 0, alleenDownload: 0, veldenAnders: 0, oppAnders: 0, oppVerschilMax: 0 }
const voorbeelden = { alleenTegel: [], alleenDownload: [], veldenAnders: [], oppAnders: [] }
const VELD = ['status', 'functie', 'fysiek_voorkomen', 'plus_fysiek_voorkomen', 'type', 'relatieve_hoogteligging']
tegels.forEach(([c, r], i) => {
  const gebied = K.tegelGebied(c, r)
  const inTegel = new Map(mvt[i].map((v) => [v.collectie + '|' + v.props.lokaal_id, v]))
  const inDownload = new Set()
  for (const [k, o] of gml) {
    const b = o.bbox
    if (b[2] < gebied[0] || b[0] > gebied[2] || b[3] < gebied[1] || b[1] > gebied[3]) continue
    if (raakt(o.polygonen, gebied)) inDownload.add(k)
  }
  for (const [k, v] of inTegel) {
    if (!inDownload.has(k)) { stat.alleenTegel++; if (voorbeelden.alleenTegel.length < 8) voorbeelden.alleenTegel.push([c, r, k, v.props]); continue }
    stat.beide++
    const o = gml.get(k)
    const anders = VELD.filter((f) => String(v.props[f] ?? '') !== String(o.props[f] ?? '') && !(f === 'relatieve_hoogteligging' && Number(v.props[f] || 0) === Number(o.props[f] || 0)))
    if (anders.length) { stat.veldenAnders++; if (voorbeelden.veldenAnders.length < 8) voorbeelden.veldenAnders.push([k, anders.map((f) => [f, v.props[f], o.props[f]])]) }
  }
  for (const k of inDownload) if (!inTegel.has(k)) { stat.alleenDownload++; if (voorbeelden.alleenDownload.length < 8) voorbeelden.alleenDownload.push([c, r, k, gml.get(k).props]) }
})
// oppervlakte: per object over alle tegels (een tegel kan alleen de delen in die tegel bevatten)
const tegelOpp = new Map()
mvt.flat().forEach((v) => { const k = v.collectie + '|' + v.props.lokaal_id; if (!tegelOpp.has(k)) tegelOpp.set(k, opp(v.polygonen)) })
const verschillen = []
for (const [k, a] of tegelOpp) {
  const o = gml.get(k)
  if (!o) continue
  const b = opp(o.polygonen)
  const rel = Math.abs(a - b) / Math.max(1, Math.abs(b))
  verschillen.push(rel)
  if (rel > 0.01) { stat.oppAnders++; if (voorbeelden.oppAnders.length < 8) voorbeelden.oppAnders.push([k, +a.toFixed(1), +b.toFixed(1)]) }
}
verschillen.sort((p, q) => p - q)
stat.oppVerschilMediaan = verschillen[Math.floor(verschillen.length / 2)]
stat.oppVerschilP99 = verschillen[Math.floor(verschillen.length * 0.99)]
const uit = { gebied: [x0, y0, x1, y1], telling, leesSeconden: tLees, stat, voorbeelden }
if (uitPad) fs.writeFileSync(uitPad, JSON.stringify(uit, null, 1))
console.log(JSON.stringify({ telling, leesSeconden: tLees, stat }, null, 1))
console.log(JSON.stringify(voorbeelden, null, 1).slice(0, 4000))
