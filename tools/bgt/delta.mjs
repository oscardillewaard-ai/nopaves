// BGT-delta's (PDOK delta/custom, citygml-mutaties) lezen en toepassen op het afgeleide bestand
// (afgeleid.mjs). Beslissing 6 van docs/PLAN-heel-nederland.md: wekelijks de wijzigingen verwerken.
//
// Een mutatiegroep bevat <ml:toevoeging> (alleen <ml:wordt>), <ml:wijziging> (<ml:was> en <ml:wordt>) of
// <ml:verwijdering> (alleen <ml:was>). Wat we doen:
//   was                         -> het vlak weg (de geometrie van 'was' zegt in welke vakken het staat)
//   wordt, actueel              -> het vlak erin (nieuwe versie)
//   wordt met eindRegistratie   -> niets meer (de oude versie is al weg)
// Citygml schrijft lege velden als 'waardeOnbekend' of 'geenWaarde'; gmllight laat ze weg. Hier: leeg.
import fs from 'node:fs'
import path from 'node:path'
import { polygonen } from './gml.mjs'
import { Schrijver, leesVak, sleutel, sleutelTekst, sleutelUitTekst, vakVanTegel } from './afgeleid.mjs'
import { bboxVan } from './tegels.mjs'
import * as K from '../../public/kern.js'

// citygml-veld per objecttype -> veld zoals in gmllight/vectortegels
const VELDEN = {
  wegdeel: { functie: 'function', fysiek_voorkomen: 'surfaceMaterial', plus_fysiek_voorkomen: 'imgeo:plus-fysiekVoorkomenWegdeel' },
  ondersteunendwegdeel: { functie: 'function', fysiek_voorkomen: 'surfaceMaterial', plus_fysiek_voorkomen: 'imgeo:plus-fysiekVoorkomenOndersteunendWegdeel' },
  begroeidterreindeel: { fysiek_voorkomen: 'class', plus_fysiek_voorkomen: 'imgeo:plus-fysiekVoorkomen' },
  onbegroeidterreindeel: { fysiek_voorkomen: 'imgeo:bgt-fysiekVoorkomen', plus_fysiek_voorkomen: 'imgeo:plus-fysiekVoorkomen' },
  waterdeel: { type: 'class' },
}
const LEEG = new Set(['waardeOnbekend', 'geenWaarde'])

/** De tekst van element <naam ...>tekst</naam>; undefined bij ontbreken, nil of een lege waarde. */
function waarde(tekst, naam) {
  let i = -1
  for (let k = tekst.indexOf('<' + naam); k >= 0; k = tekst.indexOf('<' + naam, k + 1)) {
    const c = tekst[k + naam.length + 1]
    if (c === ' ' || c === '>' || c === '/') { i = k; break }
  }
  if (i < 0) return undefined
  const sluit = tekst.indexOf('>', i)
  if (tekst[sluit - 1] === '/') return undefined // <x xsi:nil="true"/>
  const v = tekst.slice(sluit + 1, tekst.indexOf('<', sluit)).trim()
  return v === '' || LEEG.has(v) ? undefined : v
}

/** Eén object uit een delta: { lokaal_id, actueel, object (zoals gml.mjs) }. */
export function leesCityObject(collectie, tekst) {
  const lokaal_id = waarde(tekst, 'imgeo:lokaalID')
  const props = { lokaal_id }
  const status = waarde(tekst, 'imgeo:bgt-status')
  if (status !== undefined) props.status = status
  for (const [doel, bron] of Object.entries(VELDEN[collectie])) {
    const v = waarde(tekst, bron)
    if (v !== undefined) props[doel] = v
  }
  props.relatieve_hoogteligging = Number(waarde(tekst, 'imgeo:relatieveHoogteligging') || 0)
  const eind = tekst.includes('<imgeo:eindRegistratie>')
  const pol = polygonen(tekst)
  return { lokaal_id, actueel: !eind && (props.status || 'bestaand') === 'bestaand' && pol.length > 0, object: pol.length ? { collectie, props, polygonen: pol } : null }
}

