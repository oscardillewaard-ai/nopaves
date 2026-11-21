// Zet het Nopav.es-pictogram (icon.svg, huisstijl Veldboek) om naar de PNG-maten voor iOS en het manifest.
//   CHROMIUM_PAD=/opt/pw-browsers/chromium node tools/icons/gen-icons.mjs
import { chromium } from 'playwright'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const svg = fs.readFileSync(fileURLToPath(new URL('./icon.svg', import.meta.url)), 'utf8')
const uit = fileURLToPath(new URL('../../public/icons/', import.meta.url))
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PAD || undefined })
for (const [naam, maat] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const page = await browser.newPage({ viewport: { width: maat, height: maat } })
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${maat}" height="${maat}" `)}</body></html>`)
  await page.screenshot({ path: uit + naam, omitBackground: false })
  await page.close()
}
await browser.close()
console.log('pictogrammen klaar')
