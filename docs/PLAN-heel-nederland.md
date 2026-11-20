# Plan: de vooraf bewerkte graaf voor heel Nederland, in één keer

Status: **fase 0 gemeten** (2026-11-20, `fase0.yml` run 4). Alle metingen zijn binnen, behalve de BGT-download
van Noord-Brabant (verbinding verbroken na 1,77 GB; loopt opnieuw). Conclusie: heel NL past ruim, de
OSM-kant is licht, en de BGT is het zware deel. Hieronder de cijfers, wat dat aan het plan verandert, een
planning per fase en een kostenraming. Nog niets gebouwd voor de app.

## Beslissingen (Oscar, 2026-11-20)

1. De graaf komt **buiten git**, als release-bijlage; de deploy zet hem in de Pages-site. In git staat alleen
   welke versie is goedgekeurd.
2. De BGT komt via de **PDOK-download** (volledig, daarna dagelijkse wijzigingen), niet meer als losse
   vectortegels.
3. ~~Utrecht is de eerste proefprovincie.~~ Vervangen door 5: Utrecht (stedelijk) en Drenthe (landelijk)
   zijn de **kalibratieprovincies** van fase 0: daar draaide de echte bouw, de andere tien zijn daarmee
   omgerekend.
4. Volgorde: eerst de openstaande Nopave-router-commits afronden (gedaan, v1.2.0), daarna fase 0.
5. **Heel Nederland in één keer:** alle 12 provincies parallel bouwen, testen en samen live zetten. Geen
   uitrol provincie voor provincie.

## De cijfers in één tabel

| | Regio Delft (gemeten) | Heel Nederland | Grens |
|---|---|---|---|
| Wegstukken | 1,37 mln | **14,5 mln (gemeten,** 10,6×) | |
| Graaf gzip | 14,7 MB (10,75 B per wegstuk) | **155 MB (geraamd** met 10,69 B per wegstuk, gemeten in Utrecht en Drenthe) | Pages-site 1 GB: past ruim |
| In git per week | +15 MB | 0 (release-bijlage, beslissing 1) | |
| OSM-extract | Zuid-Holland | **1,41 GB** (Geofabrik) / **1,65 GB** (openstreetmap.fr) | |
| Knippen in 12 | | **2,7 min (gemeten),** max. 11,0 GB geheugen per portie van 3 | runner 16 GB: niet alle 12 in één keer |
| Graaf zonder BGT/AHN, grootste provincie | | **0,3 min, 1,6 GB (gemeten,** Zuid-Holland) | |
| Bouw met BGT-tegels + AHN, koude cache | 77 min | **64 min Utrecht, 80 min Drenthe (gemeten);** max. ~171 min Gelderland (geraamd) | 6 uur per job: past, maar zie BGT |
| BGT `full/custom`, 5 objecttypes | 28.540 losse tegels | **27,7 GB zip voor 11 provincies (gemeten)** + Noord-Brabant (> 1,77 GB) | runner-schijf ~14 GB |
| BGT-delta per week, heel NL | | **53 MB zip (gemeten** in run 1 en run 4) | |
| Actions-minuten fase 0 | | **778 runner-minuten, 2 u 06 min doorlooptijd** | openbare repo: gratis |

## Wat fase 0 heeft gemeten

Workflow `.github/workflows/fase0.yml`, run 4 (2026-11-20 17:55–20:01 UTC), alle 12 provincies tegelijk.
Scripts in `tools/fase0/`. De provinciegrenzen komen van PDOK (Bestuurlijke Gebieden).

### Per provincie

