// Fase 1: geeft de BGT uit de PDOK-download hetzelfde ondergrondoordeel per wegstuk als de vectortegels?
// Neemt de wegstukken van de huidige vooraf bewerkte graaf (public/graaf, regio Delft) in een RD-gebied en
// berekent hun eindoordeel twee keer, met dezelfde code als bouw.mjs: met de vectortegels (nu opgehaald) en
// met de vlakken uit de download. Uitkomst: overeenkomst als % van de lengte (eis >= 98%).
//
//   NODE_USE_ENV_PROXY=1 node --max-old-space-size=8000 tools/bgt/vergelijk_oordeel.mjs <map met bgt_*.gml> <x0> <y0> <x1> <y1> [uit.json]
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { leesGml, collectieVan } from './gml.mjs'
import { TegelIndex, bboxVan } from './tegels.mjs'
import { afgeleideBron } from './afgeleid.mjs'
import { vlakkenVoor, oordeelVoorStuk } from '../graaf/bouw.mjs'
import { bgtTegelsVoorSeg, segMeetpunten } from '../graaf/nodig.mjs'
import { leesBlok } from '../../public/blokgraaf.js'
import * as K from '../../public/kern.js'
import * as T from '../../public/osmtegels.js'

const [map, ...rest] = process.argv.slice(2)
const [x0, y0, x1, y1] = rest.slice(0, 4).map(Number)
const uitPad = rest[4]
const MARGE = 400 // m: vlakken rond het gebied, voor de tegels van stukken aan de rand

// 1. vlakken uit de download: het afgeleide bestand (vak_*.nbv.gz) als dat in de map staat, anders de GML
const index = new TegelIndex()
const afgeleid = fs.readdirSync(map).some((f) => f.endsWith('.nbv.gz'))
for (const f of afgeleid ? [] : fs.readdirSync(map).filter((f) => f.endsWith('.gml'))) {
  const stroom = fs.createReadStream(path.join(map, f), { encoding: 'utf8', highWaterMark: 4 << 20 })
  for await (const o of leesGml(collectieVan(f), stroom)) {
    const b = bboxVan(o.polygonen)
    if (b[2] < x0 - MARGE || b[0] > x1 + MARGE || b[3] < y0 - MARGE || b[1] > y1 + MARGE) continue
    index.voegToe(o)
  }
}

const downloadBron = afgeleid ? afgeleideBron(map) : index.bron

// 2. wegstukken uit de graaf, midden in het gebied (alle blokken lezen: 48 stuks, klein genoeg)
const GRAAF = path.join(path.dirname(new URL(import.meta.url).pathname), '../../public/graaf')
const actueel = JSON.parse(fs.readFileSync(path.join(GRAAF, 'actueel.json'), 'utf8'))
const g = { x: [], y: [], van: [], naar: [], lengte: [], tekst: [], klasse: [] }
for (const b of actueel.blokken) {
  const blok = leesBlok(zlib.gunzipSync(fs.readFileSync(path.join(GRAAF, b.bestand))))
  const rd = new Map()
  const knoop = (i) => {
    let k = rd.get(i)
    if (k === undefined) {
      const [x, y] = K.naarRd(blok.lon[i] / 1e7, blok.lat[i] / 1e7)
      k = g.x.push(x) - 1
      g.y.push(y)
      rd.set(i, k)
    }
    return k
  }
  for (let s = 0; s < blok.m; s++) {
    const [ax, ay] = K.naarRd(blok.lon[blok.van[s]] / 1e7, blok.lat[blok.van[s]] / 1e7)
    const [bx, by] = K.naarRd(blok.lon[blok.naar[s]] / 1e7, blok.lat[blok.naar[s]] / 1e7)
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    if (mx < x0 || mx > x1 || my < y0 || my > y1) continue
    const a = knoop(blok.van[s])
    const c = knoop(blok.naar[s])
    g.van.push(a)
    g.naar.push(c)
    g.lengte.push(Math.max(0.01, Math.hypot(g.x[a] - g.x[c], g.y[a] - g.y[c])))
    g.tekst.push(blok.tags[blok.tag[s]])
    g.klasse.push(K.KLASSEN[blok.klasse[s]])
  }
}

