// Fase 0 (docs/PLAN-heel-nederland.md): de BGT-download van PDOK meten.
//
//   node tools/fase0/bgt.mjs full  <rd.wkt> <uit.json> [<zip-pad>]   full/custom voor één gebied
//   node tools/fase0/bgt.mjs delta <dagen> <uit.json>                 delta/custom, heel NL, de laatste <dagen>
//
// Alleen de objecttypes die de app leest (kern.js: BGT_COLLECTIES + waterdeel voor zee). Zonder zip-pad
// gaat de download alleen door de teller (grootte en tijd), niet naar schijf.
// Gemeten in de sessie van 2026-11-20 (zie het plan): het geofilter werkt in vakken van ongeveer 5 km,
// gmllight bevat ook historische versies (eindRegistratie), een delta van één dag is ~15 MB zip.
import fs from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const API = 'https://api.pdok.nl/lv/bgt/download/v1_0'
const PDOK = 'https://api.pdok.nl'
const TYPES = ['wegdeel', 'ondersteunendwegdeel', 'begroeidterreindeel', 'onbegroeidterreindeel', 'waterdeel']
const KOP = { 'User-Agent': 'nopaves-graaf/fase0 (eenmalige meting)', 'Content-Type': 'application/json' }
const wacht = (ms) => new Promise((r) => setTimeout(r, ms))
const nu = () => Date.now() / 1000

async function json(url, init = {}) {
  for (let poging = 0; ; poging++) {
    const r = await fetch(url, { headers: KOP, ...init, signal: AbortSignal.timeout(120000) }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }))
    const tekst = await r.text()
    if (r.ok) return { status: r.status, body: JSON.parse(tekst) }
    if (poging >= 4 || (r.status >= 400 && r.status < 500 && r.status !== 429)) throw new Error(`HTTP ${r.status} ${url}: ${tekst.slice(0, 500)}`)
    await wacht(5000 * 2 ** poging)
  }
}

/** Aanvraag doen, wachten tot COMPLETED, download meten. */
async function aanvraag(soort, body, zipPad) {
  const t0 = nu()
  const { body: a } = await json(`${API}/${soort}/custom`, { method: 'POST', body: JSON.stringify(body) })
  const id = a.downloadRequestId
  let st
  let polls = 0
  for (;;) {
    st = (await json(`${API}/${soort}/custom/${id}/status`)).body
    polls++
    if (st.status === 'COMPLETED') break
    if (!['PENDING', 'RUNNING'].includes(st.status)) throw new Error('onverwachte status ' + JSON.stringify(st))
    if (nu() - t0 > 4 * 3600) throw new Error('na 4 uur nog niet klaar: ' + JSON.stringify(st))
    await wacht(polls < 10 ? 5000 : 30000)
  }
  const tKlaar = nu()
  const r = await fetch(PDOK + st._links.download.href, { headers: { 'User-Agent': KOP['User-Agent'] } })
  if (!r.ok) throw new Error(`download HTTP ${r.status}`)
  let bytes = 0
  const teller = new TransformStream({ transform(chunk, c) { bytes += chunk.length; c.enqueue(chunk) } })
  const stroom = Readable.fromWeb(r.body.pipeThrough(teller))
  if (zipPad) await pipeline(stroom, fs.createWriteStream(zipPad))
  else for await (const _ of stroom); // eslint-disable-line no-unused-vars
  return { id, wachtSeconden: Math.round(tKlaar - t0), downloadSeconden: Math.round(nu() - tKlaar), zipBytes: bytes, mbPerSeconde: +(bytes / 1e6 / Math.max(1, nu() - tKlaar)).toFixed(1) }
}

const [modus, a1, uitPad, zipPad] = process.argv.slice(2)
let uit
if (modus === 'full') {
  const geofilter = fs.readFileSync(a1, 'utf8').trim()
  uit = { modus, geofilter, featuretypes: TYPES, format: 'gmllight', ...(await aanvraag('full', { featuretypes: TYPES, format: 'gmllight', geofilter }, zipPad)) }
} else if (modus === 'delta') {
  const dagen = Number(a1)
  const lijst = []
  for (let page = 1; page < 20; page++) {
    const { body } = await json(`${API}/delta?page=${page}&count=10`)
    lijst.push(...body.deltas)
    if (!body._links?.some((l) => l.rel === 'next')) break
  }
  const recent = lijst.sort((p, q) => p.timeWindow.to.localeCompare(q.timeWindow.to)).slice(-dagen)
  const per = []
  for (const d of recent) per.push({ venster: d.timeWindow, ...(await aanvraag('delta', { deltaId: d.id, featuretypes: TYPES, format: 'citygml' })) }) // na elkaar: zuinig voor PDOK
  const som = (k) => per.reduce((t, x) => t + x[k], 0)
  uit = { modus, beschikbaar: lijst.length, dagen: per.length, zipBytes: som('zipBytes'), wachtSeconden: som('wachtSeconden'), downloadSeconden: som('downloadSeconden'), per }
} else throw new Error('modus: full of delta')
fs.writeFileSync(uitPad, JSON.stringify(uit, null, 1))
console.log(JSON.stringify(uit))
