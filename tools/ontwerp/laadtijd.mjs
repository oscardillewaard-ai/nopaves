// Laadtijd van de app, koud (nieuwe browsercontext, lege cache), N keer, mediaan. Voor het ontwerpwerk:
// verandert de nieuwe look de laadtijd (lettertypen, stijlbladen, kaartstijl)?
//   node tools/ontwerp/laadtijd.mjs <url> [N=5]
// Meet: DOMContentLoaded, load, lettertypen klaar, kaart getekend (MapLibre 'idle'), en de overgedragen bytes
// van stijlbladen, lettertypen en scripts van de app zelf.
import { chromium } from 'playwright'

const [url, nTekst = '5'] = process.argv.slice(2)
const N = Number(nTekst)
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost' } : undefined
const browser = await chromium.launch({ proxy, executablePath: process.env.CHROMIUM_PAD || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const metingen = []
for (let i = 0; i < N; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const page = await ctx.newPage()
  const bytes = { css: 0, font: 0, js: 0 }
  page.on('response', async (r) => {
    if (!r.url().startsWith(url)) return
    const len = Number((await r.allHeaders())['content-length'] || 0)
    if (/\.css$/.test(r.url())) bytes.css += len
    else if (/\.woff2$/.test(r.url())) bytes.font += len
    else if (/\.m?js$/.test(r.url()) && !/vendor\//.test(r.url())) bytes.js += len
  })
  const t0 = Date.now()
  await page.goto(url + '#p=52.0116,4.3571&rondje=10')
  await page.evaluate(() => document.fonts.ready)
  const fonts = Date.now() - t0
  await page.waitForFunction(() => {
    let gl = null
    window.onverhard.kaart.eachLayer((l) => { if (l.getMaplibreMap) gl = l.getMaplibreMap() })
    return gl && gl.loaded() && gl.areTilesLoaded()
  }, null, { timeout: 60000, polling: 100 })
  const kaart = Date.now() - t0
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) } })
  metingen.push({ ...nav, fonts, kaart, ...bytes })
  await ctx.close()
}
await browser.close()
const mediaan = (k) => { const v = metingen.map((m) => m[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] }
const uit = Object.fromEntries(['dcl', 'load', 'fonts', 'kaart', 'css', 'font', 'js'].map((k) => [k, mediaan(k)]))
console.log(JSON.stringify({ url, N, mediaan: uit, alle: metingen }))
