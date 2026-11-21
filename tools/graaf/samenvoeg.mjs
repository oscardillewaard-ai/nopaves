// Fase 3 van docs/PLAN-heel-nederland.md: de grafen van de 12 provincies samenvoegen tot één graaf voor heel
// NL, in hetzelfde formaat (NPG1) en met hetzelfde soort manifest als nu, zodat de app hem zonder wijziging
// leest (buiten de dekking valt de app vanzelf terug op de kaarttegels).
//
//   node --max-old-space-size=12000 tools/graaf/samenvoeg.mjs --versie nlJJJJMMDD-rN --uit <map> <provinciemap> ...
//
// Een provinciemap bevat <versie>/manifest.json en de blokken (bouw.mjs --uit). Wat er gebeurt:
//   1. blokken met dezelfde (x, y) uit twee provincies (op de grens) worden één blok: knopen samen op lat/lon,
//      wegstukken samen op OSM-id + begin- en eindknoop, tabellen (tags, oordelen) opnieuw genummerd;
//   2. de rand (knopen die ook in een ander blok voorkomen, met de richting van die buren) wordt voor heel NL
//      opnieuw bepaald: een provincie kent de blokken van haar buren niet;
//   3. één manifest (NPG1) met alle blokken en de stations (zonder dubbele).
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { leesBlok } from '../../public/blokgraaf.js'
import { schrijfBlok } from './schrijf.mjs'

const RICHTING = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]
// knoop-sleutel als getal: (lat×1e7 − 5e8) × 1e8 + lon×1e7; past voor NL (lat 50,7–53,7, lon 3,3–7,3) ruim in 2^53
const knoopSleutel = (lat, lon) => (lat - 5e8) * 1e8 + lon

/** Lees een provinciemap: { manifest, blokken: [{ x, y, blok }] }. */
export function leesProvincie(map) {
  const versie = fs.readdirSync(map).find((d) => fs.existsSync(path.join(map, d, 'manifest.json')))
  if (!versie) throw new Error('geen manifest in ' + map)
  const manifest = JSON.parse(fs.readFileSync(path.join(map, versie, 'manifest.json'), 'utf8'))
  const blokken = manifest.blokken.filter((b) => b.wegstukken > 0 || b.pois > 0).map((b) => ({ x: b.x, y: b.y, blok: leesBlok(zlib.gunzipSync(fs.readFileSync(path.join(map, versie, b.bestand)))) }))
  return { manifest, blokken }
}

/** Voeg gelezen blokken (zelfde x, y) samen tot een object voor schrijfBlok (zonder rand). */
export function voegBlokkenSamen(bronnen) {
  const b = { blok: bronnen[0].blok, lat: [], lon: [], hoogte: [], van: [], naar: [], tag: [], klasse: [], vlag: [], op: [], af: [], osm: [], rleN: [], rleOordeel: [], extra: [], tags: [], oordelen: [], pois: [], rand: [], buren: [] }
  const knopen = new Map()
  const tagIndex = new Map()
  const oordeelIndex = new Map()
  const gezien = new Set()
  const poiGezien = new Set()
  const knoop = (src, i) => {
    const k = knoopSleutel(src.lat[i], src.lon[i])
    let j = knopen.get(k)
    if (j === undefined) {
      j = b.lat.push(src.lat[i]) - 1
      b.lon.push(src.lon[i])
      b.hoogte.push(src.hoogte[i])
      knopen.set(k, j)
    }
    return j
  }
  for (const src of bronnen) {
    for (let s = 0; s < src.m; s++) {
      const sleutel = src.osm[s] + '|' + knoopSleutel(src.lat[src.van[s]], src.lon[src.van[s]]) + '|' + knoopSleutel(src.lat[src.naar[s]], src.lon[src.naar[s]])
      if (gezien.has(sleutel)) continue
      gezien.add(sleutel)
      b.van.push(knoop(src, src.van[s]))
      b.naar.push(knoop(src, src.naar[s]))
      const tekst = src.tags[src.tag[s]]
      let t = tagIndex.get(tekst)
      if (t === undefined) { t = b.tags.push(tekst) - 1; tagIndex.set(tekst, t) }
      b.tag.push(t)
      b.klasse.push(src.klasse[s])
      b.vlag.push(src.vlag[s])
      b.op.push(src.op[s])
      b.af.push(src.af[s])
      b.osm.push(src.osm[s])
      const n = []
      const o = []
      for (let r = src.rleBegin[s]; r < src.rleBegin[s + 1]; r++) {
        n.push(src.rleN[r])
        const rij = src.oordelen[src.rleOordeel[r]]
        const k = JSON.stringify(rij)
        let oi = oordeelIndex.get(k)
        if (oi === undefined) { oi = b.oordelen.push(rij) - 1; oordeelIndex.set(k, oi) }
        o.push(oi)
      }
      b.rleN.push(n)
      b.rleOordeel.push(o)
      b.extra.push(Array.from(src.extra.subarray(src.extraBegin[s], src.extraBegin[s + 1])))
    }
    for (const p of src.pois) {
      const k = JSON.stringify(p)
      if (!poiGezien.has(k)) { poiGezien.add(k); b.pois.push(p) }
    }
  }
  return b
}

