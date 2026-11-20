// Fase 0 (docs/PLAN-heel-nederland.md): de artifacts van .github/workflows/fase0.yml samenvoegen tot één
// tabel per provincie plus een raming voor heel NL.
//
//   node tools/fase0/samenvatting.mjs <map met fase0-*> <uit.md> <uit.json>
//
// Gemeten = wat de jobs zelf vastlegden. Geraamd = omgerekend met de verhouding van de
// kalibratieprovincies (gzip en bouwtijd per wegstuk); zo staat het ook in de tabel.
import fs from 'node:fs'
import path from 'node:path'

const [map, mdPad, jsonPad] = process.argv.slice(2)
const lees = (...d) => { try { return fs.readFileSync(path.join(map, ...d), 'utf8') } catch { return null } }
const leesJson = (...d) => { const t = lees(...d); try { return t ? JSON.parse(t) : null } catch { return null } }
function tijd(...d) { // GNU time -v
  const t = lees(...d)
  if (!t) return null
  const w = t.match(/Elapsed \(wall clock\) time.*: ([\d:.]+)/)?.[1]
  const rss = Number(t.match(/Maximum resident set size \(kbytes\): (\d+)/)?.[1])
  const s = w ? w.split(':').reduce((a, v) => a * 60 + Number(v), 0) : null
  return { seconden: s === null ? null : Math.round(s), rssMB: rss ? Math.round(rss / 1024) : null, status: Number(t.match(/Exit status: (\d+)/)?.[1] ?? 0) }
}
const PROV = JSON.parse(fs.readFileSync(new URL('./provincies.json', import.meta.url))).provincies
const mb = (b) => (b == null ? '–' : (b / 1e6).toFixed(b < 1e7 ? 1 : 0))
const min = (s) => (s == null ? '–' : (s / 60).toFixed(s < 600 ? 1 : 0))
const n = (v) => (v == null ? '–' : v.toLocaleString('nl-NL'))

const porties = [0, 3, 6, 9].map((i) => tijd('fase0-knip', `tijd-knip-${i}.txt`)).filter(Boolean)
const knipTijd = porties.length ? { seconden: porties.reduce((t, p) => t + p.seconden, 0), rssMB: Math.max(...porties.map((p) => p.rssMB || 0)) } : null
const knip = { tijd: knipTijd, porties, downloadSeconden: Number(lees('fase0-knip', 'download-seconden.txt')) || null, nlBytes: Number(lees('fase0-knip', 'nl-bytes.txt')) || null, nproc: lees('fase0-knip', 'nproc.txt')?.trim(), bron: lees('fase0-knip', 'bron.txt')?.trim() }
const rijen = PROV.map((p) => {
  const o = `fase0-osm-${p.slug}`
  const b = `fase0-bgt-${p.slug}`
  const manifest = leesJson(o, 'manifest.json')
  return {
    ...p,
    osm: leesJson(o, 'osm.json'),
    bron: tijd(o, 'tijd-bron.txt'),
    graaf: tijd(o, 'tijd-graaf.txt'),
    bouw: tijd(o, 'tijd-bouw.txt'),
    gemeten: manifest ? { gz: manifest.totaal.gz, blokken: manifest.totaal.blokken, wegstukken: manifest.totaal.wegstukken, fasen: manifest.bouwtijdSeconden } : null,
    bgt: leesJson(b, 'bgt.json'),
    bgtObjecten: lees(b, 'bgt-objecten.txt'),
  }
})
const delta = leesJson('fase0-delta', 'delta.json')

// kalibratie: gzip en bouwtijd per wegstuk uit de provincies met een echte bouw
const kal = rijen.filter((r) => r.gemeten && r.bouw)
const somK = (f) => kal.reduce((t, r) => t + f(r), 0)
const gzPerWs = kal.length ? somK((r) => r.gemeten.gz) / somK((r) => r.gemeten.wegstukken) : null
const sPerWs = kal.length ? somK((r) => r.bouw.seconden) / somK((r) => r.gemeten.wegstukken) : null
for (const r of rijen) {
  const ws = r.osm?.wegstukken
  r.raming = ws ? { gz: gzPerWs ? Math.round(ws * gzPerWs) : r.osm.schattingGzBytes, bouwSeconden: sPerWs ? Math.round(ws * sPerWs) : null, bron: gzPerWs ? 'kalibratie' : 'verhouding Delft' } : null
}
const tot = (f) => rijen.reduce((t, r) => t + (f(r) || 0), 0)