| Provincie | land km² | wegstukken | km weg | km onverhard (OSM zeker) | graaf gz MB | bouw min (koude cache) | BGT zip MB | BGT download min |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Drenthe | 2.633 | 857.264 | 19.448 | 3.438 | **8,8** gemeten | **80** gemeten | 1.635 | 18 |
| Flevoland | 1.412 | 515.652 | 10.368 | 839 | 5,5 | 42 | 1.411 | 17 |
| Fryslân | 3.341 | 940.328 | 19.104 | 2.131 | 10 | 77 | 1.713 | 32 |
| Gelderland | 4.964 | 2.096.901 | 47.507 | 8.045 | 22 | 171 | 6.094 | 90 |
| Groningen | 2.325 | 528.755 | 13.590 | 1.359 | 5,7 | 43 | 1.543 | 25 |
| Limburg | 2.148 | 1.068.398 | 23.610 | 3.648 | 11 | 87 | 2.349 | 45 |
| Noord-Brabant | 4.905 | 1.871.654 | 48.731 | 7.650 | 20 | 153 | > 1.770 (afgebroken) | – |
| Noord-Holland | 2.662 | 1.797.602 | 34.819 | 3.525 | 19 | 147 | 3.022 | 38 |
| Overijssel | 3.317 | 1.366.548 | 27.624 | 4.606 | 15 | 112 | 2.914 | 32 |
| Utrecht | 1.485 | 907.197 | 19.346 | 2.933 | **10** gemeten | **64** gemeten | 2.539 | 56 |
| Zeeland | 1.781 | 477.041 | 12.843 | 968 | 5,1 | 39 | 683 | 9,6 |
| Zuid-Holland | 2.700 | 2.063.824 | 41.989 | 3.005 | 22 | 169 | 3.748 | 42 |
| **Totaal** | 33.673 | **14.491.164** | **318.979** | **42.147** | **155** | | **27.650** + NB | |

Niet vet = geraamd (wegstukken × de verhouding uit Utrecht en Drenthe). Wegstukken, km en BGT zijn voor alle
provincies gemeten. Land-km² zijn afgeronde CBS-cijfers, overgenomen en niet nagekeken. Een weg over een
provinciegrens telt in beide provincies mee (osmium `complete_ways`): een kleine dubbeltelling.

### Wat de cijfers zeggen

- **De graaf past ruim.** 155 MB voor heel NL zit onderin de oude schatting (130–330 MB), en de verhouding
  per wegstuk is overal bijna gelijk (Delft 10,75 B, Utrecht en Drenthe samen 10,69 B). In de Pages-site (1 GB)
  is er ruimte genoeg. **Het compactere formaat (opzet 4) hoeft dus niet vóór de livegang;** het blijft
  nuttig voor minder dataverkeer per planning.
- **De OSM-kant is licht.** Knippen kost 2,7 min. Elementen lezen en de graaf bouwen kosten per provincie
  hooguit 3,1 min en 1,6 GB. Eén runner kan de 12 provincies zelfs achter elkaar doen.
- **Knippen moet in porties.** Een portie van 3 provincies gebruikt al 11,0 GB; alle 12 in één run past
  niet op een runner van 16 GB. Dat verklaart vermoedelijk run 3 (runner gestopt na 30 s).
- **De BGT is het zware deel.**
  - *Groot:* de 11 provincies samen geven al 27,7 GB zip, meer dan de kant-en-klare download van heel NL
    met álle objecttypes (28,0 GB, `full/predefined/bgt-gmllight-nl-nopbp.zip`, elke nacht ververst).
    Oorzaak: de provincies zijn als rechthoek (bbox) opgevraagd, en die rechthoeken overlappen fors.
  - *Vooral historie:* in Utrecht is 61% van de objecten een oude versie (4,1 van 6,7 mln), in Drenthe
    62% (3,0 van 4,8 mln).
  - *Traag per download, niet per afnemer:* elke download liep op 0,8–1,5 MB/s, ook met 12 tegelijk.
    PDOK begrenst dus per download. Gelderland deed 6,1 GB in 90 min.
  - *Kwetsbaar:* de download van Noord-Brabant brak af na 1,77 GB (verbinding verbroken). Een download
    van uren moet kunnen hervatten.
  - *Wachttijd:* PDOK had de bestanden in 5–28 min klaar, ook met 12 aanvragen tegelijk.
- **Het weekvolume is klein:** 53 MB aan delta's voor heel NL per week (werkdagen 9–15 MB, weekend ~20 kB).
- **De bouw met de oude methode** (BGT-tegels + AHN, koude cache) zou ook passen: geraamd tot ~171 min per
  provincie. Maar dat zijn ~300.000 tegelverzoeken per ronde bij PDOK, en dat wilde het plan afschaffen.
  Hoe snel de bouw is met de afgeleide BGT is nog niet gemeten.
