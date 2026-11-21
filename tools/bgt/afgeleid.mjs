// Het afgeleide BGT-bestand (NBV1): alleen de actuele vlakken die de app gebruikt, compact, per vak van
// 32 × 32 tegels (6,88 km) en per objecttype één gzip-bestand. Fase 1 van docs/PLAN-heel-nederland.md.
//
// Bestand vak_<vc>_<vr>.<collectie>.nbv.gz, uitgepakt:
//   'NBV1', u32 kopLengte, kop (JSON: { vak, collectie, n, tabellen: { functie, fysiek, plus, type } })
//   daarna per vlak (varints, zigzag waar het teken telt):
//     id (2 × u32: 64-bits sleutel van lokaal_id), functie, fysiek, plus, type (index + 1, 0 = leeg),
//     niveau (zigzag), aantal polygonen; per polygoon aantal ringen; per ring aantal punten en de punten
//     in centimeters RD (eerste punt ten opzichte van het vorige punt in dit bestand; zigzag-delta).
// Een vlak staat in elk vak dat zijn bbox raakt. De bouw vraagt per tegel (tegelBron), net als bij de
// vectortegels; dubbele vlakken uit buurtegels haalt BgtVlakken eruit op lokaal_id.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import * as K from '../../public/kern.js'
import { bboxVan, tegelsVan } from './tegels.mjs'

export const VAK = 32 // tegels per vakzijde
const VELDEN = [['functie', 'functie'], ['fysiek', 'fysiek_voorkomen'], ['plus', 'plus_fysiek_voorkomen'], ['type', 'type']]

/** 64-bits sleutel van een lokaal_id als twee 32-bits FNV-1a-hashes (verschillende start). */
export function sleutel(s) {
  let a = 0x811c9dc5
  let b = 0x01000193 ^ 0x5bd1e995
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    a = Math.imul(a ^ c, 0x01000193)
    b = Math.imul(b ^ c, 0x01000193) ^ (b >>> 15)
  }
  return [a >>> 0, b >>> 0]
}
export const sleutelTekst = ([a, b]) => a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')
export const sleutelUitTekst = (t) => [parseInt(t.slice(0, 8), 16), parseInt(t.slice(8), 16)]

export const vakVanTegel = (col, row) => [Math.floor(col / VAK), Math.floor(row / VAK)]

class Bytes {
  constructor(n = 1 << 12) { this.b = Buffer.allocUnsafe(n); this.n = 0 }
  ruimte(k) { if (this.n + k > this.b.length) { const nb = Buffer.allocUnsafe(Math.max(this.b.length * 2, this.n + k)); this.b.copy(nb, 0, 0, this.n); this.b = nb } }
  varint(v) { this.ruimte(10); while (v >= 0x80) { this.b[this.n++] = (v % 0x80) | 0x80; v = Math.floor(v / 0x80) } this.b[this.n++] = v }
  zz(v) { this.varint(v >= 0 ? v * 2 : -v * 2 - 1) }
  inhoud() { return this.b.subarray(0, this.n) }
}

/** Schrijft de vlakken van één objecttype naar vakbestanden in 'map'. */
export class Schrijver {
  constructor(map, collectie, { buffer = 256 << 10, alleenVak = null } = {}) {
    this.map = map
    this.collectie = collectie
    this.alleenVak = alleenVak // 'vc_vr': alleen dit vak schrijven (delta's: één vak herschrijven)
    this.vakken = new Map() // 'vc_vr' -> { b, n, tabellen, vx, vy, tijdelijk } (b wordt bij 'buffer' bytes naar schijf geschreven)
    this.buffer = buffer
    this.aantal = 0
    fs.mkdirSync(map, { recursive: true })
  }
  vak(k) {
    let v = this.vakken.get(k)
    if (!v) {
      v = { b: new Bytes(), n: 0, tabellen: { functie: new Map(), fysiek: new Map(), plus: new Map(), type: new Map() }, vx: 0, vy: 0, tijdelijk: path.join(this.map, `.${k}.${this.collectie}.deel`) }
      this.vakken.set(k, v)
    }
    return v
  }
  /** Voeg een vlak toe; sleutelPaar standaard uit collectie|lokaal_id (bij herschrijven: de bewaarde sleutel). */
  voegToe(o, sleutelPaar = null) {
    const bbox = bboxVan(o.polygonen)
    const [c0, r0] = K.tegelVan(bbox[0], bbox[3])
    const [c1, r1] = K.tegelVan(bbox[2], bbox[1])
    const [v0, w0] = vakVanTegel(c0, r0)
    const [v1, w1] = vakVanTegel(c1, r1)
    const [ha, hb] = sleutelPaar || sleutel(this.collectie + '|' + o.props.lokaal_id)
    for (let vc = v0; vc <= v1; vc++) for (let vr = w0; vr <= w1; vr++) {
      if (this.alleenVak && this.alleenVak !== vc + '_' + vr) continue
      const v = this.vak(vc + '_' + vr)
      const b = v.b
      b.varint(ha)
      b.varint(hb)
      for (const [kort, lang] of VELDEN) {
        const w = o.props[lang]
        if (w === undefined || w === '') { b.varint(0); continue }
        let i = v.tabellen[kort].get(w)
        if (i === undefined) {
          i = v.tabellen[kort].size
          // een echte kopie: een uitgeknipte string houdt in V8 anders het hele tekstblok (~60 MB) vast
          v.tabellen[kort].set(Buffer.from(w, 'utf8').toString('utf8'), i)
        }
        b.varint(i + 1)
      }
      b.zz(Number(o.props.relatieve_hoogteligging) || 0)
      b.varint(o.polygonen.length)
      for (const ringen of o.polygonen) {
        b.varint(ringen.length)
        for (const r of ringen) {
          b.varint(r.length / 2)
          for (let i = 0; i < r.length; i += 2) {
            const x = Math.round(r[i] * 100)
            const y = Math.round(r[i + 1] * 100)
            b.zz(x - v.vx)
            b.zz(y - v.vy)
            v.vx = x
            v.vy = y
          }
        }
      }
      v.n++
      if (b.n > this.buffer) { fs.appendFileSync(v.tijdelijk, b.inhoud()); v.b = new Bytes() }
    }
    this.aantal++
  }
  /** Schrijf alle vakken weg; geeft een overzicht per vak. */
  sluit() {
    const overzicht = []
    for (const [k, v] of this.vakken) {
      const [vc, vr] = k.split('_').map(Number)
      const kop = Buffer.from(JSON.stringify({ vak: [vc, vr], collectie: this.collectie, n: v.n, tabellen: Object.fromEntries(Object.entries(v.tabellen).map(([t, m]) => [t, [...m.keys()]])) }))
      const lengte = Buffer.alloc(4)
      lengte.writeUInt32LE(kop.length)
      const delen = [Buffer.from('NBV1'), lengte, kop]
      if (fs.existsSync(v.tijdelijk)) { delen.push(fs.readFileSync(v.tijdelijk)); fs.unlinkSync(v.tijdelijk) }
      delen.push(v.b.inhoud())
      const gz = zlib.gzipSync(Buffer.concat(delen), { level: 6 })
      const bestand = `vak_${vc}_${vr}.${this.collectie}.nbv.gz`
      fs.writeFileSync(path.join(this.map, bestand), gz)
      overzicht.push({ bestand, vak: [vc, vr], n: v.n, gz: gz.length })
    }
    return overzicht
  }
}

