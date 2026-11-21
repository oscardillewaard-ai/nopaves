// Samenvatting van .github/workflows/bgt.yml (markdown op stdout): per objecttype telling, grootte, tijd
// en geheugen, en de oordeeltoets per vak.
//   node tools/bgt/samenvatting.mjs <uitmap>
import fs from 'node:fs'
import path from 'node:path'
import { COLLECTIES } from './bron.mjs'

const map = process.argv[2]
const lees = (f) => { try { return JSON.parse(fs.readFileSync(path.join(map, f), 'utf8')) } catch { return null } }
const n = (v) => (v == null ? '–' : v.toLocaleString('nl-NL'))
const mb = (b) => (b == null ? '–' : (b / 1e6).toFixed(0))
const regels = ['# BGT omzetten (heel NL)', '']
const sec = Number(fs.existsSync(path.join(map, 'seconden.txt')) ? fs.readFileSync(path.join(map, 'seconden.txt'), 'utf8') : NaN)
const rijen = COLLECTIES.map((c) => ({ c, d: lees(c + '.json') }))
const eerste = rijen.find((r) => r.d)?.d
if (eerste?.bron) regels.push(`Bron: ${eerste.bron.adres || eerste.bron.bestand}${eerste.bron.gewijzigd ? ` (versie ${eerste.bron.gewijzigd})` : ""}. Doorlooptijd vijf typen tegelijk: ${Number.isNaN(sec) ? '–' : (sec / 60).toFixed(1) + ' min'}.`, '')
regels.push('| Objecttype | zip MB | objecten | historie | actueel | vakken | afgeleid MB | min | CPU min | geheugen MB |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
const som = { zip: 0, obj: 0, hist: 0, act: 0, gz: 0 }
for (const { c, d } of rijen) {
  if (!d) { regels.push(`| ${c} | mislukt | | | | | | | | |`); continue }
  som.zip += d.bron.gecomprimeerd || 0; som.obj += d.telling.objecten; som.hist += d.telling.historie; som.act += d.telling.actueel; som.gz += d.gz
  regels.push(`| ${c} | ${mb(d.bron.gecomprimeerd)} | ${n(d.telling.objecten)} | ${n(d.telling.historie)} | ${n(d.telling.actueel)} | ${n(d.vakken)} | ${mb(d.gz)} | ${(d.seconden.totaal / 60).toFixed(1)} | ${(d.cpuSeconden / 60).toFixed(1)} | ${n(d.rssMB)} |`)
}
regels.push(`| **Totaal** | ${mb(som.zip)} | ${n(som.obj)} | ${n(som.hist)} | ${n(som.act)} | | ${mb(som.gz)} | | | |`, '')
regels.push('## Oordeeltoets (afgeleid bestand tegen de vectortegels, eis >= 98%)', '', '| Vak | wegstukken | km | gelijk % | strand km (anders) | afgesloten km (natuur anders) |', '|---|---:|---:|---:|---:|---:|')
for (const f of fs.readdirSync(map).filter((f) => /^oordeel-.*\.json$/.test(f)).sort()) {
  const d = lees(f)
  regels.push(`| ${f.slice(8, -5)} | ${n(d.stukken)} | ${d.km} | ${d.overeenkomst.tegelsVsDownload} | ${d.vlaggen.strandKm} (${d.vlaggen.strandAndersKm}) | ${d.vlaggen.afgeslotenKm} (${d.vlaggen.natuurAndersKm}) |`)
}
console.log(regels.join('\n'))
