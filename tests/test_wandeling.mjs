// Playwright-wandeling door vijf reizen, alles via de knoppen, met een schermafbeelding per reis.
//
//   python3 tools/serve.py &
//   CHROMIUM_PAD=/opt/pw-browsers/chromium node tests/test_wandeling.mjs <map voor schermafbeeldingen>
//
// 1. Rondje vanaf je locatie  2. Naar een station  3. Van A naar B  4. Rondjes in een gebied (Meijendel)
// 5. Bewaren en terugvinden. Telefoon 390 × 844, licht thema.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'

const [map = 'test-uitvoer/wandeling'] = process.argv.slice(2)
fs.mkdirSync(map, { recursive: true })
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost' } : undefined
const browser = await chromium.launch({ proxy, executablePath: process.env.CHROMIUM_PAD || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const basis = process.env.ONVERHARD_URL || 'http://localhost:8765/nopaves/'
const DELFT = { latitude: 52.0116, longitude: 4.3571 }
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  geolocation: DELFT, permissions: ['geolocation'], colorScheme: 'light',
})
const p = await ctx.newPage()
const fouten = []
p.on('pageerror', (e) => fouten.push('PAGEERROR ' + e.message))
p.on('dialog', (d) => { fouten.push('BROWSERVENSTER ' + d.message()); d.dismiss() })
const stap = (t) => console.log(`✓ wandeling: ${t}`)
const klaar = () => p.waitForFunction(() => (!document.getElementById('resultaat').hidden && !(window.onverhard.bezig && window.onverhard.bezig())) || !document.getElementById('fout').hidden, null, { timeout: 300000 })
const foto = async (naam) => {
  await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(1500)
  await p.screenshot({ path: path.join(map, `${naam}.png`) })
}
/** Tik op de kaart op een plek (lat, lon), zoals een vinger dat doet. */
const tikKaart = async (lat, lon) => {
  const vak = await p.locator('#kaart').boundingBox()
  const pt = await p.evaluate(([a, b]) => window.onverhard.kaart.latLngToContainerPoint([a, b]), [lat, lon])
  await p.mouse.click(vak.x + pt.x, vak.y + pt.y)
  await p.waitForTimeout(400)
}
const geenFout = async (reis) => assert.equal(await p.locator('#fout').textContent(), '', `${reis}: geen foutmelding`)

await p.goto(basis)
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('onverhard.intro', '1') })
await p.goto(basis)

// ---- 1. Rondje vanaf je locatie ----
await p.locator('#startregel [data-start="locatie"]').click()
await p.locator('#planKnop:not([disabled])').waitFor({ timeout: 20000 })
await p.locator('#snelkeuzes [data-waarde="10"]').click()
await p.locator('#planKnop').click()
await klaar()
await geenFout('rondje')
assert.ok(Number(await p.locator('#kern .score b').textContent()) >= 0, 'rondje: een score')
await foto('1-rondje-vanaf-locatie')
stap('1. rondje vanaf je locatie: locatieknop in de startregel, 10 km, Plan rondje')

// ---- 5a. Bewaren (de terugvindstap volgt na de andere reizen) ----
await p.locator('#bewaar').click()
await p.locator('#toast').waitFor({ state: 'visible', timeout: 5000 })
const naam = (await p.locator('#toast .toasttekst').textContent()).replace(/^Bewaard:\s*/, '').trim()
assert.ok(naam.length > 0, `bewaard onder een naam (${naam})`)
await foto('5a-bewaard')

// ---- 2. Naar een station ----
await p.locator('#nieuwKnop').click()
await p.locator('[data-soort="station"]').click()
await p.locator('#startregel [data-start="locatie"]').click()
await p.locator('#planKnop:not([disabled])').waitFor({ timeout: 20000 })
await p.locator('#planKnop').click()
await klaar()
await geenFout('station')
const titels = await p.locator('#opties .kies').allTextContents()
assert.ok(titels.some((t) => t.includes('→')), `station: routes naar een station (${titels.join(' | ')})`)
await foto('2-naar-station')
stap('2. naar een station: Station, mijn locatie, Plan')

// ---- 3. Van A naar B ----
await p.locator('#nieuwKnop').click()
await p.locator('[data-soort="route"]').click()
// paneel klein en iets uitzoomen: beide punten liggen dan op het zichtbare deel van de kaart
await p.evaluate(() => window.onverhard.sheet.zet('piek'))
await p.waitForTimeout(600)
await p.evaluate(() => window.onverhard.kaart.setView([51.995, 4.374], 13, { animate: false }))
await p.waitForTimeout(800)
await tikKaart(52.0116, 4.3571)
await tikKaart(51.998, 4.392)
await p.locator('#planKnop:not([disabled])').waitFor({ timeout: 20000 })
await p.locator('#planKnop').click()
await klaar()
await geenFout('A naar B')
await foto('3-a-naar-b')
stap('3. van A naar B: A naar B, twee tikken op de kaart, Plan')

// ---- 4. Rondjes in een gebied: Meijendel ----
await p.locator('#nieuwKnop').click()
await p.locator('[data-soort="rondje"]').click()
await p.evaluate(() => window.onverhard.kaart.setView([52.13, 4.35], 14, { animate: false }))
await p.waitForTimeout(400)
// lang drukken op de kaart (op een telefoon opent dat het kaartmenu)
await p.evaluate(() => {
  const k = window.onverhard.kaart
  const pt = k.latLngToContainerPoint([52.13, 4.35])
  k.fire('contextmenu', { latlng: L.latLng(52.13, 4.35), originalEvent: { clientX: pt.x, clientY: pt.y, preventDefault() {} } })
})
const item = p.locator('#kaartmenu .gebiedzoek:not([disabled])')
await item.waitFor({ timeout: 30000 })
assert.match(await item.textContent(), /Meijendel/)
await item.click()
assert.ok(await p.locator('#binnenchip').isVisible(), 'gebied: chip Binnen')
await p.locator('#planKnop').click()
await klaar()
await geenFout('gebied')
await foto('4-rondjes-in-meijendel')
stap('4. rondjes in een gebied: lang drukken in Meijendel, Rondjes in Meijendel & Berkheide, Plan')

// ---- 5b. Terugvinden ----
await p.locator('#binnenWeg').click().catch(() => {})
await p.locator('#nieuwKnop').click()
await p.locator('[data-soort="meer"]').click()
await p.locator('#meerlijst [data-meer="mijn"]').click()
const rij = p.locator('#bewaardlijst li', { hasText: naam })
await rij.waitFor({ timeout: 5000 })
await foto('5b-mijn-routes')
await rij.locator('button', { hasText: 'Open' }).click()
await klaar()
await geenFout('terugvinden')
await foto('5c-teruggevonden')
stap(`5. bewaren en terugvinden: Bewaar, later Meer → Mijn routes → Open (${naam})`)

assert.deepEqual(fouten, [], 'geen paginafouten of browservensters')
await browser.close()
console.log('klaar (wandeling)')
