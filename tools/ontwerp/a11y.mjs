// Toegankelijkheidscontrole met axe-core (WCAG 2.1 AA) op de plankaart en het resultaat, per richting.
//   AXE=/pad/naar/axe.min.js node tools/ontwerp/a11y.mjs [query, bv. ontwerp=a]
// axe-core zit niet in de repo; installeer het los (npm install axe-core) en wijs het aan met AXE.
import { chromium } from 'playwright'
import fs from 'node:fs'

const query = process.argv[2] || ''
const axe = fs.readFileSync(process.env.AXE, 'utf8')
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined
const browser = await chromium.launch({ proxy, executablePath: process.env.CHROMIUM_PAD || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const basis = 'http://localhost:8765/nopaves/' + (query ? `?${query}` : '')
const uit = {}
for (const thema of ['licht', 'donker']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: thema === 'donker' ? 'dark' : 'light' })
  const page = await ctx.newPage()
  await page.goto(basis)
  await page.evaluate((t) => { localStorage.setItem('onverhard.intro', '1'); localStorage.setItem('onverhard.thema', t) }, thema)
  const controle = async (naam) => {
    await page.addScriptTag({ content: axe })
    const r = await page.evaluate(async () => {
      // de kaart zelf (tegels, Leaflet-bediening van derden) valt buiten deze controle
      const res = await window.axe.run({ exclude: [['.leaflet-tile-pane'], ['.maplibregl-canvas']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
      return res.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, voorbeeld: v.nodes.slice(0, 3).map((x) => x.target.join(' ') + (x.any[0] ? ' — ' + x.any[0].message : '')) }))
    })
    // aanraakdoelen in het paneel kleiner dan 44 × 44 px (WCAG 2.5.5); zichtbare knoppen en velden
    const klein = await page.evaluate(() => [...document.querySelectorAll('#paneel button, #paneel input, #paneel select, #paneel summary')]
      .filter((e) => e.offsetParent && e.getBoundingClientRect().width > 0)
      .map((e) => { const r = e.getBoundingClientRect(); return { n: (e.id || e.className || e.tagName).toString().slice(0, 30), b: Math.round(r.width), h: Math.round(r.height) } })
      .filter((x) => x.b < 44 || x.h < 44))
    r.push({ id: 'doel<44px', impact: 'info', n: klein.length, voorbeeld: klein.slice(0, 8).map((x) => `${x.n} ${x.b}×${x.h}`) })
    uit[`${naam} ${thema}`] = r
  }
  await page.goto(basis + '#p=52.0116,4.3571&rondje=10')
  await page.waitForTimeout(2500)
  await controle('plankaart')
  await page.goto(basis + '#p=52.0116,4.3571&rondje=10&plan=1')
  await page.waitForFunction(() => (!document.getElementById('resultaat').hidden && !(window.onverhard.bezig && window.onverhard.bezig())) || !document.getElementById('fout').hidden, null, { timeout: 300000 })
  await page.evaluate(() => window.onverhard.sheet.zet('vol'))
  await page.waitForTimeout(800)
  await controle('resultaat')
  await ctx.close()
}
await browser.close()
for (const [k, v] of Object.entries(uit)) {
  console.log(`\n== ${query || 'standaard'} · ${k}: ${v.length ? v.map((x) => `${x.id} (${x.n})`).join(', ') : 'geen overtredingen'}`)
  for (const x of v) for (const e of x.voorbeeld) console.log(`   ${x.id}: ${e}`)
}
