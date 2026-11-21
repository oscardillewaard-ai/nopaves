// Visuele regressietests (toHaveScreenshot) voor de belangrijkste schermen: telefoon en desktop, licht en
// donker. De kaarttegels en andere bronnen komen uit een opname (tests/visueel/bronnen.zip), zodat de
// beelden niet veranderen als OpenStreetMap verandert.
//   npm run test:visueel                       vergelijken met de basisbeelden
//   npm run test:visueel -- --update-snapshots  basisbeelden vernieuwen (na een bewuste wijziging)
//   OPNEMEN=1 npm run test:visueel -- --update-snapshots   ook de bronnen opnieuw opnemen (netwerk nodig)
import { defineConfig } from '@playwright/test'

const launchOptions = {
  executablePath: process.env.CHROMIUM_PAD || undefined,
  // WebGL zonder grafische kaart (SwiftShader), zoals in de andere tests
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
}

export default defineConfig({
  testDir: 'tests/visueel',
  testMatch: /.*\.spec\.mjs/,
  outputDir: 'test-uitvoer/visueel',
  snapshotPathTemplate: '{testDir}/beelden/{projectName}/{arg}{ext}',
  timeout: 300000,
  workers: 1,
  reporter: [['list']],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled', caret: 'hide' } },
  use: {
    baseURL: process.env.ONVERHARD_URL || 'http://localhost:8765/nopaves/', trace: 'off', launchOptions,
    // alleen bij opnemen via de proxy van de omgeving; afspelen kan zonder netwerk
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost' } : undefined,
  },
  projects: [
    { name: 'telefoon', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } },
  ],
})