// 3. per groep (zoom-14-tegel van het midden, zoals bouw.mjs) de vlakken twee keer, en het oordeel per stuk
const groepen = new Map()
for (let s = 0; s < g.van.length; s++) {
  const mx = (g.x[g.van[s]] + g.x[g.naar[s]]) / 2
  const my = (g.y[g.van[s]] + g.y[g.naar[s]]) / 2
  const [lon, lat] = K.naarWgs(mx, my)
  const k = T.tegelXY(lat, lon, 14).join('/')
  if (!groepen.has(k)) groepen.set(k, [])
  groepen.get(k).push(s)
}
const stat = { stukken: g.van.length, km: 0, gelijkTegelsDownload: 0, gelijkTegelsGraaf: 0, gelijkDownloadGraaf: 0, strandKm: 0, strandAnders: 0, afgeslotenKm: 0, natuurAnders: 0 }
const matrix = {}
const voorbeelden = []
let gi = 0
for (const segs of groepen.values()) {
  if (++gi % 100 === 0) console.log(`  groep ${gi}/${groepen.size}`)
  const tegels = new Set()
  for (const s of segs) bgtTegelsVoorSeg(g, s, K.alleenMetKaartje(g.tekst[s]), tegels)
  const vT = await vlakkenVoor(tegels)
  const vD = await vlakkenVoor(tegels, downloadBron)
  for (const s of segs) {
    const pts = segMeetpunten(g, s)
    const oT = oordeelVoorStuk(g.tekst[s], pts, vT)
    const oD = oordeelVoorStuk(g.tekst[s], pts, vD)
    const eT = oT.st.eind
    const eD = oD.st.eind
    const l = g.lengte[s] / 1000
    stat.km += l
    // ook de vlaggen die de planner gebruikt: strand (detail.strand) en natuur rond afgesloten stukken
    if (!!oT.detail.strand !== !!oD.detail.strand) stat.strandAnders += l
    if (oT.detail.strand) stat.strandKm += l
    if (K.alleenMetKaartje(g.tekst[s])) {
      const mx = (g.x[g.van[s]] + g.x[g.naar[s]]) / 2
      const my = (g.y[g.van[s]] + g.y[g.naar[s]]) / 2
      stat.afgeslotenKm += l
      if ((vT.natuur(mx, my) >= 0.6) !== (vD.natuur(mx, my) >= 0.6)) stat.natuurAnders += l
    }
    if (eT === eD) stat.gelijkTegelsDownload += l
    else {
      const k = eT + ' -> ' + eD
      matrix[k] = (matrix[k] || 0) + l
      if (voorbeelden.length < 15 && g.lengte[s] > 20) voorbeelden.push({ tegels: eT, download: eD, m: Math.round(g.lengte[s]), tags: g.tekst[s], rd: [Math.round(g.x[g.van[s]]), Math.round(g.y[g.van[s]])] })
    }
    if (eT === g.klasse[s]) stat.gelijkTegelsGraaf += l
    if (eD === g.klasse[s]) stat.gelijkDownloadGraaf += l
  }
}
const pct = (v) => +((100 * v) / stat.km).toFixed(2)
const uit = {
  bron: afgeleid ? 'afgeleid bestand (NBV1)' : 'GML',
  gebied: [x0, y0, x1, y1], stukken: stat.stukken, km: +stat.km.toFixed(1),
  overeenkomst: { tegelsVsDownload: pct(stat.gelijkTegelsDownload), tegelsNuVsGraaf: pct(stat.gelijkTegelsGraaf), downloadVsGraaf: pct(stat.gelijkDownloadGraaf) },
  vlaggen: { strandKm: +stat.strandKm.toFixed(2), strandAndersKm: +stat.strandAnders.toFixed(2), afgeslotenKm: +stat.afgeslotenKm.toFixed(2), natuurAndersKm: +stat.natuurAnders.toFixed(2) },
  verschillenKm: Object.fromEntries(Object.entries(matrix).sort((p, q) => q[1] - p[1]).map(([k, v]) => [k, +v.toFixed(2)])),
  voorbeelden,
}
if (uitPad) fs.writeFileSync(uitPad, JSON.stringify(uit, null, 1))
console.log(JSON.stringify(uit, null, 1))