const md = []
md.push('# Fase 0: proefmetingen heel Nederland', '')
md.push(`Bron OSM-extract: ${knip.bron || '–'}.`, '')
md.push(`Knippen (één runner, ${knip.nproc || '?'} kernen): NL-extract ${mb(knip.nlBytes)} MB, download ${min(knip.downloadSeconden)} min, osmium extract naar 12 provincies (${knip.porties.length} porties van 3) ${min(knip.tijd?.seconden)} min, max. ${n(knip.tijd?.rssMB)} MB geheugen per portie.`, '')
md.push('## Per provincie', '')
md.push('| Provincie | land km² | wegstukken | km weg | km onverhard (OSM zeker) | graaf gz MB | bouw min | bron_pbf min / MB | graaf min / MB | BGT wacht min | BGT zip MB | BGT download min |')
md.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
for (const r of rijen) {
  const gz = r.gemeten ? `**${mb(r.gemeten.gz)}** (gemeten)` : r.raming ? `${mb(r.raming.gz)} (geraamd)` : '–'
  const bouw = r.bouw ? `**${min(r.bouw.seconden)}** (gemeten, ${n(r.bouw.rssMB)} MB)` : r.raming?.bouwSeconden ? `${min(r.raming.bouwSeconden)} (geraamd)` : '–'
  md.push(`| ${r.naam} | ${n(r.landKm2)} | ${n(r.osm?.wegstukken)} | ${n(r.osm?.km.totaal)} | ${n(r.osm?.km.onverhard)} | ${gz} | ${bouw} | ${min(r.bron?.seconden)} / ${n(r.bron?.rssMB)} | ${min(r.graaf?.seconden)} / ${n(r.graaf?.rssMB)} | ${min(r.bgt?.wachtSeconden)} | ${mb(r.bgt?.zipBytes)} | ${min(r.bgt?.downloadSeconden)} |`)
}
md.push(`| **Totaal** | ${n(tot((r) => r.landKm2))} | ${n(tot((r) => r.osm?.wegstukken))} | ${n(tot((r) => r.osm?.km.totaal))} | ${n(tot((r) => r.osm?.km.onverhard))} | ${mb(tot((r) => r.gemeten?.gz ?? r.raming?.gz))} | | | | | ${mb(tot((r) => r.bgt?.zipBytes))} | |`, '')
md.push(`Kalibratie: ${kal.map((r) => r.naam).join(', ') || 'geen (echte bouw ontbreekt)'}; ${gzPerWs ? gzPerWs.toFixed(2) + ' B gzip' : '–'} en ${sPerWs ? (sPerWs * 1000).toFixed(2) + ' ms bouwtijd (koude cache)' : '–'} per wegstuk. De provinciegrenzen zijn bboxen: randen tellen dubbel (zie poly.mjs).`, '')
for (const r of rijen.filter((x) => x.bgtObjecten)) md.push(`BGT-objecten ${r.naam} (bestand, objecten, waarvan historisch):`, '```', r.bgtObjecten.trim(), '```', '')
if (delta) md.push('## BGT-delta, heel NL', '', `${delta.dagen} dagen: ${mb(delta.zipBytes)} MB zip, wachten ${min(delta.wachtSeconden)} min, downloaden ${min(delta.downloadSeconden)} min (beschikbaar: ${delta.beschikbaar} dagen).`, '')
const mislukt = rijen.filter((r) => !r.osm || !r.bgt).map((r) => `${r.naam}${!r.osm ? ' (osm)' : ''}${!r.bgt ? ' (bgt)' : ''}`)
if (mislukt.length) md.push(`Ontbreekt: ${mislukt.join(', ')}.`, '')
fs.writeFileSync(mdPad, md.join('\n'))
fs.writeFileSync(jsonPad, JSON.stringify({ knip, rijen, delta, kalibratie: { gzPerWs, sPerWs } }, null, 1))
