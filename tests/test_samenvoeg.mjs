// Fase 3: de grafen van provincies samenvoegen (tools/graaf/samenvoeg.mjs). Toets met de echte graaf van de
// regio Delft: knip hem in twee "provincies" (West: kolommen <= 2097, Oost: >= 2097; in kolom 2097 krijgt West
// de even en Oost de oneven wegstukken, zoals een grensblok uit twee provincies), elk met een eigen rand zoals
// bouw.mjs die maakt, voeg ze samen en vergelijk met het origineel: elk blok, wegstuk, oordeel, hoogte en de rand.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { leesBlok } from '../public/blokgraaf.js'
import { schrijfBlok } from '../tools/graaf/schrijf.mjs'
import { voegBlokkenSamen, bepaalRand, voegSamen } from '../tools/graaf/samenvoeg.mjs'

const GRAAF = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/graaf')
const actueel = JSON.parse(fs.readFileSync(path.join(GRAAF, 'actueel.json'), 'utf8'))
const alle = actueel.blokken.map((b) => ({ x: b.x, y: b.y, blok: leesBlok(zlib.gunzipSync(fs.readFileSync(path.join(GRAAF, b.bestand)))) }))

/** Een blok met alleen de wegstukken die 'houd(s)' kiest (en hun knopen), terug in het leesformaat. */
function deelBlok(src, houd) {
  const b = voegBlokkenSamen([{ ...src, m: src.m }])
  const keep = []
  for (let s = 0; s < b.van.length; s++) if (houd(s)) keep.push(s)
  const gebruikt = new Map()
  const nb = { ...b, lat: [], lon: [], hoogte: [], van: [], naar: [], tag: [], klasse: [], vlag: [], op: [], af: [], osm: [], rleN: [], rleOordeel: [], extra: [], rand: [], buren: [] }
  const kn = (i) => { let j = gebruikt.get(i); if (j === undefined) { j = nb.lat.push(b.lat[i]) - 1; nb.lon.push(b.lon[i]); nb.hoogte.push(b.hoogte[i]); gebruikt.set(i, j) } return j }
  for (const s of keep) {
    nb.van.push(kn(b.van[s])); nb.naar.push(kn(b.naar[s]))
    for (const f of ['tag', 'klasse', 'vlag', 'op', 'af', 'osm', 'rleN', 'rleOordeel', 'extra']) nb[f].push(b[f][s])
  }
  return nb
}

function provincie(filter) {
  const delen = []
  for (const { x, blok } of origineel) {
    const kies = filter(x)
    if (!kies) continue
    const d = deelBlok(blok, kies)
    if (d.van.length || d.pois.length) delen.push(d) // lege blokken slaat leesProvincie ook over
  }
  bepaalRand(delen) // de rand zoals de provincie hem zelf kent: alleen haar eigen blokken
  return { manifest: { ...actueel, stations: actueel.stations }, blokken: delen.map((b) => ({ x: b.blok[0], y: b.blok[1], blok: leesBlok(schrijfBlok(b, { gz: false }).ruw) })) }
}

// drie kolommen rond de grens (2096–2098) houden de toets snel; de grens zelf is kolom 2097
const origineel = alle.filter((b) => b.x >= 2096 && b.x <= 2098)

const sleutelVan = (b, s) => `${b.osm[s]}|${b.lat[b.van[s]]},${b.lon[b.van[s]]}|${b.lat[b.naar[s]]},${b.lon[b.naar[s]]}`
function beschrijf(b) {
  const segs = new Map()
  for (let s = 0; s < b.m; s++) {
    const rle = []
    for (let r = b.rleBegin[s]; r < b.rleBegin[s + 1]; r++) rle.push([b.rleN[r], JSON.stringify(b.oordelen[b.rleOordeel[r]])])
    segs.set(sleutelVan(b, s), JSON.stringify([b.tags[b.tag[s]], b.klasse[s], b.vlag[s], b.op[s], b.af[s], rle, Array.from(b.extra.subarray(b.extraBegin[s], b.extraBegin[s + 1])), b.hoogte[b.van[s]], b.hoogte[b.naar[s]]]))
  }
  const rand = new Map()
  for (let k = 0; k < b.rand.length; k++) rand.set(b.lat[b.rand[k]] + ',' + b.lon[b.rand[k]], b.buren[k])
  return { segs, rand, pois: new Set(b.pois.map((p) => JSON.stringify(p))) }
}

test('bepaalRand voor de hele regio geeft precies de rand die bouw.mjs schreef', () => {
  const blokken = alle.filter((b) => b.blok.m > 0 || b.blok.pois.length).map((b) => voegBlokkenSamen([b.blok]))
  bepaalRand(blokken)
  let n = 0
  for (const b of blokken) {
    const o = alle.find((a) => a.x === b.blok[0] && a.y === b.blok[1]).blok
    const verwacht = new Map(Array.from(o.rand, (k, i) => [o.lat[k] + ',' + o.lon[k], o.buren[i]]))
    const echt = new Map(b.rand.map((k, i) => [b.lat[k] + ',' + b.lon[k], b.buren[i]]))
    assert.deepEqual(echt, verwacht, `rand van ${b.blok}`)
    n += echt.size
  }
  assert.ok(n > 1000)
})

test('samenvoegen: twee provincies met een gedeelde grenskolom geven de oorspronkelijke graaf terug', () => {
  const west = provincie((x) => (x < 2097 ? () => true : x === 2097 ? (s) => s % 2 === 0 : null))
  const oost = provincie((x) => (x > 2097 ? () => true : x === 2097 ? (s) => s % 2 === 1 : null))
  // de knip moet echt iets doen: de grenskolom zit in beide, met een andere rand dan het origineel
  assert.ok(west.blokken.some((b) => b.x === 2097) && oost.blokken.some((b) => b.x === 2097))
  const { manifest, bestanden } = voegSamen([west, oost], 'proef')
  assert.equal(manifest.totaal.randblokken, origineel.filter((b) => b.x === 2097 && b.blok.m > 1).length)
  const samen = new Map(bestanden.map(([naam, gz]) => [naam, leesBlok(zlib.gunzipSync(gz))]))
  // verwachting: dezelfde drie kolommen ongeknipt, met de rand binnen die drie kolommen
  const heel = origineel.filter((b) => b.blok.m > 0 || b.blok.pois.length).map((b) => voegBlokkenSamen([b.blok]))
  bepaalRand(heel)
  const verwacht = new Map(heel.map((b) => [b.blok.join('/'), leesBlok(schrijfBlok(b, { gz: false }).ruw)]))
  let segmenten = 0
  for (const { x, y, blok } of origineel) {
    if (blok.m === 0 && blok.pois.length === 0) continue
    const s = samen.get(`z12_${x}_${y}.npg.gz`)
    assert.ok(s, `blok ${x}/${y} ontbreekt`)
    const a = beschrijf(verwacht.get(x + '/' + y))
    const b = beschrijf(s)
    assert.equal(a.segs.size, blok.m) // de verwachting heeft alle wegstukken van het origineel
    assert.equal(b.segs.size, a.segs.size, `wegstukken in ${x}/${y}`)
    for (const [k, v] of a.segs) assert.equal(b.segs.get(k), v, `wegstuk ${k} in ${x}/${y}`)
    assert.deepEqual(b.rand, a.rand, `rand van ${x}/${y}`)
    assert.deepEqual(b.pois, a.pois)
    segmenten += a.segs.size
  }
  assert.equal(manifest.totaal.wegstukken, segmenten)
  assert.equal(manifest.stations.length, actueel.stations.length) // dubbele stations eruit
})