- **Geofabrik is onbetrouwbaar gebleken:** in run 1 gaf Geofabrik 404 op de grenzen, in run 2 weigerde
  het elke verbinding, en in run 4 viel de knipjob terug op openstreetmap.fr. Twee bronnen is geen luxe.

Ruwe metingen en eerdere losse proeven (de API, het geofilter in vakken van ~5 km, 66% historie in één vak
rond Delft, één dag delta = 14,8 MB, de kant-en-klare delta van 47 GB is onbruikbaar): zie de geschiedenis van
dit bestand en de samenvatting in de runs van `fase0.yml`.

## Opzet: alles in één keer (bijgewerkt na fase 0)

```
knip (1 job)            OSM-extract (Geofabrik, anders openstreetmap.fr), osmium knipt in 4 porties van 3
bgt (1 job, zelden)     BGT voor heel NL ophalen (hervatbaar) en omzetten naar het afgeleide bestand per blok;
                        wekelijks alleen de delta van die week toepassen
   │
   ├── bouw × 12        per provincie: graaf + oordeel uit het afgeleide BGT-bestand + AHN, blokken schrijven
   │
samen (1 job)           randblokken samenvoegen, index per provincie, de kwaliteitspoort voor álle provincies,
                        release-bijlage, PR met goedgekeurd.txt
```

1. **Graaf buiten git.** De wekelijkse bouw zet de blokken als release-bijlage (`graaf-vJJJJMMDD-rN`, tot
   2 GB per bestand; 155 MB past in één bestand). Na de tests opent de workflow een PR die alleen
   `public/graaf/goedgekeurd.txt` verandert. De deploy haalt die versie op en zet de blokken in de Pages-site.
   Terugzetten = dat regeltje terugdraaien. Oude bijlagen na 8 weken weg.
2. **Alle provincies parallel.** 12 bouwjobs tegelijk, gevoed door één knipjob. Blokken op de provinciegrens
   maakt de samenvoegjob één keer (wegstukken samenvoegen op OSM-id). De eerste livegang is **alles of
   niets**; daarna houdt een provincie die mislukt haar vorige versie.
3. **BGT: één download voor heel NL in plaats van 12 rechthoeken** (gewijzigd na fase 0). De rechthoeken
   overlappen te veel en zijn samen al groter dan heel NL. Kandidaten, te meten in fase 1:
   (a) `full/custom` zonder geofilter, 5 objecttypes (één bestand, kleiner dan 28 GB);
   (b) het kant-en-klare bestand van 28,0 GB, in stukken opgehaald (PDOK ondersteunt `Range`: nagekeken,
   antwoord 206) zodat het hervat kan worden en meerdere stukken tegelijk kunnen lopen;
   (c) `full/custom` per provincie met de echte provinciegrens in plaats van de bbox.
   Bij 1,1 MB/s duurt 20–28 GB in één stroom 5–7 uur: te lang voor één job. Daarom hervatbaar en in stukken.
   Bij het inlezen gaat de historie (`eindRegistratie`, ~60%) eruit. Bewaard wordt alleen het afgeleide
   bestand (ondergrondvlakken per blok, zonder historie), als release-bijlage. Wekelijks de delta toepassen
   (53 MB); elke paar maanden opnieuw volledig.
4. **Compacter formaat:** na de livegang (zie boven), voor minder dataverkeer per planning.
5. **App.** Een index per provincie in plaats van één manifest; stations per blok; de app ziet zelf of een
   plek binnen de dekking valt en valt anders terug op de kaarttegels (buiten NL, of als een blok ontbreekt).
6. **Eén kwaliteitspoort, per provincie gemeten:** ondergrondoordeel tegen de app ≥ 98% in elke provincie;
   per provincie ≥ 3 A-naar-B-paren, 2 rondjes en 1 station, deels achtergehouden; Playwright groen;
   Nopave-router op die paren minstens zo goed als BRouter. Alle 12 groen = live.
7. **Uitrol.** Achter `?graaf=nl` tot de poort voor alle provincies groen is; dan in één keer de standaard.

## Planning per fase

Volgorde met afhankelijkheden. De omvang is een schatting in werksessies van Claude met review door Oscar;
iedere fase eindigt met een PR volgens CLAUDE.md.

