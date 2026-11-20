# Plan: de vooraf bewerkte graaf voor heel Nederland, in één keer

Status: **fase 0 loopt** (2026-11-20). Eerste metingen aan de BGT-download zijn gedaan (hieronder);
de rest draait in de workflow `fase0.yml` (alle 12 provincies tegelijk). Daarna: dit plan bijwerken met de
echte cijfers, een planning per fase en een kostenraming, en pas dan bouwen.

## Beslissingen (Oscar, 2026-11-20)

1. De graaf komt **buiten git**, als release-bijlage; de deploy zet hem in de Pages-site. In git staat alleen
   welke versie is goedgekeurd.
2. De BGT komt via de **PDOK-download** (volledig, daarna dagelijkse wijzigingen), niet meer als losse
   vectortegels.
3. ~~Utrecht is de eerste proefprovincie.~~ Vervangen door 5: Utrecht (stedelijk) en Drenthe (landelijk)
   zijn nu de **kalibratieprovincies** in fase 0: daar draait de echte bouw, de andere tien worden daarmee
   omgerekend.
4. Volgorde: eerst de openstaande Nopave-router-commits afronden (gedaan, v1.2.0), daarna fase 0.
5. **Heel Nederland in één keer:** alle 12 provincies parallel bouwen, testen en samen live zetten. Geen
   uitrol provincie voor provincie.

## Waarom de huidige opzet niet schaalt

| | Regio Delft (gemeten) | Heel Nederland | Grens |
|---|---|---|---|
| Land | ≈ 1.700 km² (bbox) | 33.700 km² (≈ 20×) | |
| Graaf gzip | 14,7 MB (1,37 mln wegstukken, 10,75 B per wegstuk) | 130–330 MB (schatting; fase 0 meet het) | Pages-site 1 GB: past |
| In git per week | +15 MB | +150–330 MB | repo boven 5 GB: GitHub waarschuwt; nopaves is nu 54 MB |
| Actions-cache (BGT, AHN, extract) | 1,47 GB (runlog) | ~30 GB | 10 GB per repo |
| Bouw, koude cache | 77 min (run 1) | ~28 uur in één job | 6 uur per job |
| Bouw, warme cache | 4 min (run 3) | ~1,5 uur | |
| Actions-minuten | | 12 jobs tegelijk, 2–4 uur per week | openbare repo: gratis (nagekeken) |
| BGT | 28.540 losse tegels | ~300.000 tegels per ronde | onnodig zware belasting voor PDOK |

## Opzet: alles in één keer

```
knip (1 job)            NL-extract één keer ophalen, osmium knipt in porties naar 12 provincies
   │
   ├── bouw × 12        per provincie: OSM-graaf + BGT-vlakken (afgeleid bestand) + AHN, blokken schrijven
   │                    (alle 12 tegelijk, elk ruim onder de 6 uur; mislukt er één, dan stopt de ronde)
   │
samen (1 job)           manifesten samenvoegen, randblokken tussen provincies oplossen, index per provincie,
                        de kwaliteitspoort voor álle provincies, release-bijlage, PR met goedgekeurd.txt
```

1. **Graaf buiten git.** De wekelijkse bouw zet de blokken als release-bijlage (`graaf-vJJJJMMDD-rN`, tot
   2 GB per bestand). Na de tests opent de workflow een PR die alleen `public/graaf/goedgekeurd.txt`
   (de versie) verandert. De deploy haalt die versie op en zet de blokken op dezelfde plek in de Pages-site;
   de app merkt er niets van. Terugzetten = dat regeltje terugdraaien. Oude bijlagen na 8 weken weg.
2. **Alle provincies parallel.** Een matrix van 12 jobs die tegelijk draaien, gevoed door één knipjob (één
   download bij Geofabrik in plaats van twaalf). Blokken op de provinciegrens worden in de samenvoegjob
   één keer gemaakt (zelfde blok uit twee provincies: de wegstukken samenvoegen op OSM-id). De eerste
   livegang is **alles of niets**: pas als alle 12 door de poort komen. Daarna geldt per week: mislukt één
   provincie, dan blijft van die provincie de vorige versie staan en gaat de rest wel door.
3. **BGT via de PDOK-download.** Eén keer `full/custom` per provincie, alle 12 tegelijk (alleen de
   objecttypes die de app gebruikt: wegdeel, ondersteunend wegdeel, begroeid en onbegroeid terreindeel,
   waterdeel voor zee). Daarna wekelijks de `delta/custom` van die week voor heel NL toepassen. Bewaard wordt een
   eigen afgeleid bestand (ondergrondvlakken per blok, compact en geïndexeerd, zonder historie), als
   release-bijlage, niet de ruwe BGT en niet in de Actions-cache. Elke paar maanden opnieuw volledig, als
   controle op gemiste wijzigingen.
