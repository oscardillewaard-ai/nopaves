// Contrast (WCAG 2.1) en kleurenblindheid (Machado e.a. 2009, ernst 1,0) voor de ontwerprichtingen.
//   node tools/ontwerp/kleurcheck.mjs            alle richtingen uit public/ontwerp/tokens.js
//   node tools/ontwerp/kleurcheck.mjs korrel     één richting
// Meldt: tekstcontrast (>= 4,5), routelijnen tegen de kaart (>= 3), en per simulatie het kleinste
// onderling verschil (CIEDE2000) tussen de vijf ondergrondklassen.

export function hexNaarRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const gam = (c) => Math.round(255 * Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)))
export function luminantie(hex) {
  const [r, g, b] = hexNaarRgb(hex).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a, b) {
  const [x, y] = [luminantie(a), luminantie(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const MATRIX = {
  deuteranopie: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  protanopie: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  tritanopie: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
}
export function simuleer(hex, soort) {
  const rgb = hexNaarRgb(hex).map(lin)
  const m = MATRIX[soort]
  const uit = m.map((rij) => rij[0] * rgb[0] + rij[1] * rgb[1] + rij[2] * rgb[2])
  return '#' + uit.map(gam).map((v) => v.toString(16).padStart(2, '0')).join('')
}
function lab(hex) {
  const [r, g, b] = hexNaarRgb(hex).map(lin)
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047)
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b)
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
/** CIEDE2000 */
export function deltaE(a, b) {
  const [L1, a1, b1] = lab(a)
  const [L2, a2, b2] = lab(b)
  const rad = Math.PI / 180
  const C1 = Math.hypot(a1, b1)
  const C2 = Math.hypot(a2, b2)
  const Cm = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
  const a1p = (1 + G) * a1
  const a2p = (1 + G) * a2
  const C1p = Math.hypot(a1p, b1)
  const C2p = Math.hypot(a2p, b2)
  const h = (bb, ap) => { const v = Math.atan2(bb, ap) / rad; return v < 0 ? v + 360 : v }
  const h1p = h(b1, a1p)
  const h2p = h(b2, a2p)
  const dL = L2 - L1
  const dC = C2p - C1p
  let dh = h2p - h1p
  if (C1p * C2p === 0) dh = 0
  else if (dh > 180) dh -= 360
  else if (dh < -180) dh += 360
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * rad)
  const Lm = (L1 + L2) / 2
  const Cmp = (C1p + C2p) / 2
  let hm = h1p + h2p
  if (C1p * C2p !== 0) hm = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad)
  const dTheta = 30 * Math.exp(-(((hm - 275) / 25) ** 2))
  const RC = 2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7))
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2)
  const SC = 1 + 0.045 * Cmp
  const SH = 1 + 0.015 * Cmp * T
  const RT = -Math.sin(2 * dTheta * rad) * RC
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))
}

/** Het kleinste onderlinge verschil tussen klassekleuren, en welk paar. */
export function kleinsteVerschil(kleuren) {
  const namen = Object.keys(kleuren)
  let min = { d: Infinity }
  for (let i = 0; i < namen.length; i++) for (let j = i + 1; j < namen.length; j++) {
    const d = deltaE(kleuren[namen[i]], kleuren[namen[j]])
    if (d < min.d) min = { d, paar: `${namen[i]}/${namen[j]}` }
  }
  return min
}

/** Volledig rapport voor één palet { tekst: [[voor, achter, naam]], klassen: {}, kaart: [kleuren], extraLijnen: {} } */
export function rapport(p) {
  const r = { tekst: [], lijnen: [], cvd: {} }
  for (const [voor, achter, naam] of p.tekst) r.tekst.push({ naam, c: contrast(voor, achter) })
  const lijnen = { ...p.klassen, ...(p.extraLijnen || {}) }
  for (const [naam, kleur] of Object.entries(lijnen)) {
    const tegen = p.kaart.map((k) => contrast(kleur, k))
    const metRand = p.rand ? contrast(p.rand, kleur) : null
    r.lijnen.push({ naam, min: Math.min(...tegen), rand: metRand, randKaart: p.rand ? Math.min(...p.kaart.map((k) => contrast(p.rand, k))) : null })
  }
  r.cvd.normaal = kleinsteVerschil(p.klassen)
  for (const soort of Object.keys(MATRIX)) {
    const sim = Object.fromEntries(Object.entries(p.klassen).map(([k, v]) => [k, simuleer(v, soort)]))
    r.cvd[soort] = kleinsteVerschil(sim)
  }
  return r
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { PALETTEN } = await import('./paletten.mjs')
  const kies = process.argv[2]
  for (const [naam, varianten] of Object.entries(PALETTEN)) {
    if (kies && kies !== naam) continue
    for (const [thema, p] of Object.entries(varianten)) {
      const r = rapport(p)
      console.log(`\n== ${naam} · ${thema}`)
      for (const t of r.tekst) console.log(`  tekst  ${t.c >= 4.5 ? 'ok ' : 'NEE'} ${t.c.toFixed(2).padStart(5)}  ${t.naam}`)
      for (const l of r.lijnen) console.log(`  lijn   ${l.min >= 3 || (l.rand && l.randKaart >= 3) ? 'ok ' : 'NEE'} ${l.min.toFixed(2).padStart(5)} tegen kaart${l.rand ? `, rand ${l.randKaart.toFixed(2)} tegen kaart, lijn ${l.rand.toFixed(2)} tegen rand` : ''}  ${l.naam}`)
      for (const [s, v] of Object.entries(r.cvd)) console.log(`  klassen ${v.d >= 12 ? 'ok ' : v.d >= 8 ? 'mwah' : 'NEE'} ΔE ${v.d.toFixed(1).padStart(5)}  ${s} (dichtst: ${v.paar})`)
    }
  }
}