/** Rand en buren voor alle blokken (in place): een knoop die ook in een ander blok zit, met de richting. */
export function bepaalRand(blokken) {
  const eerste = new Map() // knoop -> index van het eerste blok
  const meer = new Map() // knoop -> Set(blokindex) als het in meer dan één blok zit
  blokken.forEach((b, bi) => {
    for (let i = 0; i < b.lat.length; i++) {
      const k = knoopSleutel(b.lat[i], b.lon[i])
      const e = eerste.get(k)
      if (e === undefined) eerste.set(k, bi)
      else if (e !== bi) {
        let st = meer.get(k)
        if (!st) meer.set(k, (st = new Set([e])))
        st.add(bi)
      }
    }
  })
  blokken.forEach((b, bi) => {
    b.rand = []
    b.buren = []
    const [bx, by] = b.blok
    for (let i = 0; i < b.lat.length; i++) {
      const st = meer.get(knoopSleutel(b.lat[i], b.lon[i]))
      if (!st || !st.has(bi)) continue
      let mask = 0
      for (const andere of st) {
        if (andere === bi) continue
        const [ox, oy] = blokken[andere].blok
        const r = RICHTING.findIndex(([dx, dy]) => dx === ox - bx && dy === oy - by)
        if (r >= 0) mask |= 1 << r
      }
      b.rand.push(i)
      b.buren.push(mask)
    }
  })
}

/** Alles samen: geeft { manifest, bestanden: [[naam, gz]] }. */
export function voegSamen(provincies, versie) {
  const groepen = new Map()
  for (const p of provincies) for (const { x, y, blok } of p.blokken) {
    const k = x + '/' + y
    if (!groepen.has(k)) groepen.set(k, [])
    groepen.get(k).push(blok)
  }
  const sleutels = [...groepen.keys()].sort((a, b) => { const [ax, ay] = a.split('/').map(Number); const [bx, by] = b.split('/').map(Number); return ax - bx || ay - by })
  const blokken = sleutels.map((k) => voegBlokkenSamen(groepen.get(k)))
  bepaalRand(blokken)
  const lijst = []
  const bestanden = []
  for (const b of blokken) {
    const { ruw, gz } = schrijfBlok(b)
    const [bx, by] = b.blok
    const bestand = `z12_${bx}_${by}.npg.gz`
    bestanden.push([bestand, gz])
    lijst.push({ x: bx, y: by, bestand, ruw: ruw.length, gz: gz.length, sha256: crypto.createHash('sha256').update(gz).digest('hex').slice(0, 16), knopen: b.lat.length, wegstukken: b.van.length, rand: b.rand.length, pois: b.pois.length, bronnen: groepen.get(bx + '/' + by).length })
  }
  // stations zonder dubbele (zelfde naam en plek op 1e-5 graad)
  const gezienSt = new Set()
  const stations = []
  for (const p of provincies) for (const s of p.manifest.stations || []) {
    const k = `${s.naam}|${s.lat.toFixed(5)}|${s.lon.toFixed(5)}`
    if (!gezienSt.has(k)) { gezienSt.add(k); stations.push(s) }
  }
  const xs = lijst.map((b) => b.x)
  const ys = lijst.map((b) => b.y)
  const bbox = provincies.reduce((a, p) => { const q = p.manifest.regio.bbox; return [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[2], q[2]), Math.max(a[3], q[3])] }, [Infinity, Infinity, -Infinity, -Infinity])
  const som = (k) => lijst.reduce((t, b) => t + b[k], 0)
  const eerste = provincies[0].manifest
  const manifest = {
    formaat: 'NPG1', versie, datum: new Date().toISOString().slice(0, 10), gebouwd: new Date().toISOString(),
    regio: { naam: 'nederland', zoom: 12, bbox, blokken_x: [Math.min(...xs), Math.max(...xs)], blokken_y: [Math.min(...ys), Math.max(...ys)] },
    bronnen: eerste.bronnen,
    provincies: provincies.map((p) => ({ naam: p.manifest.regio.naam, versie: p.manifest.versie, blokken: p.blokken.length, wegstukken: p.manifest.totaal.wegstukken, bouwtijdSeconden: p.manifest.bouwtijdSeconden })),
    totaal: { blokken: lijst.length, ruw: som('ruw'), gz: som('gz'), knopen: som('knopen'), wegstukken: som('wegstukken'), randblokken: lijst.filter((b) => b.bronnen > 1).length },
    blokken: lijst,
    stations,
  }
  return { manifest, bestanden }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const arg = (n) => { const i = args.indexOf(n); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v }
  const versie = arg('--versie')
  const uit = arg('--uit')
  if (!versie || !uit || !args.length) throw new Error('gebruik: samenvoeg.mjs --versie <v> --uit <map> <provinciemap> ...')
  const t0 = Date.now()
  const provincies = args.map(leesProvincie)
  const { manifest, bestanden } = voegSamen(provincies, versie)
  const map = path.join(uit, versie)
  fs.mkdirSync(map, { recursive: true })
  for (const [naam, gz] of bestanden) fs.writeFileSync(path.join(map, naam), gz)
  fs.writeFileSync(path.join(map, 'manifest.json'), JSON.stringify(manifest, null, 1))
  const actueel = { ...manifest, blokken: manifest.blokken.map((b) => ({ ...b, bestand: `${versie}/${b.bestand}` })) }
  fs.writeFileSync(path.join(uit, 'actueel.json'), JSON.stringify(actueel))
  console.log(JSON.stringify({ ...manifest.totaal, stations: manifest.stations.length, seconden: Math.round((Date.now() - t0) / 1000), actueelBytes: fs.statSync(path.join(uit, 'actueel.json')).size }))
}
