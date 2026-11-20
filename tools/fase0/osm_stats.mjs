// Fase 0 (docs/PLAN-heel-nederland.md): hoe groot wordt de graaf van een provincie? Bouwt de graaf uit
// het OSM-extract precies zoals bouw.mjs (zelfde opties), maar zonder BGT en AHN, en telt knopen,
// wegstukken, kilometers (per OSM-ondergrondgroep) en wegstukken per zoom-12-blok.
//
//   node --max-old-space-size=12000 tools/fase0/osm_stats.mjs <elementen.ndjson> <regio.json> <uit.json>
//
// De geschatte gzip-grootte gebruikt de verhouding van de regio Delft (v20261120-r4: 14.719.638 B voor
// 1.368.894 wegstukken, 10,75 B per wegstuk): een schatting, de kalibratieprovincies meten het echt.
import fs from 'node:fs'
import { laadRegio, laadElementen } from '../graaf/bouw.mjs'
import * as G from '../../public/graaf.js'
import * as K from '../../public/kern.js'
import * as T from '../../public/osmtegels.js'

const DELFT_B_PER_WEGSTUK = 14719638 / 1368894

const [bron, regioPad, uitPad] = process.argv.slice(2)
const t0 = Date.now()
const regio = laadRegio(regioPad)
const { elementen, snap, info } = await laadElementen(regio, bron)
const tLaad = (Date.now() - t0) / 1000
const g = G.bouwGraaf(elementen, { kaartje: true, strandMijden: true, snap, metBron: true, trail: true })
const tGraaf = (Date.now() - t0) / 1000 - tLaad

const m = g.van.length
const km = { totaal: 0 }
const perBlok = new Map()
const groepVanTags = new Map()
for (let s = 0; s < m; s++) {
  const tekst = g.tagLijst[g.segTags[s]]
  let groep = groepVanTags.get(tekst)
  if (groep === undefined) {
    const o = K.osmKlasse(tekst)
    groep = o.zeker ? o.klasse : 'osm onzeker'
    groepVanTags.set(tekst, groep)
  }
  const l = g.lengte[s] / 1000
  km.totaal += l
  km[groep] = (km[groep] || 0) + l
  const a = g.van[s]
  const b = g.naar[s]
  const k = T.tegelXY((g.lat[a] + g.lat[b]) / 2, (g.lon[a] + g.lon[b]) / 2, 12).join('/')
  perBlok.set(k, (perBlok.get(k) || 0) + 1)
}
for (const k of Object.keys(km)) km[k] = Math.round(km[k])
const blokTellingen = [...perBlok.values()].sort((p, q) => p - q)
const kwantiel = (f) => blokTellingen[Math.min(blokTellingen.length - 1, Math.floor(f * blokTellingen.length))] || 0
const uit = {
  regio: regio.naam,
  osm: info,
  knopen: g.n,
  wegstukken: m,
  km,
  blokken: { metWegen: perBlok.size, rechthoek: regio.blokken.length, wegstukkenMediaan: kwantiel(0.5), wegstukkenP95: kwantiel(0.95), wegstukkenMax: kwantiel(1) },
  schattingGzBytes: Math.round(m * DELFT_B_PER_WEGSTUK),
  seconden: { laden: Math.round(tLaad), graaf: Math.round(tGraaf) },
  rssMB: Math.round(process.memoryUsage().rss / 1e6),
}
fs.writeFileSync(uitPad, JSON.stringify(uit, null, 1))
console.log(JSON.stringify(uit))
