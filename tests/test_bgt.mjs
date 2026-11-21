// Unit-tests voor de BGT-download (fase 1 van docs/PLAN-heel-nederland.md): bogen, het lezen van een
// GML-object, het afgeleide bestand heen en terug, en de inhoudsopgave van een zip (ook ZIP64-velden).
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { boog, leesObject, leesGml } from '../tools/bgt/gml.mjs'
import { Schrijver, leesVak, sleutel, sleutelTekst, afgeleideBron } from '../tools/bgt/afgeleid.mjs'
import { tegelsVan } from '../tools/bgt/tegels.mjs'
import * as K from '../public/kern.js'

test('boog: punten op de cirkel, eindpunt exact, richting via het middelste punt', () => {
  const p = boog(10, 0, Math.SQRT1_2 * 10, Math.SQRT1_2 * 10, 0, 10)
  for (let i = 0; i < p.length; i += 2) assert.ok(Math.abs(Math.hypot(p[i], p[i + 1]) - 10) < 1e-9)
  assert.deepEqual(p.slice(-2), [0, 10])
  const onder = boog(10, 0, 0, -10, -10, 0) // halve cirkel via de onderkant
  assert.ok(onder[Math.floor(onder.length / 4) * 2 + 1] < 0)
  assert.deepEqual(boog(0, 0, 1, 1, 2, 2), [1, 1, 2, 2]) // recht
})

const OBJ = (extra = '') => `
  <imgeo-s:Wegdeel gml:id="x"><imgeo-s:identificatie.lokaalID>G0503.abc</imgeo-s:identificatie.lokaalID>${extra}
  <imgeo-s:relatieveHoogteligging>-1</imgeo-s:relatieveHoogteligging><imgeo-s:bgt-status>bestaand</imgeo-s:bgt-status>
  <imgeo-s:bgt-functie>fietspad</imgeo-s:bgt-functie><imgeo-s:bgt-fysiekVoorkomen>half verhard</imgeo-s:bgt-fysiekVoorkomen>
  <imgeo-s:geometrie2d><gml:Polygon><gml:exterior><gml:Ring><gml:curveMember><gml:Curve><gml:segments>
  <gml:Arc><gml:posList>100 0 70.71067811865476 70.71067811865476 0 100</gml:posList></gml:Arc>
  <gml:LineStringSegment><gml:posList>0 100 0 0 100 0</gml:posList></gml:LineStringSegment>
  </gml:segments></gml:Curve></gml:curveMember></gml:Ring></gml:exterior>
  <gml:interior><gml:LinearRing><gml:posList>10 10 20 10 20 20 10 10</gml:posList></gml:LinearRing></gml:interior></gml:Polygon></imgeo-s:geometrie2d>
  <imgeo-s:kruinlijn><gml:LineString><gml:posList>1 1 2 2</gml:posList></gml:LineString></imgeo-s:kruinlijn></imgeo-s:Wegdeel>`

test('leesObject: velden, boog + rechte stukken, gat, kruinlijn genegeerd; historie overgeslagen', () => {
  const o = leesObject('wegdeel', OBJ())
  assert.equal(o.props.lokaal_id, 'G0503.abc')
  assert.equal(o.props.functie, 'fietspad')
  assert.equal(o.props.fysiek_voorkomen, 'half verhard')
  assert.equal(o.props.relatieve_hoogteligging, -1)
  assert.equal(o.polygonen.length, 1)
  assert.equal(o.polygonen[0].length, 2) // buitenring + gat
  const r = o.polygonen[0][0]
  assert.deepEqual([r[0], r[1]], [100, 0])
  assert.deepEqual([...r.slice(-4)], [0, 0, 100, 0])
  assert.equal(leesObject('wegdeel', OBJ('<imgeo-s:eindRegistratie>2020-01-01</imgeo-s:eindRegistratie>')), null)
})

test('leesGml: objecten over stukgrenzen heen', async () => {
  const tekst = '<gml:FeatureCollection>' + ['', '<imgeo-s:eindRegistratie>x</imgeo-s:eindRegistratie>', ''].map((e) => `<gml:featureMember>${OBJ(e)}</gml:featureMember>`).join('') + '</gml:FeatureCollection>'
  async function* stukken() { for (let i = 0; i < tekst.length; i += 97) yield tekst.slice(i, i + 97) }
  const telling = { objecten: 0, historie: 0, zonderVlak: 0, actueel: 0 }
  const uit = []
  for await (const o of leesGml('wegdeel', stukken(), telling)) uit.push(o)
  assert.equal(uit.length, 2)
  assert.deepEqual(telling, { objecten: 3, historie: 1, zonderVlak: 0, actueel: 2 })
})