4. **Compacter formaat.** Kleinere blokken in de stad (splitsen op zoom 13 boven ~400 kB), grotere op het
   land (zoom 11); ketens tussen kruisingen in plaats van losse stukjes; coördinaten op 1e-6°; gedeelde
   tabellen voor tags en oordeel-uitleg. Verwacht 30–40% kleiner (schatting uit de proef).
5. **App.** Een index per provincie in plaats van één manifest (1.150 blokken met hash is ~170 kB JSON);
   stations per blok in plaats van in het manifest; de app ziet zelf of een plek binnen de dekking valt en
   valt anders terug op de kaarttegels (buiten NL, of als een blok ontbreekt).
6. **Eén kwaliteitspoort, per provincie gemeten:** ondergrondoordeel tegen de app ≥ 98% in elke provincie;
   per provincie ≥ 3 A-naar-B-paren, 2 rondjes en 1 station, waarvan een deel achtergehouden (zoals
   `tools/graaf/ab_nieuw.mjs`); Playwright groen; Nopave-router op die paren minstens zo goed als BRouter.
   Alle 12 groen = live.
7. **Uitrol.** Achter `?graaf=nl` tot de poort voor alle provincies groen is; dan in één keer de standaard.
   De regio Delft blijft tot dan zoals nu.

## Fase 0: proefmetingen, alle provincies tegelijk

Workflow `.github/workflows/fase0.yml` (start bij een push van de workflow of `tools/fase0/` op een
andere branch dan main, of handmatig). Niets gaat live; de uitkomst is een samenvatting in de run
(`$GITHUB_STEP_SUMMARY`, artifact `fase0-samenvatting`).

| Meting | Waar | Levert op |
|---|---|---|
| A. NL-extract één keer ophalen en met osmium in 12 knippen | job `knip` | tijd en geheugen op een gewone runner; één download in plaats van twaalf |
| B. Per provincie de graaf zoals `bouw.mjs`, zonder BGT en AHN | 12 jobs `osm`, tegelijk | echte wegstukken, km en onverhard-km per provincie, wegstukken per blok |
| C. De echte bouw (BGT-tegels + AHN) voor Utrecht en Drenthe | in `osm`, alleen kalibratie | gzip en bouwtijd per wegstuk, stedelijk en landelijk; daarmee de raming voor alle 12 |
| D. BGT `full/custom` per provincie | 12 jobs `bgt`, tegelijk | of PDOK 12 aanvragen tegelijk aankan; wachttijd, grootte, downloadtijd; aandeel historie |
| E. BGT `delta/custom`, heel NL, 7 dagen | job `delta` | weekvolume aan wijzigingen (gemeten, zie hieronder) |

De echte bouw draait bewust maar in twee provincies: met de oude methode (BGT-tegels) zou de bouw voor alle
12 ~300.000 tegelverzoeken bij PDOK doen, en dat wil het plan juist afschaffen. Met de invoer
`kalibratie: alle` kan het toch.

Scripts: `tools/fase0/grenzen.mjs` (provinciegrenzen van PDOK als .poly), `poly.mjs` (bbox, regio en RD-geofilter), `osm_stats.mjs`,
`bgt.mjs` (full en delta), `samenvatting.mjs`. Voor provincies is `laadElementen` in `bouw.mjs` nu regel voor
regel gaan lezen (een hele provincie past niet in één JavaScript-string); getest met 167 MB en tekens
als ë en € op de stukgrens.

### Al gemeten (2026-11-20, in de Claude-sessie, via de proxy)

- **De API werkt zoals beschreven** (`openapi.json`): `POST full/custom` met `featuretypes`, `format`
  (`citygml`, `gmllight`, `stufgeo`) en `geofilter` (WKT in RD), dan de status opvragen tot `COMPLETED`,
  dan een zip. Delta's alleen in `citygml`.
- **Het geofilter werkt in vakken van ongeveer 5 × 5 km.** Een vraag om 1 km² in Delft gaf objecten van
  x 81.600–86.700 en y 443.400–448.450 terug. Gevolg: per provincie komt er een rand van hooguit ~5 km
  van de buren mee. Geen probleem, wel dubbel werk aan de randen.
- **Daar zit veel historie in.** Van de 109.800 wegdelen in dat vak hebben er 72.387 (66%) een
  `eindRegistratie`, en bij begroeid terreindeel 26.519 van 50.726 (52%). Bij het inlezen moeten die eruit.
- **Grootte, stedelijk:** dat vak van ~25 km² rond Delft: 48,7 MB zip, 414 MB GML (5 objecttypes),
  11–12 s wachten. De download liep hier op 1,1 MB/s (door de proxy van de sessie; op een runner meet D het echt).
