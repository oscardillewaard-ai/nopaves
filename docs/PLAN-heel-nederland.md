# Plan: de vooraf bewerkte graaf voor heel Nederland

Status: **plan, nog niet gebouwd** (2026-11-20). Eerst fase 0 (drie proefmetingen); daarna een
planning en kostenraming op basis van echte cijfers.

## Beslissingen (Oscar, 2026-11-20)

1. De graaf komt **buiten git**, als release-bijlage; de deploy zet hem in de Pages-site. In git staat alleen
   welke versie is goedgekeurd.
2. De BGT komt via de **PDOK-download** (volledig per provincie, daarna dagelijkse wijzigingen), niet meer
   als losse vectortegels.
3. **Utrecht** is de eerste proefprovincie (na Zuid-Holland, dat de huidige regio omvat).
4. Volgorde: eerst de openstaande Nopave-router-commits afronden, daarna fase 0.

## Waarom de huidige opzet niet schaalt

| | Regio Delft (gemeten) | Heel Nederland | Grens |
|---|---|---|---|
| Land | ≈ 1.500 km² | 33.700 km² (≈ 22×) | |
| Graaf gzip | 14,7 MB | 130–330 MB (schatting) | Pages-site 1 GB: past |
| In git per week | +15 MB | +150–330 MB | repo boven 5 GB: GitHub waarschuwt; nopaves is nu 54 MB |
| Actions-cache (BGT, AHN, extract) | 1,47 GB (runlog) | ~30 GB | 10 GB per repo |
| Bouw, koude cache | 77 min (run 1) | ~28 uur in één job | 6 uur per job |
| Bouw, warme cache | 4 min (run 3) | ~1,5 uur | |
| Actions-minuten | | 2–4 uur per week | openbare repo: gratis (nagekeken) |
| BGT | 28.540 losse tegels | ~300.000 tegels per ronde | onnodig zware belasting voor PDOK |

Gecontroleerd: de cijfers van de regio (runlogs, manifesten), dat nopaves openbaar is, en dat PDOK een
BGT-download heeft (`https://api.pdok.nl/lv/bgt/download/v1_0/`: `full/custom` voor een gekozen gebied via
POST, `delta` met dagelijkse wijzigingen over ongeveer de laatste 30 dagen, `dataset` met de actualiteit per
objecttype). Aanname: de wegdichtheid buiten de regio (en dus grootte en bouwtijd voor heel NL), de grootte
van een BGT-download per provincie, en de winst van een compacter formaat.

## Opzet

1. **Graaf buiten git.** De wekelijkse bouw zet de blokken als release-bijlage (`graaf-vJJJJMMDD-rN`, tot
   2 GB per bestand). Na de echte tests opent de workflow een PR die alleen `public/graaf/goedgekeurd.txt`
   (de versie) verandert. De deploy haalt die versie op en zet de blokken op dezelfde plek in de Pages-site;
   de app merkt er niets van. Terugzetten = dat regeltje terugdraaien. Oude bijlagen na 8 weken weg.
2. **Per provincie bouwen.** Een matrix van 12 jobs, elk ruim onder de 6 uur, daarna één job die de
   manifesten samenvoegt en de tests draait. Mislukt een provincie, dan blijft haar vorige versie staan.
3. **BGT via de PDOK-download.** Eén keer `full/custom` per provincie (alleen de objecttypes die de app
   gebruikt: wegdeel, ondersteunend wegdeel, onbegroeid en begroeid terreindeel), daarna wekelijks de
   dagelijkse `delta`'s van die week toepassen. Bewaard wordt een eigen afgeleid bestand (ondergrondvlakken
   per blok, compact en geïndexeerd), als release-bijlage, niet de ruwe BGT en niet in de Actions-cache.
   Elke paar maanden opnieuw volledig, als controle op gemiste wijzigingen.
4. **Compacter formaat.** Kleinere blokken in de stad (splitsen op zoom 13 boven ~400 kB), grotere op het
   land (zoom 11); ketens tussen kruisingen in plaats van losse stukjes; coördinaten op 1e-6°; gedeelde
   tabellen voor tags en oordeel-uitleg. Verwacht 30–40% kleiner (schatting uit de proef).
5. **App.** Een index per provincie in plaats van één manifest (1.150 blokken met hash is ~170 kB JSON);
   stations per blok in plaats van in het manifest; de app ziet zelf of een plek binnen de dekking valt en
   valt anders terug op de kaarttegels.
6. **Kwaliteitspoort per provincie,** vóór die provincie live gaat: ondergrondoordeel tegen de app ≥ 98%;
   per provincie ≥ 3 A-naar-B-paren, 2 rondjes en 1 station, waarvan een deel achtergehouden (zoals
   `tools/graaf/ab_nieuw.mjs`); Playwright groen; Nopave-router op die paren minstens zo goed als BRouter.
7. **Uitrol.** Eerst Zuid-Holland, dan provincie voor provincie. Tot de poort groen is alleen achter
   `?graaf=nl`. De regio Delft blijft tot dan zoals nu.

## Fase 0: drie proefmetingen (elk een paar uur, nog niet live)

| Meting | Levert op | Waarom eerst |
|---|---|---|
| Utrecht bouwen met de huidige methode (Geofabrik + BGT-tegels + AHN) | echte wegdichtheid, grootte en bouwtijd buiten de Randstad | de schatting 130–330 MB hangt hiervan af |
| BGT `full/custom` voor Utrecht en een week aan `delta`'s | downloadgrootte en -tijd, en of de wijzigingen bruikbaar zijn | bepaalt of opzet 3 werkt |
| Het NL-extract van Geofabrik per provincie bijsnijden | tijd en geheugen op een gewone runner | Geofabrik haperde op 2026-11-20 twee keer |

Daarna: dit plan bijwerken met echte cijfers, een planning per fase en een kostenraming, en pas dan bouwen.

## Risico's en open vragen

- **Pages-verkeer:** ~100 GB per maand (zachte grens). Een station-planning haalt ~7 MB, een rondje ~2 MB
  (proef). Bij veel gebruikers is dat een grens om in de gaten te houden.
- **Geofabrik hapert soms;** de workflow probeert opnieuw en valt terug op een recent extract (PR #17).
- **De BGT-download is ongetest:** formaat, grootte en of `full/custom` per provincie werkt (async aanvraag,
  dan downloaden) moet fase 0 uitwijzen.
- **Kwaliteit buiten de Randstad:** de Nopave-router en het oordeel zijn alleen rond Delft gemeten.
- **Release-bijlagen ophalen in de deploy:** nog niet getest (grootte, tijd, rechten van `GITHUB_TOKEN`).
