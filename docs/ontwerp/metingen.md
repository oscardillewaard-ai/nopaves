# Metingen: laadtijd en tijd tot route, voor en na de nieuwe look

Gemeten op 2026-11-21 in de cloudomgeving, telefoonformaat, met niets anders ernaast. Voor = `main`
(`e9a86a5`, Korrel, v1.2.0) op poort 8766; na = deze branch (Veldboek) op poort 8765, om en om.

## Laadtijd (`tools/ontwerp/laadtijd.mjs`, 5× koud, mediaan, twee rondes)

| | DOMContentLoaded | load | lettertypen klaar | kaart getekend | CSS | lettertypen | eigen JS |
|---|---|---|---|---|---|---|---|
| Voor, ronde 1 | 197 ms | 224 ms | 305 ms | 1503 ms | 144,2 kB | 70,3 kB | 439,7 kB |
| Na, ronde 1 | 186 ms | 212 ms | 296 ms | 1325 ms | 151,2 kB | 76,8 kB | 445,5 kB |
| Voor, ronde 2 | 200 ms | 230 ms | 332 ms | 1356 ms | | | |
| Na, ronde 2 | 188 ms | 215 ms | 316 ms | 1326 ms | | | |

CSS is inclusief Leaflet en MapLibre (vendor). Er komt 6,5 kB lettertype bij (Literata in plaats van
Darker Grotesque en Overpass Mono), 7 kB CSS (tokens.css) en 6 kB JS (kaarttokens.js). De kaart staat er
niet later; eerder iets sneller, vermoedelijk omdat het water geen patroon meer heeft.

## Tijd tot route (`tools/onverhard/benchmark_snelheid.mjs`, VOORTGANG stap 0: 5× koud, 5× warm, mediaan)

| | Rondje 10 km koud | warm | Station 15 km koud | warm |
|---|---|---|---|---|
| Voor, ronde 1 | 3550 ms | 3872 ms | 2685 ms | 2518 ms |
| Na, ronde 1 | 3729 ms | 3929 ms | 2592 ms | 2450 ms |
| Na, ronde 2 | 3551 ms | 3859 ms | | |
| Voor, ronde 2 | 3633 ms | 3822 ms | | |

De verschillen wisselen van kant en blijven binnen ± 5 %; het grootste deel zit in de fase "route" (het
rekenwerk in de worker), waar de stijl niets aan verandert. **Conclusie: niet trager.**
