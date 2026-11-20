# Nopav.es: afspraken voor Claude Code

## Wat dit is

Nopav.es is een hardloop-routeplanner voor onverharde paden in Nederland, voor trailrunners en
hardlopers die liever over zand, gras en bospad lopen dan over asfalt. De app draait volledig in de
browser: rondje vanaf de start, naar een station, van A naar B, rondjes in een natuurgebied, tekenen,
GPX en bewaren. Live: https://oscardillewaard-ai.github.io/nopaves/ (GitHub Pages, workflow `deploy`).

## Mappen

- `public/`: de app (geen bouwstap). `index.html`, `app.js` (interface), `kern.js` (score, ondergrond),
  `bronnen.js` (OSM-tegels, BGT, AHN, BRouter, Locatieserver), `graaf.js` (Nopave-router),
  `blokgraaf.js` (vooraf bewerkte graaf), `rekenwerker.js` (Web Worker), `sw.js`, `manifest.webmanifest`,
  `graaf/<versie>/` (graafblokken), `vendor/` (Leaflet, MapLibre; niet aanpassen).
- `tests/`: `test_web_kern.mjs` (unit), `test_web_nopaves.mjs` (Playwright, telefoon en desktop),
  `test_web_e2e.mjs`, `test_gebieden.mjs`.
- `tools/`: `serve.py` (lokale server onder `/nopaves/`), `graaf/` (graafbouw), `onverhard/`
  (Python-planner en meetscripts), `icons/`.
- `docs/`: VOORTGANG.md, GRAAF-PROEF.md, VERHUIZING.md, metingen en schermafbeeldingen.
- `.github/workflows/`: `test`, `deploy`, `graaf.yml` (wekelijkse graafbouw).

De app werkt onder `/nopaves/`: gebruik alleen relatieve paden. Cache-namen beginnen met `nopaves-`.
De oude plek (`/Tezt/onverhard/`) gebruikt `onverhard-*` op dezelfde origin; raak die niet aan.

## Tests

```bash
npm ci
npm run test:unit
npm run lint
python3 tools/serve.py &
CHROMIUM_PAD=/opt/pw-browsers/chromium npm run test:mobiel
CHROMIUM_PAD=/opt/pw-browsers/chromium npm run test:desktop
```

(`CHROMIUM_PAD` alleen in de cloudomgeving; elders `npx playwright install chromium`.)
Alles moet groen zijn, ook achter de vlaggen `?ui=oud`, `?router=nopave` (de Nopave-router voor A naar B; de oude
naam `?router=eigen` werkt ook), `?stations=ringen` en
`?graaf=tegels` (de oude werking met kaarttegels en BGT; binnen de regio Delft is de vooraf bewerkte graaf
sinds v1.1.0 de standaard, buiten de regio valt de app vanzelf terug op de tegels). **Elke nieuwe handeling krijgt een Playwright-test die via de knoppen werkt**, niet via
`window.onverhard`.

## De graaf

`tools/graaf/bouw.mjs` bouwt de vooraf bewerkte routegraaf (nu alleen regio Delft, 48 blokken) uit
het Geofabrik-extract (`bron_pbf.py`) of uit de OpenFreeMap-tegels (`--bron ofm`), met BGT en AHN van
PDOK, naar `public/graaf/<versie>/` plus `actueel.json`. De workflow `graaf.yml` doet dit elke maandag en
biedt de nieuwe versie aan als PR `chore: graaf vJJJJMMDD-r<run>`, pas nadat unit-tests, het oordeel tegen
de app (>= 98%) en Playwright op de nieuwe graaf groen zijn. Achtergrond en beslisregels: docs/GRAAF-PROEF.md.

## Werkwijze

- Elke wijziging op een korte branch: `feat/`, `fix/`, `perf/`, `exp/`, `docs/` of `chore/` (bv.
  `feat/plankaart`). Dwingt de omgeving een eigen sessiebranch af (`claude/…`), werk daar, maar geef
  de PR een titel als `feat: …`.
- Altijd via een pull request naar `main` met: wat, waarom, metingen, schermafbeeldingen (voor en na),
  reviewpunten. Samenvoegen na een groene `test`; daarna de branch verwijderen.
- **Nooit `--force` pushen**, nooit geschiedenis herschrijven op `main`.
- Versies via GitHub Releases (semver, `vX.Y.Z`) met een regel in CHANGELOG.md in gewone taal.
- Werk documenteren in de PR en in `docs/`; open punten als GitHub Issues (labels `ux`, `perf`, `bug`,
  `idee`).
- Verwijder nooit iets zonder het eerst vast te leggen (branchnaam en commit-SHA, zie
  docs/branches-archief.md).

## Huisstijl Korrel

- Kleuren: papier `#F1F3D4`, achtergrond `#DDE5B3`, inkt `#2E3320`, mos `#4F6B2A`, jong gras `#9BC046`,
  heide `#9B4A7A`. Er is ook een donker thema.
- Vierkant, 2 px rand, geen schaduwen, geen emoji, lijnpictogrammen.
- Letters: Darker Grotesque (koppen), Karla (tekst), Overpass Mono (cijfers).
- Geen framework in de app, geen server, geen tracking. De lokale teller (`teller.js`,
  `nopaves.log`) blijft in de browser en wordt nooit verstuurd.

## Meten

Volgens VOORTGANG stap 0: `tools/onverhard/benchmark_snelheid.mjs`, 5× koud en 5× warm, mediaan per
fase, en nooit tegelijk met tests of andere zware processen. Leg voor- en na-cijfers in de PR.

## Skills en werkwijze (verplicht)

- **Vóór elke wijziging aan de interface**: `frontend-design` en `no-ui-slop`. Werk vanuit de huisstijl
  hierboven en ontwerp elke toestand (laden, leeg, fout).
- **Na elke wijziging aan de interface**: schermafbeeldingen met de Playwright-tools (telefoon
  390 × 844 en desktop, licht en donker; `tools/onverhard/screens_ux.mjs` helpt) → `ui-review` → punten
  met hoge prioriteit oplossen met `ui-polish` en opnieuw bekijken → `accessibility-review` → bij nieuwe
  of gewijzigde teksten `ux-copy`.
- **Elke pull request**: `/code-review` vóór het samenvoegen; bevindingen verwerken.
- Schermafbeeldingen (voor en na) en reviewpunten in de PR-beschrijving.
- **Skill niet beschikbaar?** Meld het in de PR en doe de stap met de hand.

De skills staan ook als losse kopie in `.claude/skills/` (met bron en licentie bovenin), voor
sessies waarin de plugins niet laden. Plugins: zie `.claude/settings.json`.
