// Fase 0 (docs/PLAN-heel-nederland.md): de 12 provinciegrenzen van PDOK (Bestuurlijke Gebieden,
// collectie provinciegebied, WGS84) als .poly-bestanden voor osmium extract.
//
//   node tools/fase0/grenzen.mjs <map>
//
// Eerst kwamen de grenzen van Geofabrik (<slug>.poly), maar die gaven op 2026-11-20 herhaald 404 (run 1
// van fase0.yml). PDOK geeft alle 12 in één verzoek, en het is dezelfde bron als de BGT.
import fs from 'node:fs'
import path from 'node:path'

const ADRES = 'https://api.pdok.nl/kadaster/bestuurlijkegebieden/ogc/v1/collections/provinciegebied/items?f=json&limit=20'
const PROV = JSON.parse(fs.readFileSync(new URL('./provincies.json', import.meta.url))).provincies
const map = process.argv[2]
const wacht = (ms) => new Promise((r) => setTimeout(r, ms))

let d
for (let poging = 0; ; poging++) {
  try {
    const r = await fetch(ADRES, { headers: { 'User-Agent': 'nopaves-graaf/fase0 (eenmalige meting)' }, signal: AbortSignal.timeout(120000) })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    d = await r.json()
    break
  } catch (fout) {
    if (poging >= 5) throw fout
    console.log('PDOK', fout.message, '- opnieuw')
    await wacht(10000 * 2 ** poging)
  }
}
fs.mkdirSync(map, { recursive: true })
const gevonden = new Set()
for (const f of d.features) {
  const p = PROV.find((q) => q.naam === f.properties.naam)
  if (!p) throw new Error('onbekende provincie ' + f.properties.naam)
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]
  const regels = [p.slug]
  let i = 0
  for (const poly of polys) {
    poly.forEach((ring, r) => { // eerste ring buitenrand, de rest gaten ('!' in het poly-formaat)
      regels.push((r ? '!' : '') + ++i)
      for (const [lon, lat] of ring) regels.push(`   ${lon.toFixed(6)}   ${lat.toFixed(6)}`)
      regels.push('END')
    })
  }
  regels.push('END')
  fs.writeFileSync(path.join(map, p.slug + '.poly'), regels.join('\n') + '\n')
  gevonden.add(p.slug)
}
const mist = PROV.filter((p) => !gevonden.has(p.slug)).map((p) => p.slug)
if (mist.length) throw new Error('geen grens voor ' + mist.join(', '))
console.log('12 grenzen geschreven in', map)
