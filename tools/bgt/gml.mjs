// BGT-gmllight (PDOK-download) stromend lezen: objecten met de velden die de app gebruikt en hun vlakken
// in RD, zonder historische versies. Fase 1 van docs/PLAN-heel-nederland.md.
//
// Eén object staat tussen <gml:featureMember> en </gml:featureMember>. We lezen de tekst in stukken (een
// bestand voor heel NL is tot 42 GB uitgepakt) en knippen op die grenzen; per object halen we de velden met
// een eenvoudige zoekactie op (het formaat is vast en machinaal gemaakt, geen vrije XML).
//
// Uitvoer per object, hetzelfde als K.leesTegel voor een vectortegel:
//   { collectie, props: { lokaal_id, status, relatieve_hoogteligging, functie?, fysiek_voorkomen?,
//     plus_fysiek_voorkomen?, type? }, polygonen: [[Float64Array buitenring, ...gaten], ...] }

const VELDEN = [
  ['identificatie.lokaalID', 'lokaal_id'],
  ['bgt-status', 'status'],
  ['bgt-functie', 'functie'],
  ['bgt-fysiekVoorkomen', 'fysiek_voorkomen'],
  ['plus-fysiekVoorkomen', 'plus_fysiek_voorkomen'],
  ['bgt-type', 'type'],
]
const BEGIN = '<gml:featureMember>'
const EIND = '</gml:featureMember>'
export const BOOG_TOL_M = 0.05 // bogen als rechte stukjes, hooguit 5 cm ernaast (zo nauwkeurig zijn de vectortegels)

function veld(tekst, naam) {
  const open = `<imgeo-s:${naam}>`
  const i = tekst.indexOf(open)
  if (i < 0) return undefined
  const j = tekst.indexOf('<', i + open.length)
  return ontsnap(tekst.slice(i + open.length, j))
}
const ontsnap = (s) => (s.includes('&') ? s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&') : s)

function getallen(s) {
  const d = s.trim().split(/\s+/)
  const uit = new Array(d.length)
  for (let i = 0; i < d.length; i++) uit[i] = +d[i]
  return uit
}

/** Boog door drie punten als rechte stukjes (zonder het beginpunt). */
export function boog(x1, y1, x2, y2, x3, y3, tol = BOOG_TOL_M) {
  const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2))
  if (Math.abs(d) < 1e-9) return [x2, y2, x3, y3] // (bijna) recht
  const q1 = x1 * x1 + y1 * y1
  const q2 = x2 * x2 + y2 * y2
  const q3 = x3 * x3 + y3 * y3
  const cx = (q1 * (y2 - y3) + q2 * (y3 - y1) + q3 * (y1 - y2)) / d
  const cy = (q1 * (x3 - x2) + q2 * (x1 - x3) + q3 * (x2 - x1)) / d
  const r = Math.hypot(x1 - cx, y1 - cy)
  const a1 = Math.atan2(y1 - cy, x1 - cx)
  let a2 = Math.atan2(y2 - cy, x2 - cx)
  let a3 = Math.atan2(y3 - cy, x3 - cx)
  // richting: via het middelste punt
  const ccw = d > 0
  const norm = (a) => { while (ccw ? a < a1 : a > a1) a += ccw ? 2 * Math.PI : -2 * Math.PI; return a }
  a2 = norm(a2)
  a3 = norm(a3)
  const hoek = a3 - a1
  const stap = r > tol ? 2 * Math.acos(Math.max(-1, 1 - tol / r)) : Math.PI / 4
  const n = Math.max(2, Math.min(256, Math.ceil(Math.abs(hoek) / stap)))
  const uit = []
  for (let k = 1; k < n; k++) {
    const a = a1 + (hoek * k) / n
    uit.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  uit.push(x3, y3)
  return uit
}

/** Eén ring (LinearRing of Ring met Curve-segmenten) als vlakke reeks x,y. */
function ring(tekst) {
  if (tekst.includes('<gml:Arc') || tekst.includes('<gml:LineStringSegment')) {
    const pts = []
    const re = /<gml:(Arc|LineStringSegment)>\s*<gml:posList[^>]*>([^<]*)</g
    for (let m; (m = re.exec(tekst));) {
      const p = getallen(m[2])
      if (!pts.length) pts.push(p[0], p[1])
      if (m[1] === 'Arc') {
        for (let i = 0; i + 5 < p.length; i += 4) pts.push(...boog(p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5]))
      } else for (let i = 2; i < p.length; i++) pts.push(p[i])
    }
    return Float64Array.from(pts)
  }
  const m = /<gml:posList[^>]*>([^<]*)</.exec(tekst)
  return m ? Float64Array.from(getallen(m[1])) : null
}

/** Alle polygonen in het geometrie2d-blok. */
function polygonen(tekst) {
  const i = tekst.indexOf('<imgeo-s:geometrie2d>')
  if (i < 0) return []
  const j = tekst.indexOf('</imgeo-s:geometrie2d>', i)
  const g = tekst.slice(i, j)
  const uit = []
  for (const deel of g.split('<gml:Polygon').slice(1)) {
    const ringen = []
    for (const stuk of deel.split(/<gml:(?:exterior|interior)>/).slice(1)) {
      const r = ring(stuk)
      if (r && r.length >= 6) ringen.push(r)
    }
    if (ringen.length) uit.push(ringen)
  }
  return uit
}

/** Lees één object; null bij een historische versie of zonder vlak. */
export function leesObject(collectie, tekst, telling = null) {
  if (tekst.includes('<imgeo-s:eindRegistratie>')) { if (telling) telling.historie++; return null }
  const props = {}
  for (const [bron, doel] of VELDEN) {
    const v = veld(tekst, bron)
    if (v !== undefined) props[doel] = v
  }
  props.relatieve_hoogteligging = Number(veld(tekst, 'relatieveHoogteligging') || 0)
  const p = polygonen(tekst)
  if (!p.length) { if (telling) telling.zonderVlak++; return null }
  if (telling) telling.actueel++
  return { collectie, props, polygonen: p }
}

/**
 * Objecten uit een stroom tekststukken (async iterable van strings), als async generator.
 * telling (optioneel) houdt bij: objecten, historie, zonderVlak, actueel.
 */
export async function* leesGml(collectie, stukken, telling = { objecten: 0, historie: 0, zonderVlak: 0, actueel: 0 }) {
  let rest = ''
  for await (const stuk of stukken) {
    let buf = rest + stuk
    let pos = 0
    for (;;) {
      const a = buf.indexOf(BEGIN, pos)
      // geen begin meer: bewaar het staartje dat het begin van '<gml:featureMember>' kan zijn
      if (a < 0) { pos = Math.max(pos, buf.length - BEGIN.length + 1); break }
      const b = buf.indexOf(EIND, a)
      if (b < 0) { pos = a; break }
      telling.objecten++
      const o = leesObject(collectie, buf.slice(a + BEGIN.length, b), telling)
      if (o) yield o
      pos = b + EIND.length
    }
    rest = buf.slice(pos)
    buf = null
  }
}

/** Collectienaam uit een bestandsnaam in de zip (bgt_wegdeel.gml -> wegdeel). */
export const collectieVan = (naam) => naam.replace(/^.*bgt_/, '').replace(/\.gml$/, '')
