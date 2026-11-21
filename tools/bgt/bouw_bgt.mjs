// Zet de BGT om naar het afgeleide bestand (afgeleid.mjs), voor één objecttype per proces (zo draaien de
// vijf typen op vijf kernen). Bron: het kant-en-klare NL-bestand van PDOK, alleen de bytes van dit type,
// in parallelle stukken (zip.mjs); of een lokaal .gml-bestand (proef).
//
//   node tools/bgt/bouw_bgt.mjs <collectie> <uitmap> [--gml bestand.gml] [--adres <cache-adres>] [--stromen 8]
//
// --adres: het cache-adres van PDOK (na de 307), zodat alle vijf processen dezelfde versie lezen; PDOK
// ververst het bestand elke nacht. Zonder --adres zoekt het proces het zelf op.
// Schrijft <uitmap>/vak_*.<collectie>.nbv.gz en <uitmap>/<collectie>.json (telling, tijd, bron).
import fs from 'node:fs'
import path from 'node:path'
import { leesGml } from './gml.mjs'
import { Schrijver } from './afgeleid.mjs'
import { bestandInfo, inhoud, leesBestand } from './zip.mjs'
import { NL_ZIP, DATASET } from './bron.mjs'

const [collectie, uitmap, ...rest] = process.argv.slice(2)
const arg = (n, std) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : std }
const t0 = Date.now()
const cpu0 = process.cpuUsage()
let rss = 0
const telling = { objecten: 0, historie: 0, zonderVlak: 0, actueel: 0 }
let bron
let stroom
let binnen = 0
let laatst = 0
const meld = () => {
  rss = Math.max(rss, process.memoryUsage().rss)
  if (Date.now() - laatst < 60000) return
  laatst = Date.now()
  console.log(`${collectie}: ${Math.round((Date.now() - t0) / 1000)} s, ${(binnen / 1e6).toFixed(0)} MB binnen, ${telling.actueel} actueel, ${telling.historie} historie`)
}
if (arg('--gml')) {
  bron = { soort: 'gml', bestand: path.basename(arg('--gml')) }
  stroom = fs.createReadStream(arg('--gml'), { encoding: 'utf8', highWaterMark: 4 << 20 })
} else {
  const info = await bestandInfo(arg('--adres', NL_ZIP))
  const item = (await inhoud(info.url, info.grootte)).find((x) => x.naam === `bgt_${collectie}.gml`)
  if (!item) throw new Error('geen bgt_' + collectie + '.gml in de zip')
  // tot wanneer de data loopt (voor de delta's daarna): de actualiteit van dit type volgens PDOK, die vóór
  // het aanmaken van het bestand moet liggen (anders is er intussen een nieuwere nachtversie)
  const actualiteit = await (await fetch(DATASET)).json()
  const stand = actualiteit.timeliness.find((t) => t.featuretype === collectie)?.datetimeTo
  if (!stand || new Date(stand) > new Date(info.gewijzigd)) throw new Error(`actualiteit ${stand} ligt niet vóór het bestand (${info.gewijzigd}); later opnieuw proberen`)
  bron = { soort: 'pdok-nl-zip', adres: NL_ZIP, cache: info.url, gewijzigd: info.gewijzigd, stand, gecomprimeerd: item.gecomprimeerd, uitgepakt: item.uitgepakt }
  stroom = leesBestand(info.url, item, { stromen: Number(arg('--stromen', 8)), voortgang: (b) => { binnen = b; meld() } })
}
const s = new Schrijver(uitmap, collectie)
for await (const o of leesGml(collectie, stroom, telling)) { s.voegToe(o); if (telling.actueel % 100000 === 0) meld() }
const tLees = (Date.now() - t0) / 1000
const vakken = s.sluit()
const c = process.cpuUsage(cpu0)
const uit = {
  collectie, bron, telling, vakken: vakken.length, gz: vakken.reduce((t, v) => t + v.gz, 0),
  seconden: { lezen: Math.round(tLees), totaal: Math.round((Date.now() - t0) / 1000) }, cpuSeconden: Math.round((c.user + c.system) / 1e6), rssMB: Math.round(Math.max(rss, process.memoryUsage().rss) / 1e6),
  bestanden: vakken,
}
fs.writeFileSync(path.join(uitmap, collectie + '.json'), JSON.stringify(uit, null, 1))
console.log(JSON.stringify({ ...uit, bestanden: undefined }))
