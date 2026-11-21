# Nopav.es: afspraken voor Claude Code

## Wat dit is

Nopav.es is een hardloop-routeplanner voor onverharde paden in Nederland, voor trailrunners en
hardlopers die liever over zand, gras en bospad lopen dan over asfalt. De app draait volledig in de
browser: rondje vanaf de start, naar een station, van A naar B, rondjes in een natuurgebied, tekenen,
GPX en bewaren. Live: https://oscardillewaard-ai.github.io/nopaves/ (GitHub Pages, workflow `deploy`).

## Mappen

- `public/`: de app (geen bouwstap). `index.html`, `app.js` (interface), `kern.js` (score, ondergrond),
  `bronnen.js` (OSM-tegels, BGT, AHN, BRouter, Locatieserver), `tokens.css` en `kaarttokens.js` (ontwerptokens),
  `kaartstijl.js` (MapLibre-stijl), `graaf.js` (Nopave-router),
  `blokgraaf.js` (vooraf bewerkte graaf), `rekenwerker.js` (Web Worker), `sw.js`, `manifest.webmanifest`,
  `graaf/<versie>/` (graafblokken), `vendor/` (Leaflet, MapLibre; niet aanpassen).
- `tests/`: `test_web_kern.mjs` (unit), `test_web_nopaves.mjs` (Playwright, telefoon en desktop),
  `test_web_e2e.mjs`, `test_gebieden.mjs`.
- `tools/`: `serve.py` (lokale server onder `/nopaves/`), `graaf/` (graafbouw), `onverhard/`
  (Python-planner en meetscripts), `icons/`, `ontwerp/` (schermafbeeldingen, kleur- en toegankelijkheidscontrole).
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
Alles moet groen zijn, ook achter de vlaggen `?ui=oud`, `?router=nopave` en `?router=brouter` (voor A naar B; standaard
sinds v1.2.0 de Nopave-router binnen de vooraf bewerkte graaf en BRouter daarbuiten; de oude naam `?router=eigen`
werkt ook), `?stations=ringen` en
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

## Huisstijl Veldboek

Een veldgids voor onverharde paden: rustig, aards, de kaart is de hoofdzaak en de route het meest
opvallende op het scherm. Sinds v1.3.0; daarvoor Korrel (zie docs/branches-archief.md).

- **Alles via tokens.** Interface: `public/tokens.css` (kleuren, letters, vorm, afstanden, beweging, licht
  en donker). Kaart en routelijnen: `public/kaarttokens.js`. In `styles.css`, `app.js` en `kaartstijl.js`
  geen losse kleur, lettertype of schaduw; voeg een token toe en gebruik dat.
- **Kleuren licht**: papier `#E9EBE1`, vlak `#F7F7F1`, veen (inkt) `#26291F`, mos `#3E5A24` (hoofdknop,
  score), heide `#8E4A73` (tekenen, focus). **Donker (Bosgroen)**: paneel `#163A28`, inkt `#EEF3EA`,
  frisgroen `#C6E36A` (hoofdknop, score). Ondergrond: onverhard `#2F7D4A`, half `#C98A12`, open `#A64F86`,
  gesloten `#3D4250`, onbekend `#ABA69A` (donker: zie tokens.css).
- **Letters**: Literata (koppen, knoppen, grote cijfers) en Karla (tekst, kleine data met tabelcijfers).
  Geen mono, geen hoofdletterlabels, geen derde lettertype.
- **Vorm**: hoeken 4 px (knoppen) en 6 px (vlakken), lijnen 1,5 px in veen. Kaders alleen om wat je kunt
  aantikken; wat je leest is een vlak (`--vlak-2`). Geen schaduw in het paneel; alleen wat boven de kaart
  zweeft krijgt `--schaduw-zwevend`. Geen emoji, lijnpictogrammen (1,6 px).
- **Routelijnen**: hoe zachter de grond, hoe dikker de lijn (onverhard dikst, asfalt dunst), klinkers
  gestreept, onbekend gestippeld, en elk stuk een rand die tegen elk kaartvlak >= 3:1 haalt. Alternatieven
  in één neutrale grijstint met een letter. De korrel (stippen, streepjes) zit op de lijn, in de strook en
  heel licht op de natuur in de kaart.
- **Toegankelijkheid**: tekst >= 4,5:1, routerand >= 3:1 tegen de kaart, de vijf klassen uit elkaar bij
  deuteranopie, protanopie en tritanopie (ΔE >= 12), aanraakdoelen >= 44 px (`--doel`). Controleren met
  `tools/ontwerp/kleurcheck.mjs` en `tools/ontwerp/a11y.mjs`.
- **Niet doen**: verlopen, glas, gekleurde schaduwen, een tweede accentkleur, kaarten in kaarten, alles in
  een kader, crème met terracotta.
- Geen framework in de app, geen server, geen tracking. De lokale teller (`teller.js`,
  `nopaves.log`) blijft in de browser en wordt nooit verstuurd.
## Meten

Volgens VOORTGANG stap 0: `tools/onverhard/benchmark_snelheid.mjs`, 5× koud en 5× warm, mediaan per
fase, en nooit tegelijk met tests of andere zware processen. Leg voor- en na-cijfers in de PR.

## Skills en werkwijze (verplicht)

- **Vóór elke wijziging aan de interface**: `frontend-design` en `no-ui-slop`. Werk vanuit de huisstijl Veldboek
  hierboven en ontwerp elke toestand (laden, leeg, fout).
- **Na elke wijziging aan de interface**: schermafbeeldingen met de Playwright-tools (telefoon
  390 × 844 en desktop, licht en donker; `tools/ontwerp/schermen.mjs` helpt) → `ui-review` → punten
  met hoge prioriteit oplossen met `ui-polish` en opnieuw bekijken → `accessibility-review` → bij nieuwe
  of gewijzigde teksten `ux-copy`.
- **Elke pull request**: `/code-review` vóór het samenvoegen; bevindingen verwerken.
- Schermafbeeldingen (voor en na) en reviewpunten in de PR-beschrijving.
- **Skill niet beschikbaar?** Meld het in de PR en doe de stap met de hand.

De skills staan ook als losse kopie in `.claude/skills/` (met bron en licentie bovenin), voor
sessies waarin de plugins niet laden. Plugins: zie `.claude/settings.json`.
