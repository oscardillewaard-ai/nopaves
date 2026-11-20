# Nopav.es

Nopav.es plant hardlooproutes over zo veel mogelijk onverharde paden in Nederland: een rondje vanaf
je deur, een route naar een station, van A naar B, of rondjes binnen een natuurgebied. Elke route
krijgt een score en een verdeling onverhard, half verhard en verhard, en je kunt hem als GPX
meenemen of bewaren. Alles draait in je browser. Er is geen server en er is geen tracking.

**Live:** https://oscardillewaard-ai.github.io/nopaves/

## Lokaal draaien

Je hebt Node 22 en Python 3 nodig.

```bash
npm ci
```

```bash
npm run serve
```

Open daarna http://localhost:8765/nopaves/. `tools/serve.py` serveert `public/` onder `/nopaves/`,
net als GitHub Pages.

## Tests

```bash
npm run test:unit
```

```bash
npm run lint
```

Playwright (telefoon 390 × 844 en desktop). Laat de lokale server draaien:

```bash
npx playwright install chromium
```

```bash
npm run test:mobiel
```

```bash
npm run test:desktop
```

In de cloudomgeving van Claude Code staat Chromium al klaar. Zet daar
`CHROMIUM_PAD=/opt/pw-browsers/chromium` voor de Playwright-commando's.

De workflow `test` draait dit allemaal bij elke pull request. De workflow `deploy` zet `public/`
online bij elke push naar `main`.

## Mappen

| Map | Inhoud |
|---|---|
| `public/` | de app zelf: HTML, JS, CSS, service worker, manifest, `graaf/<versie>/` |
| `tests/` | unit-tests (`test_web_kern.mjs`) en Playwright-tests |
| `tools/` | `serve.py`, `graaf/` (voorbewerkte routegraaf), `onverhard/` (Python-planner, metingen), `icons/` |
| `docs/` | voortgang, bevindingen, metingen en schermafbeeldingen |
| `.github/workflows/` | `test`, `deploy` en de wekelijkse graafbouw |

## Bronnen en licenties

| Bron | Gebruik | Licentie / voorwaarden |
|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | paden, ondergrond, toegang (via de tegels en de graaf) | Open Database License (ODbL) 1.0, © OpenStreetMap-bijdragers |
| [OpenFreeMap](https://openfreemap.org) / [OpenMapTiles](https://openmaptiles.org) | vectortegels voor de kaart en de paden | tegels: data ODbL (OSM); OpenMapTiles-schema © OpenMapTiles (BSD/CC-BY, naamsvermelding) |
| [Geofabrik](https://download.geofabrik.de) | OSM-extract Zuid-Holland voor de wekelijkse graafbouw | OSM-data, ODbL 1.0 |
| PDOK BGT (Kadaster) | officiële ondergrond (wegdeel, onbegroeid terrein, strand) | CC0 1.0 |
| PDOK AHN (Rijkswaterstaat) | hoogte en hoogtemeters | CC0 1.0 |
| PDOK Locatieserver | plaatsen zoeken | open data van PDOK (licentie niet in deze sessie nagekeken) |
| PDOK Natura 2000 (RVO) | natuurgebieden voor "In gebied" | Public Domain Mark 1.0 |
| PDOK Luchtfoto (Het Waterschapshuis) | luchtfotolaag | open data, CC BY (naamsvermelding) |
| [BRouter](https://brouter.de) | routes van A naar B (standaard) | dienst van brouter.de; software MIT, routes uit OSM-data (ODbL) |

**De graafblokken in `public/graaf/` zijn afgeleid van OpenStreetMap-data en vallen daarmee onder de
ODbL.** Wie ze hergebruikt, moet de naamsvermelding (© OpenStreetMap-bijdragers) houden en een
aangepaste versie van de database onder dezelfde licentie delen.

De licenties van BGT, AHN en Natura 2000 komen uit de PDOK-dienstbeschrijvingen (nagekeken op
2026-11-20). De rest volgt de gangbare voorwaarden van die bronnen.

## Licentie

Licentie: nog niet gekozen. Zie [docs/licentie-keuze.md](docs/licentie-keuze.md). Tot er een keuze is,
houdt de maker alle rechten op de code voor. De databronnen hierboven houden hun eigen licentie.