- **Kant-en-klaar voor heel NL** bestaat ook: `full/predefined/bgt-gmllight-nl-nopbp.zip` is **28,0 GB**
  (alle objecttypes, elke nacht ververst, 20-11 02:11). Dat is een alternatief voor 12 aanvragen, maar met
  alle objecttypes, dus vooral bruikbaar als D tegenvalt.
- **De kant-en-klare delta is onbruikbaar:** `delta/predefined/bgt-citygml-nl-delta.zip` is **47,0 GB**
  (30 dagen, alle typen), groter dan de hele BGT.
- **Delta op maat werkt goed:** één dag (19-11), heel NL, 5 objecttypes: **14,8 MB zip**, 21 s wachten,
  193 MB XML, ~32.000 mutaties (`toevoeging`, en `wijziging` met `was` en `wordt`). Er zijn 30 dagen
  beschikbaar.
- **Een week aan delta's (E, gemeten in fase0.yml run 1 op een GitHub-runner):** 13–19 november, heel NL,
  5 objecttypes: **53,4 MB zip**, 83 s wachten en 45 s downloaden in totaal. Op werkdagen 8,7–14,8 MB, in
  het weekend ~20 kB. Wekelijks bijwerken is dus licht.
- **PDOK levert ongeveer 1,2 MB/s per download**, ook op de runner (zelfde snelheid als in de sessie). Een
  provincie van een paar GB duurt dan een half uur tot een uur; 12 tegelijk scheelt dus echt, als PDOK
  per download begrenst en niet per afnemer. D laat dat zien.
- **Grenzen:** de `.poly`-bestanden van Geofabrik gaven in run 1 herhaald 404 (Drenthe na vijf
  pogingen, Flevoland zeven keer niet). Nu komen de grenzen van PDOK (Bestuurlijke Gebieden,
  `provinciegebied`, alle 12 in één verzoek van 5,4 MB), dezelfde bron als de BGT; osmium leest ze (met
  gaten) goed. Het NL-extract zelf kwam in run 1 wel binnen.
- **Knippen in één osmium-run past niet (run 3, vermoeden):** het NL-extract is **1,41 GB**; met alle 12
  extracts tegelijk (`complete_ways`) stopte de runner na 30 s met een "shutdown signal". Dat is bij
  GitHub-runners meestal geheugen vol (16 GB), maar de log zegt het niet letterlijk. Nu: 4 porties van 3,
  met het vrije geheugen elke 10 s in de log.
- Geofabrik: vanuit de sessie verbrak de server de verbinding (TLS-reset). Waar dat aan ligt is niet
  uitgezocht; A meet het op een gewone runner.

Nog aanname tot de workflow klaar is: de wegdichtheid buiten de Randstad (dus grootte en bouwtijd voor heel
NL), de BGT-grootte per provincie, en of PDOK 12 aanvragen tegelijk soepel verwerkt.

Daarna: dit plan bijwerken met de echte cijfers, een planning per fase en een kostenraming, en pas dan bouwen.

## Risico's en open vragen

- **Alles tegelijk = alles tegelijk mis.** Eén haperende provincie houdt de eerste livegang tegen. Dat is
  bewust (beslissing 5); na de eerste livegang valt een provincie die mislukt terug op haar vorige versie.
- **Belasting voor PDOK:** 12 BGT-aanvragen tegelijk is een paar keer per jaar (daarna alleen delta's,
  ~100 MB per week). AHN blijft per blok; voor heel NL is dat éénmalig veel en daarna een jaar uit de cache.
- **Schijf op de runner (~14 GB vrij):** een BGT-zip van een grote provincie kan gigabytes zijn en
  uitgepakt het tienvoudige. De omzetting moet daarom stromend uit de zip lezen (fase 0 telt al zo).
- **Pages-verkeer:** ~100 GB per maand (zachte grens). Een station-planning haalt ~7 MB, een rondje ~2 MB
  (proef). Bij veel gebruikers is dat een grens om in de gaten te houden.
- **Pages-site 1 GB:** heel NL moet in één keer passen, plus de app. De raming uit fase 0 bepaalt of het
  compactere formaat (opzet 4) vóór de livegang moet.
- **Geofabrik hapert soms:** op 2026-11-20 gaf Geofabrik eerst 404 op de grenzen (run 1) en weigerde het
  daarna 6 minuten lang elke verbinding (run 2). De knipjob valt nu terug op openstreetmap.fr; de wekelijkse
  bouw valt terug op een recent extract (PR #17). Voor de echte bouw: twee bronnen plus een extract in de
  release-bijlagen als laatste vangnet.
- **Kwaliteit buiten de Randstad:** de Nopave-router en het oordeel zijn alleen rond Delft gemeten.
- **Release-bijlagen ophalen in de deploy:** nog niet getest (grootte, tijd, rechten van `GITHUB_TOKEN`).