test('afgeleid bestand: heen en terug op centimeters, ook over een vakgrens; bron per tegel', async () => {
  const map = fs.mkdtempSync(path.join(os.tmpdir(), 'nbv-'))
  const s = new Schrijver(map, 'wegdeel', { buffer: 64 })
  // vierkant van 300 m precies over een vakgrens (vak = 32 tegels van 215,04 m)
  const [x0, y0] = [-285401.92 + 32 * 215.04 * 40 - 150.004, 903401.92 - 32 * 215.04 * 30 - 150.006]
  const ring = Float64Array.from([x0, y0, x0 + 300, y0, x0 + 300, y0 + 300, x0, y0 + 300])
  s.voegToe({ collectie: 'wegdeel', props: { lokaal_id: 'L1', fysiek_voorkomen: 'onverhard', relatieve_hoogteligging: 2 }, polygonen: [[ring]] })
  s.voegToe({ collectie: 'wegdeel', props: { lokaal_id: 'L2', functie: 'voetpad', relatieve_hoogteligging: 0 }, polygonen: [[ring.map((v) => v + 1)]] })
  const vakken = s.sluit()
  assert.equal(vakken.length, 4) // het vierkant raakt vier vakken
  const terug = leesVak(fs.readFileSync(path.join(map, vakken[0].bestand)))
  assert.equal(terug.length, 2)
  assert.equal(terug[0].props.lokaal_id, sleutelTekst(sleutel('wegdeel|L1')))
  assert.equal(terug[0].props.fysiek_voorkomen, 'onverhard')
  assert.equal(terug[0].props.relatieve_hoogteligging, 2)
  assert.equal(terug[1].props.functie, 'voetpad')
  const r = terug[0].polygonen[0][0]
  for (let i = 0; i < ring.length; i++) assert.ok(Math.abs(r[i] - ring[i]) <= 0.005 + 1e-9)
  // bron: elke tegel die het vierkant raakt geeft het vlak, één keer
  const bron = afgeleideBron(map)
  const tegels = tegelsVan([[ring]])
  assert.ok(tegels.length >= 4)
  for (const t of tegels) {
    const l = (await bron(...t.split('/').map(Number))).filter((o) => o.props.lokaal_id === sleutelTekst(sleutel('wegdeel|L1')))
    assert.equal(l.length, 1, 'tegel ' + t)
  }
  assert.deepEqual(await bron(...K.tegelVan(x0 + 5000, y0 + 5000)), [])
  fs.rmSync(map, { recursive: true })
})

test('zip-inhoud: ZIP64-velden en een bestand op afstand gelezen (lokaal nagebootst)', async () => {
  const { inhoud, leesBestand } = await import('../tools/bgt/zip.mjs')
  // kleine zip met één gedeflate bestand, met handgemaakte ZIP64-extra in de inhoudsopgave
  const naam = Buffer.from('bgt_wegdeel.gml')
  const data = Buffer.from('<gml:featureMember>a</gml:featureMember>'.repeat(1000))
  const comp = zlib.deflateRawSync(data)
  const lk = Buffer.alloc(30); lk.writeUInt32LE(0x04034b50, 0); lk.writeUInt16LE(8, 8); lk.writeUInt16LE(naam.length, 26)
  const extra = Buffer.alloc(4 + 24); extra.writeUInt16LE(1, 0); extra.writeUInt16LE(24, 2)
  extra.writeBigUInt64LE(BigInt(data.length), 4); extra.writeBigUInt64LE(BigInt(comp.length), 12); extra.writeBigUInt64LE(0n, 20)
  const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(8, 10)
  cd.writeUInt32LE(0xffffffff, 20); cd.writeUInt32LE(0xffffffff, 24); cd.writeUInt16LE(naam.length, 28); cd.writeUInt16LE(extra.length, 30); cd.writeUInt32LE(0xffffffff, 42)
  const vooraan = Buffer.concat([lk, naam, comp])
  const cdAll = Buffer.concat([cd, naam, extra])
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 10); eocd.writeUInt32LE(cdAll.length, 12); eocd.writeUInt32LE(vooraan.length, 16)
  const zip = Buffer.concat([vooraan, cdAll, eocd])
  const oud = globalThis.fetch
  globalThis.fetch = async (url, { headers }) => {
    const [a, b] = headers.Range.replace('bytes=', '').split('-').map(Number)
    const stuk = zip.subarray(a, b + 1)
    return { status: 206, url, headers: new Map([['content-range', `bytes ${a}-${b}/${zip.length}`]]), arrayBuffer: async () => stuk }
  }
  try {
    const lijst = await inhoud('x', zip.length)
    assert.deepEqual(lijst, [{ naam: 'bgt_wegdeel.gml', methode: 8, gecomprimeerd: comp.length, uitgepakt: data.length, kop: 0 }])
    let tekst = ''
    for await (const s of leesBestand('x', lijst[0], { stromen: 3, stuk: 50 })) tekst += s
    assert.equal(tekst, data.toString())
  } finally {
    globalThis.fetch = oud
  }
})
