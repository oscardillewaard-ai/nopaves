# Nopave-router voor A naar B: diagnose, verbetering en eerlijke test (2026-11-20)

Ruwe metingen in deze map: `brouter-ab.json`, `nopave-ab.json` (10 bekende paren), `brouter-nieuw.json`,
`nopave-nieuw.json` (7 nieuwe paren uit `tools/graaf/ab_nieuw.mjs`, vastgelegd vóór het afstellen en daarbij
niet gebruikt). Gemeten met `tools/onverhard/benchmark_snelheid.mjs` (5× koud en 5× warm, mediaan) via de
echte app in de cloudomgeving (desktop-Chromium headless, via de proxy), graaf `v20261120-r4`, code van
commit `9be34fc` (stap 2 en 3; de meting liep vóór de hernoeming, vandaar `router: eigen` in de JSON).

## 1. Diagnose

**Schipluiden (BRouter 22, Nopave 21).** De routes verschillen op ongeveer 0,85 km (rond 51,992 N, 4,331 O):
BRouter 650 m zacht (370 m gras, 280 m fijn grind), Nopave 630 m (voetpad "unpaved"). Het ene punt is
vooral afronding: 75 × 24,8% + 15 × 19,5% = 21,5 → 22 tegen 75 × 24,7% + 15 × 19,3% = 21,4 → 21. Het
langste verharde stuk (2,6 km) geeft beide 0 van de 10 punten.

**Kosten tegenover de score.** De kosten (`kern.js` `kostenfactor`) zijn een prijs per meter; de score
(`nopavesScore`) is 75% aandeel onverhard + half, 15% zachte paadjes, 10% langste verharde stuk, min heen en
terug en strand. Verschillen:
1. In de vooraf bewerkte graaf kwamen de kosten uit de OSM-klasse, de score telt het eindoordeel (BGT + OSM).
   Over de 10 Nopave-routes was 4,0% van de lengte OSM-zacht maar eind-verhard (vooral fietspaden met
   `surface=unpaved` die volgens de BGT asfalt zijn), 0,9% andersom.
2. Lengte telt in de kosten, niet in de score (die kijkt naar aandelen).
3. Het langste verharde stuk zit niet in de kosten (niet optelbaar per meter).
4. Half verhard telt in de score als onverhard, in de kosten iets duurder (1,1–1,4 tegen 1,0–1,3).
5. Heen en terug zit niet in de kosten (speelt bij A naar B vrijwel niet).

Gecontroleerd: code gelezen (`kern.js`, `blokgraaf.js`, `graaf.js`, `bronnen.js`) en in Node gedraaid.
Aanname, niet nagekeken: hoe BRouter intern kiest.

## 2. Kosten met het eindoordeel

`blokgraaf.js`: de kosten per wegstuk komen nu uit het eindoordeel dat al in de graaf staat. Daarmee
betaalt de router voor die "onverharde" fietspaden de prijs van asfalt (4 in plaats van 1,3–1,4).

## 3. Kandidaten en kiezen op de score

Tot 5 kandidaten (`AB_KANDIDATEN`), met een straf op stukken die eerdere kandidaten al gebruikten en
hooguit 70% overlap; op de 10 paren steeds 5 kandidaten, grootste overlap 2–44%. `kiesOpScore()` kiest de
hoogste Nopav.es-score binnen de lengtegrens ten opzichte van de kortste kandidaat (`AB_LENGTEGRENS`,
standaard 15%, instelbaar via `maakPlan({abLengteGrens})`); de goedkoopste kandidaat doet altijd mee.

Lengtegrens op de 10 bekende paren (Node, som van het scoreverschil met BRouter, steeds 10/10 ≥):
alleen stap 2 +41, 10% +42, **15% +44**, 25% +80 (maar tot +19% langer dan BRouter).

## 4. Eerlijke test

Bekende paren: score ≥ BRouter **10/10**, gemiddeld **+4,4**. Nieuwe paren: **6/7** ≥, gemiddeld **+8,6**
(polder-2 −1). Verboden stukken: 0. Rekentijd Nopave koud 0,5–2,8 s (BRouter 4,9–17,3 s). Tabellen: zie de
PR-beschrijving en `docs/nopave-router/*.json`.

Kanttekeningen: sommige routes worden langer dan die van BRouter (Leiden 29,3 tegen 26,4 km, +11%;
Delftse Hout → Ackerdijk 8,1 tegen 6,9 km, +16%; Zoetermeer 14,1 tegen 12,9 km, +9%). De lengtegrens is
relatief tot de kortste Nopave-kandidaat, niet tot BRouter. Buiten de regio van de vooraf bewerkte graaf
rekent de Nopave-router op de kaarttegels; daar gelden stap 2 en de cijfers hierboven niet (de proef gaf daar
3 van 10).
