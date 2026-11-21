// Schermafbeeldingen van alle schermen en toestanden, voor het ontwerpwerk (docs/ONTWERP.md).
//   node tools/ontwerp/schermen.mjs <map> [extra query, bv. ontwerp=a] [alleen=leeg,resultaat]
// Telefoon 390 × 844 en desktop 1280 × 800, licht en donker. Vraagt de lokale server
// (python3 tools/serve.py) en netwerk naar tiles.openfreemap.org voor de kaart.
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const [mapArg = 'docs/ontwerp/huidig', query = '', alleenArg = ''] = process.argv.slice(2)
const map = path.resolve(mapArg)
fs.mkdirSync(map, { recursive: true })
const alleen = alleenArg ? new Set(alleenArg.split(',')) : null
/** Moet een van deze schermen gemaakt worden? Zo niet, dan slaat het script die hele stap over. */
const nodig = (...t) => !alleen || t.some((x) => alleen.has(x))
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined
const browser = await chromium.launch({ proxy, executablePath: process.env.CHROMIUM_PAD || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const basis = (process.env.ONVERHARD_URL || 'http://localhost:8765/nopaves/') + (query ? `?${query}` : '')
const START = '#p=52.0116,4.3571&rondje=10'
const toestellen = (process.env.TOESTEL || 'telefoon,desktop').split(',')
const themas = (process.env.THEMA || 'licht,donker').split(',')

const klaar = (page, timeout = 300000) => page.waitForFunction(() => (!document.getElementById('resultaat').hidden && !(window.onverhard.bezig && window.onverhard.bezig())) || !document.getElementById('fout').hidden, null, { timeout })
const rust = (page, ms = 1500) => page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}).then(() => page.waitForTimeout(ms))

for (const toestel of toestellen) {
  const telefoon = toestel === 'telefoon'
  for (const thema of themas) {
    const ctx = await browser.newContext({
      viewport: telefoon ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      deviceScaleFactor: 1, isMobile: telefoon, hasTouch: telefoon, colorScheme: thema === 'donker' ? 'dark' : 'light',
    })
    const page = await ctx.newPage()
    const naam = (t) => path.join(map, `${t}_${toestel}_${thema}.png`)
    const foto = async (t) => {
      if (alleen && !alleen.has(t)) return
      await page.screenshot({ path: naam(t) })
      console.log(t, toestel, thema)
    }
    const sheet = (s) => telefoon && page.evaluate((x) => window.onverhard.sheet.zet(x), s).then(() => page.waitForTimeout(500))
    await page.goto(basis)
    await page.evaluate((t) => { localStorage.clear(); localStorage.setItem('onverhard.intro', '1'); localStorage.setItem('onverhard.thema', t) }, thema)
    // lege kaart, nieuwe gebruiker
    if (nodig('leeg')) {
      await page.goto(basis)
      await page.waitForSelector('.maplibregl-canvas', { timeout: 20000 }).catch(() => {})
      await rust(page, 2500)
      await foto('leeg')
    }
    if (nodig('plankaart', 'meer', 'voorkeuren', 'laden', 'resultaat-piek', 'resultaat-half', 'resultaat-vol', 'details', 'popup', 'bewaar', 'mijnroutes')) {
    // plankaart met een start
    await page.goto(basis + START)
    await rust(page, 2000)
    await foto('plankaart')
    // meer soorten
    await page.click('#soortkeuze [data-soort="meer"]')
    await page.waitForTimeout(400)
    await foto('meer')
    await page.click('#soortkeuze [data-soort="rondje"]')
    // voorkeuren
    await page.click('#voorkeurregel')
    await page.waitForTimeout(500)
    await foto('voorkeuren')
    await page.click('#voorkeurenDicht')
    }
    if (nodig('laden', 'resultaat-piek', 'resultaat-half', 'resultaat-vol', 'details', 'popup', 'bewaar', 'mijnroutes')) {
    // laden
    await page.click('#planKnop')
    await page.waitForTimeout(telefoon ? 900 : 1200)
    await foto('laden')
    await klaar(page)
    await rust(page, 2500)
    await foto('resultaat-piek')
    await sheet('half')
    await foto('resultaat-half')
    await sheet('vol')
    await foto('resultaat-vol')
    // details open
    await page.evaluate(() => { const d = document.querySelector('details.details'); if (d) d.open = true })
    await page.waitForTimeout(400)
    await page.evaluate(() => { const d = document.querySelector('details.details'); if (d) d.scrollIntoView({ block: 'start' }) })
    await page.waitForTimeout(300)
    await foto('details')
    await sheet('half')
    // popup op de route
    await page.evaluate(() => {
      const p = window.onverhard.krijgPlan()
      const k = window.onverhard.kaart
      let gevonden = false
      k.eachLayer((l) => {
        if (gevonden || !l.getPopup || !l.getPopup() || !l.getLatLngs) return
        const ll = l.getLatLngs()
        if (!ll.length) return
        gevonden = true
        l.openPopup(ll[Math.floor(ll.length / 2)])
      })
      return !!p
    })
    await page.waitForTimeout(700)
    await foto('popup')
    await page.evaluate(() => window.onverhard.kaart.closePopup())
    }
    if (nodig('bewaar', 'mijnroutes')) {
    // bewaren en Mijn routes
    await page.click('#bewaar').catch(() => {})
    await page.waitForTimeout(500)
    await foto('bewaar')
    await page.keyboard.press('Enter').catch(() => {})
    await page.waitForTimeout(400)
    await page.goto(basis + START)
    await rust(page, 1000)
    await page.click('#soortkeuze [data-soort="meer"]')
    await page.click('#meerlijst [data-meer="mijn"]')
    await page.waitForTimeout(500)
    await foto('mijnroutes')
    }
    if (nodig('uitleg', 'gebruik')) {
    // uitleg en Mijn gebruik
    await page.goto(basis + START)
    await rust(page, 800)
    await page.click('#uitleg').catch(() => {})
    await page.waitForTimeout(400)
    await foto('uitleg')
    await page.evaluate(() => { const d = document.getElementById('gebruik'); d.open = true; d.scrollIntoView() })
    await page.waitForTimeout(300)
    await foto('gebruik')
    await page.keyboard.press('Escape')
    }
    if (nodig('fout')) {
    // foutmelding: rondje midden op de Noordzee
    await page.goto(basis + '#p=52.3,3.6&rondje=10&plan=1')
    await klaar(page, 45000).catch(() => {})
    await rust(page, 1500)
    await foto('fout')
    }
    await ctx.close()
  }
}
await browser.close()
