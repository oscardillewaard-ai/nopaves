// Fase 0 (docs/PLAN-heel-nederland.md): grenzen van een provincie uit het .poly-bestand van Geofabrik.
//
//   node tools/fase0/poly.mjs <slug>.poly <map>
//
// Schrijft in <map>: bbox.txt (lon/lat, voor bron_pbf.py), regio.json (zoom-12-blokken, voor
// bouw.mjs --regio) en rd.wkt (de bbox in RD, EPSG:28992, als geofilter voor de BGT-download).
// De bbox is ruimer dan de provincie (ook water en buurprovincies); voor de metingen is dat goed genoeg,
// in de echte bouw moet de samenvoegstap overlappende randblokken oplossen.
import fs from 'node:fs'
import path from 'node:path'
import * as K from '../../public/kern.js'
import * as T from '../../public/osmtegels.js'

export function leesPoly(tekst) {
  const punten = []
  for (const regel of tekst.split('\n')) {
    const d = regel.trim().split(/\s+/)
    if (d.length === 2 && !Number.isNaN(+d[0]) && !Number.isNaN(+d[1])) punten.push([+d[0], +d[1]])
  }
  const lons = punten.map((p) => p[0])
  const lats = punten.map((p) => p[1])
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
}

export function regioVanBbox(naam, [w, s, e, n]) {
  const [x0, y0] = T.tegelXY(n, w, 12)
  const [x1, y1] = T.tegelXY(s, e, 12)
  return { naam, omschrijving: `Fase 0: bbox van ${naam} (Geofabrik-poly)`, zoom: 12, blokken_x: [x0, x1], blokken_y: [y0, y1], bbox_lonlat: [w, s, e, n] }
}

export function rdWkt([w, s, e, n]) {
  const hoeken = [[w, s], [e, s], [e, n], [w, n]].map(([lo, la]) => K.naarRd(lo, la))
  const xs = hoeken.map((p) => p[0])
  const ys = hoeken.map((p) => p[1])
  const [a, b, c, d] = [Math.floor(Math.min(...xs)), Math.floor(Math.min(...ys)), Math.ceil(Math.max(...xs)), Math.ceil(Math.max(...ys))]
  return `POLYGON((${a} ${b},${c} ${b},${c} ${d},${a} ${d},${a} ${b}))`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [polyPad, map] = process.argv.slice(2)
  const naam = path.basename(polyPad, '.poly')
  const bbox = leesPoly(fs.readFileSync(polyPad, 'utf8')).map((v) => +v.toFixed(4))
  fs.mkdirSync(map, { recursive: true })
  fs.writeFileSync(path.join(map, 'bbox.txt'), bbox.join(' '))
  const regio = regioVanBbox(naam, bbox)
  fs.writeFileSync(path.join(map, 'regio.json'), JSON.stringify(regio, null, 1))
  fs.writeFileSync(path.join(map, 'rd.wkt'), rdWkt(bbox))
  const blokken = (regio.blokken_x[1] - regio.blokken_x[0] + 1) * (regio.blokken_y[1] - regio.blokken_y[0] + 1)
  console.log(naam, 'bbox', bbox.join(' '), 'blokken (rechthoek)', blokken, 'rd', rdWkt(bbox))
}
