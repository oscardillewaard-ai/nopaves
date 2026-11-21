# Nopav.es: nieuwe look & feel

Voortgangsbestand van de ontwerpopdracht (2026-11-20). Begint een sessie met "ga verder": lees dit
bestand en ga verder bij de eerste stap die niet `klaar` is. Werk op de sessiebranch; PR's heten
`feat: ontwerp …`.

## Status

| Stap | Status | Waar |
|---|---|---|
| 0 Huidige stand vastleggen | klaar | [ontwerp/huidig.md](ontwerp/huidig.md), beelden in `ontwerp/huidig/` |
| 1 Ontwerptokens | bezig: code klaar, pixelgelijk bevestigd; Playwright loopt, PR nog niet | `public/tokens.css`, `public/kaarttokens.js` |
| 2 Drie richtingen achter `?ontwerp=a\|b\|c` | bezig: plan staat hieronder | `public/ontwerp/`, [ontwerp/richtingen.md](ontwerp/richtingen.md) |
| STOP | Oscar kiest een richting (mag combineren) | |
| 3 Uitrollen | open | |
| 4 Beter testen | open | |
| Release v1.2.0 | open | |

## Hulpmiddelen

- `tools/ontwerp/schermen.mjs <map> [query] [alleen=a,b]`: alle schermen en toestanden, telefoon
  390 × 844 en desktop 1280 × 800, licht en donker (`TOESTEL=`, `THEMA=` om te beperken). Vraagt
  `python3 tools/serve.py` en netwerk naar `tiles.openfreemap.org` (op 2026-11-20 toegevoegd aan de
  omgeving `nopaves`).
- `tools/ontwerp/kleurcheck.mjs [richting]`: tekstcontrast (≥ 4,5), routelijnen tegen de kaart (≥ 3),
  en het kleinste verschil (CIEDE2000) tussen de vijf klassen bij deuteranopie, protanopie en
  tritanopie. Paletten in `tools/ontwerp/paletten.mjs`.
- Pixelvergelijking voor en na: zie stap 1 hieronder.

## Skills: wanneer en wat ze opleverden

| Wanneer | Skill | Opbrengst |
|---|---|---|
| Stap 0 | `ui-review` | 15 punten, waarvan 6 "moet beter"; belangrijkste: de route haalt geen 3:1 tegen de kaart (gemeten), de kaart is te druk, alternatief lijkt op de gekozen route. Zie huidig.md |
| Stap 0 | `ui-compare` | UXKIN niet bereikbaar (proxy), dus vergelijking met bekende conventies van Komoot, Strava, AllTrails, Google en Apple Maps: gedempte kaart, route met rand, alternatieven neutraal met label |
| Stap 2 | `frontend-design` | Plan van drie richtingen; getoetst aan de valkuilen (crème + serif + terracotta, zuur groen op zwart, overal hoofdletters en mono-labels). Zie hieronder |

## Stap 1: tokens (klaar in code)

- `public/tokens.css`: letters, vorm (hoeken, randen, schaduwen), afstanden, beweging en alle kleuren,
  licht en donker. `styles.css` bevat geen losse kleur of letter meer (gecontroleerd met grep op hex,
  `rgb(` en lettertypenamen).
- `public/kaarttokens.js`: `KAART` (alle kleuren en keuzes van de MapLibre-stijl) en `ROUTE`
  (rand, lijn, korrel per klasse, alternatieven, twijfel, tekening, slepen, omwegen, afspeelstip,
  luchtfoto). `korrelkaart.js` en `app.js` lezen alleen hieruit.
- Opgeruimd: dode CSS van de oude intro-tekening, overschreven regels met losse kleuren.
- **Pixelgelijk**: 22 schermen (telefoon licht, desktop donker) voor en na vergeleken; geen pixel
  wijkt meer dan 40/255 af (alleen ruis in de kaarttegels).
- Kleine bewuste afwijking: het kaartmenu (lang drukken) was rond met schaduw, buiten Korrel om; nu
  volgt het de tokens (vierkant, geen schaduw).
- Unit 51/51, lint schoon. Playwright: zie PR.

## Stap 2: plan van de drie richtingen

Gemeenschappelijke routetaal (uit de review): **hoe zachter de grond, hoe dikker de lijn**. Onverhard
dik en effen, half verhard dik met korrel, open verharding middel en gestreept, asfalt dun en effen,
onbekend dun en gestippeld. Elke lijn heeft een rand die tegen elk kaartvlak ≥ 3:1 haalt.
Alternatieven: één neutrale kleur, dunner, met een letter. Zo hangt de klasse niet aan kleur alleen.

| | A Stil | B Startnummer | C Veldboek |
|---|---|---|---|
| Idee | kaart eerst, ingetogen; de interface is grijs, alleen de grond heeft kleur | sportief en uitgesproken; een startnummer: wit vlak, hoge cijfers, kobalt en geel | natuurlijk en verfijnd; volwassen opvolger van Korrel, een veldgids |
| Letters | Atkinson Hyperlegible Next (één familie, leesbaar in de zon), 34 kB | Archivo met breedte-as: smal en zwaar voor cijfers en koppen, normaal voor tekst, 51 kB | Literata (boekletter) voor koppen en cijfers, Karla voor tekst, 76 kB |
| Vorm | zachte hoeken (10/16 px), geen randen op leesvlakken, lichte schaduw alleen op wat zweeft | 6 px hoeken, pillen, volle vlakken in plaats van randen | 4 px hoeken, fijne lijn van 1,5 px, geen schaduw, korrel in legenda en strook |
| Kaart | bijna kleurloos, wegen wit met grijze rand, paden zacht gestippeld | koel en scherp, wegen wit, meer contrast | aards: stro, mos, heide, zand; paden in veenbruin; korrel heel licht |
| Route | donkere rand (licht) / lichte rand (donker), helder palet | dikste lijnen, marineblauwe rand | aards palet, veenrand, korrel op de lijn |

Hervatten: de code voor stap 2 komt in `public/ontwerp/a.css|b.css|c.css` (component- en tokenwaarden
per richting, alleen geladen bij `?ontwerp=`), `public/kaarttokens.js` (KAART/ROUTE per richting) en
`tools/ontwerp/paletten.mjs` (voor de controle).
