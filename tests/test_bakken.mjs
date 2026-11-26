// Test van de bakken-app (public/bakken/): dubbele adressen = één bolletje met het aantal bakken, mislukte adressen zichtbaar,
// status bewaard, verbergen, installeerbaar. De adreszoeker wordt nagebootst.
//   python3 tools/serve.py &  node tests/test_bakken.mjs
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const url = process.env.BASIS || 'http://localhost:8765/nopaves/bakken/'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PAD || undefined })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
const fouten = []
p.on('pageerror', (e) => fouten.push(e.message))
let offline = false
await p.route('**/locatieserver/**', (r) => {
  if (offline) return r.abort()
  const q = new URL(r.request().url()).searchParams.get('q')
  if (q.startsWith('X')) return r.fulfill({ json: { response: { docs: [] } } })
  const i = q.startsWith('A') ? 0 : 1
  r.fulfill({ json: { response: { docs: [{ weergavenaam: q, centroide_ll: `POINT(${4.36 + i * 0.01} 52.01)` }] } } })
})
await p.route('**/tile.openstreetmap.org/**', (r) => r.abort())
const bol = p.locator('path.leaflet-interactive')

await p.goto(url)
await p.fill('#invoer', 'A1\nA1\nB2\nXfout')
await p.click('#b-zet')
await p.waitForSelector('#fouten:not([hidden])')
assert.equal(await bol.count(), 2, 'dubbel adres = één bolletje, plus B2')
assert.match(await p.textContent('#fouten'), /Xfout \(niet gevonden\)/)
assert.match(await p.textContent('#b-fout'), /1 adres niet gelukt/)
assert.equal(await p.inputValue('#invoer'), 'Xfout')
assert.match(await p.textContent('#teller'), /0 van 3 bakken geleegd/)

// opnieuw plakken voegt niets dubbel toe
await p.fill('#invoer', 'A1\nA1\nB2')
await p.click('#b-zet')
await p.waitForFunction(() => document.querySelector('#melding').textContent.startsWith('0 bakken toegevoegd'))
assert.equal(await bol.count(), 2)
assert.equal(await p.locator('#fouten:not([hidden])').count(), 0)

// het adres met twee bakken zegt dat er twee staan en telt voor twee
await bol.nth(0).click()
assert.match(await p.textContent('.leaflet-popup'), /hier staan 2 bakken/)
await p.click('.leaflet-popup button:text-is("Geleegd")')
assert.match(await p.textContent('#teller'), /2 van 3 bakken geleegd/)
await p.click('#b-verberg')
assert.equal(await bol.count(), 1)

// bewaard na herladen
await p.reload()
assert.match(await p.textContent('#teller'), /2 van 3 bakken geleegd/)

// geen verbinding wordt apart benoemd en bewaard
offline = true
await p.click('#b-adressen')
await p.fill('#invoer', 'C3')
await p.click('#b-zet')
await p.waitForSelector('#fouten:not([hidden])')
assert.match(await p.textContent('#fouten'), /C3 \(geen verbinding/)
await p.reload()
assert.match(await p.textContent('#b-fout'), /1 adres niet gelukt/)

// installeerbaar: manifest klopt, pictogrammen bestaan, service worker staat aan
const m = await (await p.request.get(new URL('manifest.webmanifest', url).href)).json()
assert.equal(m.display, 'standalone')
for (const ic of m.icons) assert.equal((await p.request.get(new URL(ic.src, url).href)).status(), 200)
await p.evaluate(() => navigator.serviceWorker.ready)
const sw = await p.evaluate(async () => (await navigator.serviceWorker.getRegistration('./'))?.scope)
assert.ok(sw && sw.endsWith('/bakken/'), 'eigen service worker onder /bakken/')

// GPS: pijl op mijn plek, draait mee met de rijrichting, kaart volgt, pauzeert bij slepen
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: { latitude: 52.0, longitude: 4.36 } })
const g = await ctx2.newPage()
await g.route('**/tile.openstreetmap.org/**', (r) => r.abort())
await g.goto(url)
await g.click('#b-gps')
await g.waitForSelector('#pijl svg')
assert.equal(await g.getAttribute('#b-gps', 'aria-pressed'), 'true')
await ctx2.setGeolocation({ latitude: 52.0003, longitude: 4.36 })   // ongeveer 33 m naar het noorden
await g.waitForFunction(() => /rotate\((0|360)deg\)/.test(document.querySelector('#pijl svg').style.transform))
await ctx2.setGeolocation({ latitude: 52.0003, longitude: 4.3605 })  // naar het oosten
await g.waitForFunction(() => /rotate\(9\d deg\)|rotate\((8\d|9\d)deg\)/.test(document.querySelector('#pijl svg').style.transform))
// slepen pauzeert het volgen; Volg mij zet het weer aan; nog een tik zet GPS uit
const k = await g.locator('#kaart').boundingBox()
await g.mouse.move(k.x + 200, k.y + 300); await g.mouse.down(); await g.mouse.move(k.x + 80, k.y + 200, { steps: 5 }); await g.mouse.up()
assert.equal(await g.textContent('#b-gps'), 'Volg mij')
await g.click('#b-gps')
assert.equal(await g.textContent('#b-gps'), 'GPS uit')
await g.click('#b-gps')
assert.equal(await g.locator('#pijl').count(), 0)
assert.equal(await g.textContent('#b-gps'), 'GPS aan')

// geen toestemming: duidelijke melding
const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } })
const n = await ctx3.newPage()
await n.route('**/tile.openstreetmap.org/**', (r) => r.abort())
await n.goto(url)
await n.click('#b-gps')
await n.waitForSelector('#gpsfout:not([hidden])')
assert.match(await n.textContent('#gpsfout'), /toestemming/)
assert.equal(await n.textContent('#b-gps'), 'GPS aan')

assert.deepEqual(fouten, [])
await browser.close()
console.log('bakken: alles groen')