/** Lees één vakbestand: [{ collectie, props, polygonen }] (props.lokaal_id = de sleutel als tekst). */
export function leesVak(gz) {
  const b = zlib.gunzipSync(gz)
  if (b.toString('latin1', 0, 4) !== 'NBV1') throw new Error('geen NBV1-bestand')
  const kl = b.readUInt32LE(4)
  const kop = JSON.parse(b.toString('utf8', 8, 8 + kl))
  let p = 8 + kl
  const varint = () => { let v = 0, f = 1, c; do { c = b[p++]; v += (c & 0x7f) * f; f *= 128 } while (c & 0x80); return v }
  const zz = () => { const v = varint(); return v % 2 ? -(v + 1) / 2 : v / 2 }
  const uit = new Array(kop.n)
  let x = 0, y = 0
  for (let k = 0; k < kop.n; k++) {
    const ha = varint()
    const hb = varint()
    const props = { lokaal_id: sleutelTekst([ha, hb]), status: 'bestaand' }
    for (const [kort, lang] of VELDEN) { const i = varint(); if (i) props[lang] = kop.tabellen[kort][i - 1] }
    props.relatieve_hoogteligging = zz()
    const np = varint()
    const polygonen = new Array(np)
    for (let a = 0; a < np; a++) {
      const nr = varint()
      const ringen = new Array(nr)
      for (let c = 0; c < nr; c++) {
        const n = varint()
        const r = new Float64Array(n * 2)
        for (let i = 0; i < n * 2; i += 2) { x += zz(); y += zz(); r[i] = x / 100; r[i + 1] = y / 100 }
        ringen[c] = r
      }
      polygonen[a] = ringen
    }
    uit[k] = { collectie: kop.collectie, props, polygonen }
  }
  return uit
}

/**
 * tegelBron voor bouw.mjs (vlakkenVoor(tegels, bron)) uit een map met vakbestanden. Houdt de laatst
 * gebruikte vakken in het geheugen (maxVakken).
 */
export function afgeleideBron(map, { maxVakken = 24, collecties = [...K.BGT_COLLECTIES, 'waterdeel'] } = {}) {
  const cache = new Map()
  const vakTegels = (vc, vr) => {
    const k = vc + '_' + vr
    let t = cache.get(k)
    if (t) { cache.delete(k); cache.set(k, t); return t }
    t = new Map()
    for (const c of collecties) {
      const pad = path.join(map, `vak_${vc}_${vr}.${c}.nbv.gz`)
      if (!fs.existsSync(pad)) continue
      for (const o of leesVak(fs.readFileSync(pad))) {
        for (const tk of tegelsVan(o.polygonen)) {
          const [col, row] = tk.split('/').map(Number)
          const [a, b] = vakVanTegel(col, row)
          if (a !== vc || b !== vr) continue // die tegel hoort bij een ander vak; daar staat het vlak ook
          const l = t.get(tk)
          if (l) l.push(o)
          else t.set(tk, [o])
        }
      }
    }
    cache.set(k, t)
    if (cache.size > maxVakken) cache.delete(cache.keys().next().value)
    return t
  }
  return async (col, row) => {
    const [vc, vr] = vakVanTegel(col, row)
    return vakTegels(vc, vr).get(col + '/' + row) || []
  }
}
