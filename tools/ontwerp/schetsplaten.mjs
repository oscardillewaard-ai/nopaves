// Platen van het schetsvel docs/ontwerp/schetsen/index.html: per 8 schetsen één PNG, plus alles in één.
//   node tools/ontwerp/schetsplaten.mjs
import { chromium } from 'playwright'
import path from 'node:path'
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PAD || undefined })
const p = await (await b.newContext({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1 })).newPage()
await p.goto('file://' + path.resolve('docs/ontwerp/schetsen/index.html'))
await p.waitForTimeout(1500)
const figs = await p.locator('figure').all()
await p.screenshot({ path: 'docs/ontwerp/schetsen/alle.png', fullPage: true })
const doos = await Promise.all(figs.map((f) => f.boundingBox()))
for (let i = 0; i < figs.length; i += 8) {
  const groep = doos.slice(i, i + 8)
  const y0 = Math.min(...groep.map((d) => d.y)) - 10
  const y1 = Math.max(...groep.map((d) => d.y + d.height)) + 10
  await p.screenshot({ path: `docs/ontwerp/schetsen/plaat-${i / 8 + 1}.png`, fullPage: true, clip: { x: 0, y: y0, width: 1320, height: y1 - y0 } })
}
console.log('schetsen', figs.length)
await b.close()
