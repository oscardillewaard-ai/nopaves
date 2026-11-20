# Nopav.es: verhuizing naar oscardillewaard-ai/nopaves

**Opdracht afgerond** (2026-11-20). Wat nog openstaat, kan alleen in de webinterface: zie "Voor Oscar".

## Samenvatting

- **Live**: https://oscardillewaard-ai.github.io/nopaves/ (repo oscardillewaard-ai/nopaves, `main`,
  workflow `deploy`). De oude plek https://oscardillewaard-ai.github.io/Tezt/onverhard/ verwijst door,
  met behoud van querystring en hash, en ruimt de oude service worker en caches op.
- **Release**: [v1.0.0 "Plankaart, sneller en een eigen huis"](https://github.com/oscardillewaard-ai/nopaves/releases/tag/v1.0.0).
- **Gelijk gebleven**: UX fase 1–3 en snelheid stap 0–6, plus de graafproef achter `?graaf=vooraf`.
  Na de integratie niet trager (rondje koud 10,4 s, station koud 23,9 s). Unit 50/50, lint schoon,
  Playwright telefoon en desktop groen, lokaal, in CI en tegen de live site.
- **Branches**: niets weggehaald; de git-proxy weigert verwijderen. De lijst en alle SHA's staan in
  [branches-archief.md](branches-archief.md); Oscar haalt ze weg (Voor Oscar, punt 5).
- **Graafproef**: was af (stap 1–5 klaar), dus stap H was niet nodig. De beslisregels zijn niet gehaald,
  dus alles blijft achter de vlag. Vervolg in issues #9, #10 en #11.
- **Plugins en skills**: frontend-design, code-review, playwright, UI Design Review, uxkin (skill) en
  design laden. code-review en playwright zijn ook uitgevoerd. De uxkin-MCP vraagt een betaald plan en
  de design-koppelingen worden door de proxy geblokkeerd. Losse kopieën in `.claude/skills/`. Details
  in stap I.
- **Open punten**: issues #3–#11.


## Voor Oscar

1. **Branchbeveiliging op main** (github.com/oscardillewaard-ai/nopaves → Settings → Branches →
   Add branch ruleset, of "Add classic branch protection rule"): Branch name pattern `main` → vink
   "Require a pull request before merging" aan → vink "Require status checks to pass" aan en kies
   `test` → laat "Allow force pushes" en "Allow deletions" uit → Create/Save.
2. **Graaf-PR's toestaan**: Settings → Actions → General → onderaan "Workflow permissions" → vink
   "Allow GitHub Actions to create and approve pull requests" aan → Save.
3. **Branches automatisch opruimen**: Settings → General → onderaan "Pull Requests" → vink
   "Automatically delete head branches" aan.
4. **Eerste graafbouw**: Actions → Graaf bouwen → Run workflow → branch `main` → Run workflow
   (duurt tot een paar uur; daarna staat er een PR `chore: graaf v…`). Zie issue #11.
5. **Branches in Tezt weghalen** (github.com/oscardillewaard-ai/Tezt → Branches → prullenbak bij elke
   branch): `ccr-c02c1fc3-wix11n`, `claude/unpaved-routes-planner-ufzrl8`, `graaf-proef`, `snelheid`,
   `terugzet/na-snelheid`, `terugzet/na-ux-1`, `terugzet/na-ux-2`, `terugzet/na-ux-3`,
   `terugzet/voor-graaf`, `terugzet/voor-ux`, `ux-fase-1`, `ux-fase-2`, `ux-fase-3`. Laat
   `claude/admiring-ritchie-23anos` in Tezt staan: die houdt de weggehaalde commits bereikbaar.
   SHA's: docs/branches-archief.md.
   Twijfel: `ccr-1c8830ae-uawyv2` (zie het archief).


Voortgangsbestand van de verhuisopdracht. Stap A stond in Tezt (`public/onverhard/VERHUIZING.md`);
vanaf stap B staat dit bestand in nopaves als `docs/VERHUIZING.md`. Begint een sessie met "ga verder": lees dit bestand en ga verder bij de eerste stap
die niet `klaar` is.

6. **Sessiebranch in nopaves weghalen** (na het samenvoegen van de laatste PR): github.com/oscardillewaard-ai/nopaves
   → Branches → prullenbak bij `claude/admiring-ritchie-23anos`. Met punt 3 gebeurt dit voortaan vanzelf.
7. **Optioneel, uxkin-voorbeelden**: alleen als je de voorbeelden uit echte apps wilt (betaald plan op
   uxkin.com/pricing). Daarna in een nieuwe sessie de koppeling laten autoriseren. De skills werken ook
   zonder.

## Status

| Stap | Status |
|---|---|
| A Integreren | klaar |
| B Verhuizen | klaar |
| C Automatiseren | klaar (branchbeveiliging: Voor Oscar) |
| D Live in nopaves | klaar (release v1.0.0) |
| E Oude plek doorverwijzen | klaar |
| F Opruimen | archief klaar; verwijderen: Voor Oscar |
| G Documentatie | klaar |
| H Graafproef afmaken | niet nodig (graafproef was af) |
| I Plugins en skills | klaar (PR `chore: …claude-skills`) |

## A. Integreren

Gestart 2026-11-20 07:00 UTC, nadat GRAAF-PROEF.md alle stappen `klaar` toonde.

**De drie lijnen**

| Lijn | Branch | SHA | Merge-base met live |
|---|---|---|---|
| 1 Live (Pages) | `claude/gpx-ultrarace-trainingen-zf6zci` | `7c885b55b65dc6eeac38ae063e4fb4de9a5e8943` | (is live) |
| 2 UX + snelheid | `terugzet/na-snelheid` | `7c885b55b65dc6eeac38ae063e4fb4de9a5e8943` | gelijk aan live |
| 2 idem, sessiebranch | `ccr-c02c1fc3-wix11n` | `92eabe6555f36051bbd6e04ead7737b0ccbb61e2` | `7c885b5` (+1 commit: VOORTGANG "live gezet") |
| 3 Graafproef | `graaf-proef` | `ea114babfded59acb329a68bff08c3e5b2d92209` | `7c885b5` (+4 commits) |

Live staat dus UX fase 1–3 + snelheid stap 0–6 (`7c885b5`). Alle lijnen splitsen af van precies die
commit; er waren geen conflicten.

**Keuzes**
- Integratiebranch is `claude/admiring-ritchie-23anos` (de omgeving staat alleen pushen naar deze
  sessiebranch toe). Merges: `graaf-proef`, daarna `ccr-c02c1fc3-wix11n`.
- "Alleen public/onverhard": de graafproef raakt ook `tools/graaf/`, `tools/onverhard/` (tests),
  `docs/graaf-proef/` en `.github/workflows/graaf.yml`. Die horen uitsluitend bij Nopav.es en gaan mee
  naar nopaves. Er zitten op deze lijnen geen commits van andere projecten.
- Graafcode blijft achter `?graaf=vooraf`: GRAAF-PROEF.md meldt dat beide beslisregels niet gehaald zijn.
- Hill repeat-modus: bestaat (nog) niet, op geen van de drie lijnen (VOORTGANG.md: "op de planning voor
  later"). Er is niets om te behouden; komt als open punt (issue) terug.

**Tests op de integratie**
- `node --test tools/onverhard/test_web_kern.mjs`: 50 van 50 groen.
- `npx oxlint public/onverhard`: schoon.
- Playwright mobiel: groen (inclusief de graafproef-blokken).
- Playwright desktop: eerste run een time-out op "Route hierheen" bij een station-marker
  (`test_web_nopaves.mjs:214`, klik met `force` op een marker die soms onder een andere ligt);
  tweede run groen. Wisselvallige test, geen app-fout: open punt.

**Meting stap 0 (rondje en station, 5× koud en 5× warm, mediaan totaal, seconden)**

| Geval | | Na snelheid (VOORTGANG) | Integratie |
|---|---|---|---|
| rondje-10 Delft Centraal | koud | 11,8 | 10,4 |
| rondje-10 Delft Centraal | warm | 5,3 | 5,4 |
| station-15 Delft Centraal | koud | 26,2 | 23,9 |
| station-15 Delft Centraal | warm | 9,3 | 9,5 |

Niet trager; de warme verschillen (+0,1 en +0,2 s) vallen binnen de ruis van de netwerkbronnen. Let op:
vergeleken met de cijfers in VOORTGANG, niet met een verse meting van live in dezelfde minuut.

**Integratie-SHA**: zie de commit die dit bestand toevoegt (eerstvolgende regel in de geschiedenis van
`claude/admiring-ritchie-23anos`); de code-SHA vóór dit bestand is `ca17ace`.

## B. Verhuizen

- Geschiedenis met `git filter-repo` uit Tezt gehaald vanaf de integratie-SHA `8f14bcd` (66 commits).
  Meegenomen paden: `public/onverhard/` (wordt `public/`), `tools/onverhard/`, `tools/graaf/`,
  `docs/snelheid/`, `docs/ux-voortgang/`, `docs/graaf-proef/`, `.github/workflows/graaf.yml`,
  `scripts/gen-onverhard-icons.mjs` en `scripts/onverhard-icon.svg`.
- Let op: de eerste commit in deze geschiedenis (`Onverhard: one length-correction attempt…`) voegt de
  hele app in één keer toe. De oudere voorgeschiedenis (o.a. `5a9a9bb`, `dc52d18`) staat in Tezt op
  andere branches (zoals `claude/unpaved-routes-planner-ufzrl8`) en is geen voorouder van de live versie.
  Die branches blijven in stap F staan of worden met SHA gearchiveerd.
- Herindeling in één commit daarna: `docs/` (VOORTGANG, GRAAF-PROEF, VERHUIZING, PLAN-nopaves),
  `tests/` (test_web_kern, test_web_nopaves, test_web_e2e, test_gebieden), `tools/icons/`
  (pictogramscript), `tools/serve.py` (nieuw). `tools/onverhard/` houdt de Python-planner met zijn eigen
  `test_onverhard.py` (die importeert `onverhard.py` uit dezelfde map) en de meet- en vergelijkscripts.
- Paden: imports in tests en tools, workflow, standaard-URL van de tests
  (`http://localhost:8765/nopaves/`), pictogramscript.
- De app gebruikte al alleen relatieve paden (service worker `register('sw.js')`, manifest
  `start_url`/`scope` `./`, graafblokken via `new URL('graaf/', import.meta.url)`): werkt onder `/nopaves/`.
- **Cache-namen**: oude en nieuwe app delen dezelfde origin (`oscardillewaard-ai.github.io`) en dus
  dezelfde Cache Storage. De oude service worker wist bij activeren alle caches die met `onverhard-`
  beginnen. De app-cache heet daarom nu `nopaves-app-v46` en ruimt alleen `nopaves-app-*` op. De
  datacache (`nopaves-data-v1`, kaarttegels, BGT, AHN) mag gedeeld blijven.
- `tools/serve.py` serveert `public/` onder `/nopaves/` zoals GitHub Pages; `npm run serve`.
- `package.json`: alleen `playwright` 1.62.1 en `oxlint` 1.79.0 (dezelfde versies als in Tezt).
- Tests in de nieuwe indeling: unit 50/50, oxlint schoon, Playwright mobiel en desktop groen.

## C. Automatiseren

- PR [#1](https://github.com/oscardillewaard-ai/nopaves/pull/1) (samengevoegd, `65db499`): workflows
  `test` (unit, oxlint, Playwright telefoon en desktop, bij elke PR en push naar main), `deploy`
  (`public/` naar GitHub Pages met `actions/deploy-pages`) en `graaf.yml` (wekelijks, biedt nieuwe
  blokken aan als PR `chore/graaf-vJJJJMMDD` in plaats van naar main te pushen).
- Pages-bron: stond al goed of is door `actions/configure-pages` gezet; de eerste deploy slaagde
  (run 44696108003). Ik kon de instelling zelf niet lezen of zetten (geen API-toegang buiten de
  GitHub-tools in deze omgeving).
- Graafworkflow uit Tezt: hij stond alleen op `graaf-proef` en op de sessiebranch, niet op de
  Pages-branch. Hij verdwijnt uit Tezt zodra die branches weg zijn (stap F).
- Branchbeveiliging: niet mogelijk met de GitHub-tools in deze omgeving → Voor Oscar.
- Branch na samenvoegen verwijderen: de git-proxy weigert het verwijderen van branches. De
  sessiebranch `claude/admiring-ritchie-23anos` wordt daarom hergebruikt (na elke merge opnieuw
  gestart vanaf main). Voor Oscar: "Automatically delete head branches" aanzetten.
- PR [#2](https://github.com/oscardillewaard-ai/nopaves/pull/2) (samengevoegd, `0e1bbc5`): `fix:` voor de wisselvallige
  desktoptest. Oorzaak gevonden: de marker van het extra station lag buiten beeld (y 1439 bij een
  venster van 900 hoog), dus de klik met `force` raakte niets. Nu krijgt de marker zelf de klik.
  Voor: 2 van 2 rood, na: 2 van 2 groen (plus groen tegen de live site).

## D. Live in nopaves

- https://oscardillewaard-ai.github.io/nopaves/ werkt (app, `sw.js`, manifest, `graaf/actueel.json`
  geven 200).
- Playwright tegen de live URL, telefoon en desktop: groen (met de testfix). Gedekt: rondje,
  station, "Route hierheen", A naar B, lang drukken in Meijendel (rondjes in het gebied), GPX zonder
  tijden, bewaren en Mijn routes, `?router=eigen`, en `?graaf=vooraf` (rondje, station en A naar B
  binnen de regio Delft, terugval in Utrecht). Hill repeat: bestaat niet (issue #7).
- localStorage: sleutels `onverhard.v1`, `onverhard.thema`, `onverhard.routes`, `nopaves.log` en de
  soortkeuze zijn niet padafhankelijk, en oud en nieuw delen de origin `oscardillewaard-ai.github.io`.
  Bewaarde routes en instellingen gaan dus mee; niets aangepast.
- Release v1.0.0: tags pushen weigert de git-proxy ("remote end hung up"), en `gh` werkt in deze
  omgeving alleen voor zoeken. Daarom een workflow `release` (PR #13, met de hand te starten, tekst uit
  CHANGELOG.md), gestart via de GitHub-tools: https://github.com/oscardillewaard-ai/nopaves/releases/tag/v1.0.0
  (tag op `f9a87b5`).

## E. Oude plek doorverwijzen

- Tezt, Pages-branch `claude/gpx-ultrarace-trainingen-zf6zci`, gewone push: `7c885b5..07f22d4`.
  `public/onverhard/` bestaat nu alleen nog uit `index.html` (doorverwijzing) en `sw.js` (vervanger die
  de oude caches wist en zichzelf afmeldt). Laatste versie van de oude app: `7c885b55b65dc6eeac38ae063e4fb4de9a5e8943`.
- De pagina meldt de service worker met scope `/Tezt/onverhard/` af, wist `onverhard-*` (twee keer: de
  oude worker zet de pagina zelf nog in zijn cache terwijl ze laadt), laat `nopaves-data-*` staan en
  stuurt door met behoud van querystring en hash. Zonder JavaScript: een gewone link.
- Getest: lokaal met de oude app plus zijn service worker geïnstalleerd en daarna vervangen
  (worker weg, `onverhard-v44` weg, datacache blijft, `?soort=rondje&km=10#r=abc` komt aan); de
  Tezt-build (`npm run build`) en de Tezt-startpagina zonder fouten; en live:
  `https://oscardillewaard-ai.github.io/Tezt/onverhard/?soort=rondje&km=10#test` →
  `https://oscardillewaard-ai.github.io/nopaves/?soort=rondje&km=10#test`.
- `tools/onverhard/` en de pictogramscripts staan nog op de Pages-branch van Tezt (niet gebouwd, niet
  online). Bewust niet aangeraakt: de opdracht noemde alleen `public/onverhard`. Kan weg in een latere
  opruimronde.

## F. Opruimen

- `docs/branches-archief.md`: alle branches met naam en SHA, ook eerst vastgelegd in Tezt
  (`public/onverhard/branches-archief.md` op `claude/admiring-ritchie-23anos`, commit `664e773`).
- Verwijderen lukt niet vanuit deze omgeving: de git-proxy weigert `git push --delete` en de
  GitHub-tools hebben geen functie om een branch te verwijderen → Voor Oscar, met de lijst.
- Twijfel (blijft staan): `ccr-1c8830ae-uawyv2` (9 Nopav.es-commits die niet als zodanig in de
  integratie zitten). De sessiebranch in Tezt blijft als anker: hij houdt de commits van de
  weggehaalde branches bereikbaar.
- nopaves: alleen `main` en de sessiebranch.

## G. Documentatie

- CLAUDE.md, README.md (met bronnen en licenties; BGT en AHN CC0, Natura 2000 Public Domain Mark,
  luchtfoto CC BY, nagekeken in de PDOK-dienstbeschrijvingen; Locatieserver niet nagekeken),
  CHANGELOG.md, docs/licentie-keuze.md ("Licentie: nog niet gekozen").
- Open punten als issues #3–#11 met labels `perf`, `ux`, `bug` en `idee` (labels zijn automatisch
  aangemaakt).

## I. Plugins en skills

- `.claude/settings.json` met `frontend-design`, `code-review` en `playwright` uit
  `claude-plugins-official`. De namen zijn nagekeken in de marketplace-lijst van
  anthropics/claude-plugins-official: alle drie bestaan zo.
- Losse kopieën in `.claude/skills/`, met een kop direct na de frontmatter (de frontmatter moet bovenaan
  blijven, anders laadt de skill niet) en het licentiebestand in de map:

| Skill | Bron | Licentie | Gekopieerd |
|---|---|---|---|
| ui-review | uxkin/agent, plugin ui-design-review | MIT, © 2026 UXKIN | ja |
| ui-polish | uxkin/agent, plugin ui-design-review | MIT, © 2026 UXKIN | ja |
| no-ui-slop | uxkin/agent, plugin uxkin | MIT, © 2026 UXKIN | ja |
| accessibility-review | anthropics/knowledge-work-plugins, design | Apache 2.0 | ja |
| ux-copy | anthropics/knowledge-work-plugins, design | Apache 2.0 | ja |

  De twee design-skills verwijzen naar `CONNECTORS.md` van hun plugin; dat bestand is niet
  meegekopieerd (alleen een hint over koppelingen).

**Wat werkt in deze cloudsessie (getest 2026-11-20)**

| Onderdeel | Laadt | Getest |
|---|---|---|
| frontend-design (skill) | ja, in de skilllijst | niet uitgevoerd |
| code-review (`/code-review`) | ja | uitgevoerd op PR #2: liep zonder fout, gaf geen bevindingen terug ("(none)"); niet na te gaan of de diff echt is bekeken |
| playwright (MCP) | ja | live app geopend op 390 × 844 en schermafbeelding gemaakt (`docs/schermafbeeldingen/v1.0.0-telefoon.png`) |
| ui-review, ui-polish, ui-compare (UI Design Review) | ja, in de skilllijst | niet uitgevoerd |
| no-ui-slop (uxkin) | ja, in de skilllijst | niet uitgevoerd |
| uxkin-MCP (voorbeelden uit echte apps) | nee: vraagt een inlog (betaald plan, $9,99/maand of $99 eenmalig) | `uxkin.com` is toegestaan in de omgeving; de server antwoordt 401 |
| design (accessibility-review, ux-copy, enz.) | ja, in de skilllijst | niet uitgevoerd |
| design-MCP-koppelingen (Slack, Figma, Notion, …) | nee: de proxy blokkeert die hosts | niet nodig voor Nopav.es |
| losse kopieën in `.claude/skills/` | niet te testen in deze sessie: projectskills laden bij de start van een sessie in deze repo | frontmatter gecontroleerd |

In deze sessie kwamen de plugins via de accountinstellingen, niet via `.claude/settings.json`. Of de
officiële plugins in een nieuwe cloudsessie ook via dat bestand laden, blijkt pas bij de eerste
nieuwe sessie in nopaves.

## Open punten

- Wisselvallige desktoptest bij "Route hierheen": opgelost in PR #2.
- Overige open punten: GitHub Issues #3–#11.