| Fase | Wat | Klaar als | Omvang (schatting) |
|---|---|---|---|
| 1. BGT-bron | Downloadroute kiezen (3a/b/c meten), hervatbaar ophalen, stromend omzetten naar het afgeleide bestand zonder historie, delta toepassen | heel NL in één workflow binnen 6 uur; oordeel uit het afgeleide bestand ≥ 98% gelijk aan de tegelmethode in Utrecht en Drenthe | 2–3 sessies |
| 2. Bouw per provincie | `bouw.mjs` leest het afgeleide BGT-bestand; AHN voor heel NL (cache-strategie, zie risico's); matrix van 12 | 12 provincies gebouwd, tijd en grootte gemeten | 2 sessies |
| 3. Samenvoegen en uitleveren | randblokken, index per provincie, release-bijlage, deploy uit de release, `goedgekeurd.txt` | deploy zet heel NL in de Pages-site; terugzetten getest | 2 sessies |
| 4. App | index per provincie, dekking per plek, `?graaf=nl`, terugval op tegels | Playwright groen met en zonder `?graaf=nl`, ook buiten NL | 1–2 sessies |
| 5. Kwaliteitspoort | testparen per provincie (36 A-naar-B, 24 rondjes, 12 stations), oordeel per provincie | alle 12 provincies groen | 2 sessies |
| 6. Livegang | `?graaf=nl` wordt de standaard; release en CHANGELOG | live; regio Delft-graaf opgeruimd (eerst vastgelegd) | 1 sessie |

Fase 1 is het grootste risico en gaat eerst. Fase 4 kan parallel aan 2 en 3.

## Kostenraming

**In geld: € 0.** GitHub Actions is gratis voor een openbare repo (eerder nagekeken), GitHub Pages en
release-bijlagen zijn gratis, en PDOK, Geofabrik en openstreetmap.fr zijn gratis open data. Er komt geen
server bij. De echte kosten zijn tijd en limieten:

| Post | Raming | Grens | Basis |
|---|---|---|---|
| Actions, wekelijkse bouw | ~3–6 runner-uur per week (knip 6 min, 12 × bouw, samen, tests) | geen (openbare repo) | fase 0: 778 runner-min, waarvan 597 BGT-download |
| Actions, volledige BGT (een paar keer per jaar) | ~6–12 runner-uur per keer | 6 uur per job: in stukken | 27,7 GB in 11 jobs |
| Release-bijlagen | 155 MB graaf + afgeleide BGT (grootte onbekend) per week, 8 weken bewaard | 2 GB per bestand | graaf: geraamd; BGT: fase 1 |
| Pages-site | ~155 MB graaf + app | 1 GB | geraamd |
| Pages-verkeer | ~2 MB per rondje, ~7 MB per station-planning | ~100 GB per maand (zacht) | proef Delft |
| Belasting PDOK | wekelijks 53 MB delta; een paar keer per jaar ~20–28 GB | fair use | gemeten |

## Risico's en open vragen

- **BGT-download van uren** (gemeten: 0,8–1,5 MB/s per download, één afgebroken na 1,77 GB). Hervatbaar
  ophalen met `Range` is nodig; of meerdere stukken tegelijk sneller gaan, meet fase 1.
- **AHN voor heel NL** is nog niet gemeten. In de regio Delft zat AHN in de cache van 1,47 GB; voor heel NL
  past dat niet in de Actions-cache (10 GB). Mogelijke oplossing: de hoogtes uit de vorige graafversie
  hergebruiken voor ongewijzigde wegstukken.
- **Alles tegelijk = alles tegelijk mis.** Eén haperende provincie houdt de eerste livegang tegen (bewust,
  beslissing 5).
- **Schijf op de runner (~14 GB vrij):** de BGT-download voor heel NL past niet uitgepakt en mogelijk ook
  niet als zip. De omzetting moet stromend lezen, of per stuk ophalen en direct omzetten.
- **Geofabrik hapert** (drie keer op 2026-11-20). Twee bronnen plus een extract als release-bijlage als
  laatste vangnet.
- **Kwaliteit buiten de Randstad:** de Nopave-router en het oordeel zijn alleen rond Delft gemeten; fase 5.
- **Pages-verkeer** bij veel gebruikers: in de gaten houden.
- **Release-bijlagen ophalen in de deploy:** nog niet getest (grootte, tijd, rechten van `GITHUB_TOKEN`).