/** Bewerkingen uit een deltabestand (async iterable van tekststukken): { weg: lokaal_id, bbox } of { zet: object }. */
export async function* leesDelta(collectie, stukken, telling = { groepen: 0, weg: 0, zet: 0 }) {
  const BEGIN = '<ml:mutatieGroep>'
  const EIND = '</ml:mutatieGroep>'
  let rest = ''
  for await (const stuk of stukken) {
    const buf = rest + stuk
    let pos = 0
    for (;;) {
      const a = buf.indexOf(BEGIN, pos)
      if (a < 0) { pos = Math.max(pos, buf.length - BEGIN.length + 1); break }
      const b = buf.indexOf(EIND, a)
      if (b < 0) { pos = a; break }
      telling.groepen++
      const groep = buf.slice(a, b)
      // in volgorde van voorkomen: elke was en wordt
      const re = /<ml:(was|wordt)\b[^>]*>([\s\S]*?)<\/ml:\1>/g
      for (let m; (m = re.exec(groep));) {
        const o = leesCityObject(collectie, m[2])
        if (m[1] === 'was') {
          telling.weg++
          yield { weg: o.lokaal_id, bbox: o.object ? bboxVan(o.object.polygonen) : null, was: o.object }
        } else if (o.actueel) {
          telling.zet++
          yield { zet: o.object }
        }
      }
      pos = b + EIND.length
    }
    rest = buf.slice(pos)
  }
}

const vakkenVanBbox = (b) => {
  const [c0, r0] = K.tegelVan(b[0], b[3])
  const [c1, r1] = K.tegelVan(b[2], b[1])
  const [v0, w0] = vakVanTegel(c0, r0)
  const [v1, w1] = vakVanTegel(c1, r1)
  const uit = []
  for (let vc = v0; vc <= v1; vc++) for (let vr = w0; vr <= w1; vr++) uit.push(vc + '_' + vr)
  return uit
}

/**
 * Pas bewerkingen (uit leesDelta, alle dagen achter elkaar, oudste eerst) toe op de vakbestanden van één
 * objecttype in 'map'. Herschrijft alleen de geraakte vakken. Geeft een telling terug.
 * Zonder bbox bij een 'weg' (geen geometrie in 'was') worden alle vakken van dit type doorzocht.
 */
export async function pasToe(map, collectie, bewerkingen) {
  const weg = new Map() // sleutel -> bbox (of null)
  const nieuw = new Map() // sleutel -> object
  let ops = 0
  for await (const op of bewerkingen) {
    ops++
    if (op.weg !== undefined) {
      const k = sleutelTekst(sleutel(collectie + '|' + op.weg))
      nieuw.delete(k)
      const oud = weg.get(k)
      weg.set(k, oud === undefined ? op.bbox : oud && op.bbox ? [Math.min(oud[0], op.bbox[0]), Math.min(oud[1], op.bbox[1]), Math.max(oud[2], op.bbox[2]), Math.max(oud[3], op.bbox[3])] : null)
    } else nieuw.set(sleutelTekst(sleutel(collectie + '|' + op.zet.props.lokaal_id)), op.zet)
  }
  const geraakt = new Set()
  let zonderBbox = false
  for (const b of weg.values()) { if (b) vakkenVanBbox(b).forEach((v) => geraakt.add(v)); else zonderBbox = true }
  for (const o of nieuw.values()) vakkenVanBbox(bboxVan(o.polygonen)).forEach((v) => geraakt.add(v))
  if (zonderBbox) for (const f of fs.readdirSync(map)) { const m = f.match(new RegExp(`^vak_(-?\\d+)_(-?\\d+)\\.${collectie}\\.nbv\\.gz$`)); if (m) geraakt.add(m[1] + '_' + m[2]) }
  const telling = { bewerkingen: ops, weg: weg.size, nieuw: nieuw.size, vakken: geraakt.size, verwijderd: 0, toegevoegd: 0 }
  for (const vak of geraakt) {
    const pad = path.join(map, `vak_${vak}.${collectie}.nbv.gz`)
    const oud = fs.existsSync(pad) ? leesVak(fs.readFileSync(pad)) : []
    const s = new Schrijver(map, collectie, { alleenVak: vak, buffer: Infinity })
    for (const o of oud) {
      const k = o.props.lokaal_id // bij gelezen vakken: de sleutel als tekst
      if (weg.has(k) || nieuw.has(k)) { if (weg.has(k)) telling.verwijderd++; continue }
      s.voegToe(o, sleutelUitTekst(k))
    }
    for (const [k, o] of nieuw) {
      if (!vakkenVanBbox(bboxVan(o.polygonen)).includes(vak)) continue
      s.voegToe(o, sleutelUitTekst(k))
      telling.toegevoegd++
    }
    const overzicht = s.sluit()
    if (!overzicht.length && fs.existsSync(pad)) fs.unlinkSync(pad)
  }
  return telling
}
