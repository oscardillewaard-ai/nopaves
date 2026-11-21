// Visuele regressie: plankaart, resultaat, voorkeuren en uitleg, licht en donker (zie playwright.config.mjs).
// Bronnen van buiten (kaarttegels, lettertekens van de kaart, PDOK) komen uit een opname; wat er niet in staat
// wordt geweigerd, zodat elke run dezelfde kaart ziet.
import { test, expect } from '@playwright/test'
import path from 'node:path'

const OPNAME = path.resolve('tests/visueel/bronnen.zip')
const START = '#p=52.0116,4.3571&rondje=10'

for (const thema of ['licht', 'donker']) {
  test.describe(thema, () => {
    test.use({ colorScheme: thema === 'donker' ? 'dark' : 'light' })

    test.beforeEach(async ({ page, context }) => {
      await context.routeFromHAR(OPNAME, { url: /^https:\/\/(?!localhost)/, notFound: 'abort', update: !!process.env.OPNEMEN, updateContent: 'attach' })
      await page.goto('./')
      await page.evaluate((t) => { localStorage.clear(); localStorage.setItem('onverhard.intro', '1'); localStorage.setItem('onverhard.thema', t) }, thema)
    })

    const rust = async (page) => {
      await page.waitForSelector('.maplibregl-canvas', { timeout: 20000 })
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(2000)
    }
    const klaar = (page) => page.waitForFunction(() => (!document.getElementById('resultaat').hidden && !(window.onverhard.bezig && window.onverhard.bezig())) || !document.getElementById('fout').hidden, null, { timeout: 240000 })

    test('plankaart', async ({ page }) => {
      await page.goto('./' + START)
      await rust(page)
      await expect(page).toHaveScreenshot(`plankaart-${thema}.png`)
    })

    test('resultaat', async ({ page, isMobile }) => {
      await page.goto('./' + START)
      await rust(page)
      await page.locator('#planKnop').click()
      await klaar(page)
      await expect(page.locator('#fout')).toHaveText('')
      if (isMobile) await page.evaluate(() => window.onverhard.sheet.zet('half'))
      await rust(page)
      await expect(page).toHaveScreenshot(`resultaat-${thema}.png`)
    })

    test('voorkeuren', async ({ page }) => {
      await page.goto('./' + START)
      await rust(page)
      await page.locator('#voorkeurregel').click()
      await expect(page.locator('#voorkeuren')).toBeVisible()
      await expect(page).toHaveScreenshot(`voorkeuren-${thema}.png`)
    })

    test('uitleg', async ({ page }) => {
      await page.goto('./' + START)
      await rust(page)
      await page.locator('#uitleg').click()
      await expect(page.locator('#hulp')).toBeVisible()
      await expect(page).toHaveScreenshot(`uitleg-${thema}.png`)
    })
  })
}
