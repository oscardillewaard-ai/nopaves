# Stap 2: drie richtingen

> **Afgesloten (2026-11-21).** Op Oscars verzoek is daarna gekozen uit 30 schetsen
> ([schetsen/](schetsen/)): **Veldboek** (richting C hieronder) met **Bosgroen** als donker thema. De
> richtingen zelf, `?ontwerp=` en de beelden in `a/`, `b/`, `c/` en `vergelijk/` zijn weggehaald; ze staan nog
> op branch `ccr-770e2665-7wxjk9`, commit `92a807cd8449751665a03ed6237490d42a63f049`. De links en beelden
> hieronder werken daarom niet meer; de tekst blijft als verslag van de afweging.

Live te proberen op je telefoon (standaard blijft Korrel):

- **A Stil**: https://oscardillewaard-ai.github.io/nopaves/?ontwerp=a
- **B Startnummer**: https://oscardillewaard-ai.github.io/nopaves/?ontwerp=b
- **C Veldboek**: https://oscardillewaard-ai.github.io/nopaves/?ontwerp=c

Licht of donker kies je zoals altijd bij Voorkeuren → Thema. Een rondje proberen gaat het snelst met
een link met start erin, bijvoorbeeld `…/nopaves/?ontwerp=a#p=52.0116,4.3571&rondje=10&plan=1`.

## In één oogopslag

Elke plaat: links de huidige stand (Korrel), dan A, B en C. Telefoon 390 × 844.

**Lege kaart**
![](vergelijk/leeg_licht.png)

**Plankaart**
![](vergelijk/plankaart_licht.png)

**Resultaat met de route op de kaart**
![](vergelijk/resultaat-half_licht.png)

**Details**
![](vergelijk/details_licht.png)

**Donker thema**
![](vergelijk/resultaat-half_donker.png)
![](vergelijk/plankaart_donker.png)

Meer: [Meer-soorten](vergelijk/meer_licht.png), [popup op de route](vergelijk/popup_licht.png),
[voorkeuren](vergelijk/voorkeuren_licht.png). Losse beelden per richting in `a/`, `b/` en `c/`,
desktop in `<richting>/resultaat-piek_desktop_licht.png`.

## Wat ze delen: de routetaal

Uit de review van stap 0: de route moet tegen elke kaart te zien zijn, en de vijf klassen mogen niet
alleen aan kleur hangen. Alle drie de richtingen gebruiken daarom dezelfde regel:

**Hoe zachter de grond, hoe dikker de lijn.**

| Klasse | Lijn | Waarom |
|---|---|---|
| onverhard | dikst, effen | waar je voor komt; het meest zichtbaar |
| half verhard | iets dunner, met stippen | bijna net zo goed |
| open verharding (klinkers) | middel, gestreept | herkenbaar aan de onderbreking |
| gesloten verharding (asfalt) | dun, effen | wat je liever niet loopt, trekt minder aandacht |
| onbekend | dun, gestippeld | onzeker, dus ijl |

Elke lijn heeft een **rand** (donker op een lichte kaart, licht op een donkere) die tegen elk kaartvlak
minstens 8:1 haalt; zo is de route overal te zien, ook waar een klassekleur zelf weinig verschilt van
de kaart. **Alternatieven** zijn één neutrale grijstint met een letter, dunner en zonder klassekleuren:
je ziet meteen welke route de gekozen is. De **ondergrondstrook** volgt dezelfde regel in A en B: hoe
zachter, hoe hoger het blokje. C houdt de korrel van Korrel in de strook en op de lijn.

## A Stil: de kaart eerst

**Idee.** De interface is wit en grijs en stapt opzij; alleen de grond heeft kleur, in de route. De kaart
is bijna kleurloos (wegen wit met een fijne grijze rand, water en bos heel zacht, paden licht gestippeld),
zodat de route het enige verzadigde op het scherm is. Dichtst bij wat Google Maps en Komoot doen, maar met
de ondergrond in de lijn.

- **Palet (licht)**: vlak `#FFFFFF`, vlak-2 `#EEF0ED`, inkt `#1B1E1C`, inkt-2 `#4A504C`, inkt-3 `#626964`;
  hoofdknop inkt met wit. Geen merkaccent: de klassekleuren zijn het enige accent.
- **Palet (donker)**: pagina `#161817`, vlak `#1F2220`, inkt `#ECEEEC`; hoofdknop licht op donker.
- **Letters**: Atkinson Hyperlegible Next (34 kB), één familie, gemaakt voor leesbaarheid ook in fel licht.
  Let op: deze letter zet de nul met een streep (1Ø km). Dat is een bewuste keuze van het lettertype (0 en O
  nooit verwarren); vind je het niks, dan is dat een kwestie van een andere cijferletter.
- **Vormen**: zachte hoeken (10 px knoppen, 14 px vlakken, 18 px sheet), geen randen op leesvlakken, een
  fijne rand alleen op velden en steppers. Segmentknop als grijze baan met een witte schuif. Schaduw alleen
  op wat boven de kaart zweeft (sheet, kaartknoppen, popups).
- **Pictogrammen**: dezelfde lijnset, 1,7 px.
- **Score**: groot zwart cijfer zonder vlak; in de piekbalk een zwart blok.

## B Startnummer: sportief en uitgesproken

**Idee.** Een startnummer: wit vlak, hoge smalle cijfers, kobaltblauw voor wat je doet en startnummergeel
voor de score. Volle vlakken in plaats van kaders, pillen voor keuzes. De kaart is koel en scherp, met meer
contrast (helder groen, blauw water, een stevige wegrand), en de routelijnen zijn het dikst van de drie,
met een marineblauwe rand.

- **Palet (licht)**: pagina `#EEF1F6`, vlak `#FFFFFF`, inkt (marine) `#12204A`, kobalt `#2347E8` (hoofdknop,
  gekozen), geel `#FFD23F` (score).
- **Palet (donker)**: pagina `#0C1330`, vlak `#141C3F`, inkt `#F2F4FA`, kobalt licht `#8FA4FF`, geel blijft.
- **Letters**: Archivo (51 kB samen): een vaste smalle snede voor koppen en cijfers, de gewone voor tekst.
  Het woordteken in hoofdletters, als op een startnummer; verder geen hoofdletters.
- **Vormen**: 8 px knoppen, 12 px vlakken, pillen voor segment en snelkeuzes, geen kaders.
- **Pictogrammen**: dezelfde lijnset, iets zwaarder (2,1 px).
- **Score**: een geel vlak met een groot marineblauw cijfer, ook in de piekbalk en de badges.

## C Veldboek: natuurlijk en verfijnd

**Idee.** De volwassen opvolger van Korrel. Een veldgids: aardse tinten (veen, mos, stro, heide) op
salie-grijs papier, een boekletter voor koppen en cijfers. Fijne lijnen van 1,5 px, kleine hoeken, geen
schaduw. De korrel blijft, maar ingetogen: op de routelijn, in de strook en een vleug op de natuur in de
kaart. Paden staan in veenbruin op de kaart, zodat je ziet waar het onverhard is.

- **Palet (licht)**: pagina `#E9EBE1`, vlak `#F7F7F1`, inkt (veen) `#26291F`, mos `#3E5A24` (hoofdknop,
  score), heide `#8E4A73` (tekenen, focus).
- **Palet (donker)**: pagina `#1A1C16`, vlak `#23261E`, inkt `#E9EADF`, mos licht `#A9C66C`.
- **Letters**: Literata (boekletter, 52 kB) voor koppen en cijfers, Karla (bleef) voor tekst; 76 kB samen,
  ongeveer wat Korrel nu laadt.
- **Vormen**: 4 px hoeken, lijnen van 1,5 px in veen, korrel in de strook en de legenda.
- **Pictogrammen**: dezelfde lijnset, fijner (1,6 px).
- **Score**: mosgroen vlak met een groot cijfer in de boekletter.

## Controles

### Kleur (`tools/ontwerp/kleurcheck.mjs`)

| | Tekst ≥ 4,5 | Rand van de route tegen de kaart | Klassen bij deuteranopie / protanopie / tritanopie (kleinste ΔE) |
|---|---|---|---|
| Korrel nu, licht | inkt-3 op pagina 4,10 ✗ | 1,16 ✗ | 9,1 / 12,2 / 8,4 |
| Korrel nu, donker | ✓ | 1,26 ✗ | 3,5 ✗ / 7,9 / 10,2 |
| A licht | ✓ (laagste 5,11) | 11,6 ✓ | 13,4 / 13,7 / 14,4 ✓ |
| A donker | ✓ (laagste 5,89) | 12,7 ✓ | 14,1 / 13,7 / 19,3 ✓ |
| B licht | ✓ (laagste 5,49) | 8,5 ✓ | 16,4 / 12,6 / 14,7 ✓ |
| B donker | ✓ (laagste 7,27) | 14,3 ✓ | 16,2 / 12,3 / 19,3 ✓ |
| C licht | ✓ (laagste 5,25) | 8,8 ✓ | 17,9 / 14,0 / 16,5 ✓ |
| C donker | ✓ (laagste 6,54) | 11,2 ✓ | 13,3 / 17,1 / 22,0 ✓ |

ΔE (CIEDE2000) ≥ 12 is als "goed uit elkaar te houden" genomen; daarbovenop verschillen de klassen in
dikte en streep, dus ook bij volledig kleurverlies blijven ze herkenbaar. De klassekleur zelf haalt niet
overal 3:1 tegen de kaart (half verhard 1,1 tot 1,8 op een lichte kaart); dat vangt de rand op, zoals
WCAG 1.4.11 toestaat.

### ui-review (skill `ui-review`, op de beelden hierboven)

**Wat alle drie oplossen** uit de review van stap 0: de route is overal te zien (rand), het alternatief
lijkt niet meer op de gekozen route, de klassen blijven uit elkaar bij kleurenblindheid, de kaart is
rustiger (geen golfjes en arcering meer, behalve een vleug in C), één lettersysteem zonder mono en zonder
hoofdletterlabels, `inkt-3` haalt overal 4,5:1, en alle losse kleuren komen uit tokens.

**Bewust niet opgelost** (gedrag, geen stijl; de functionaliteit blijft gelijk): de laag winkels staat
standaard aan en stapelt pictogrammen rond de start, en de foutmelding bij een start op zee komt laat.
Beide staan als vervolgpunt in [huidig.md](huidig.md).

| | Sterk | Zwakker | Het meest voor wie |
|---|---|---|---|
| **A Stil** | De route springt het meest uit de kaart; het rustigst; dichtst bij wat mensen kennen; lichtste letter (34 kB) | De kaart is bijna kleurloos, bos en heide zijn zwak voor oriëntatie in de natuur; de nul met streep (1Ø); het karakter zit vooral in de route en het woordteken, de rest is neutraal | wie de kaart en de route wil zien en de interface wil vergeten |
| **B Startnummer** | Het meest herkenbaar (gele score); dikste lijnen, goed buiten te lezen; smalle cijfers geven veel data op weinig ruimte | Twee accenten (kobalt en geel) naast vijf klassekleuren is drukker; koel blauw voelt minder als natuur; risico op "sportapp zoals elke sportapp" | wie het sportief en energiek wil, met de score voorop |
| **C Veldboek** | Houdt de identiteit van Korrel (korrel, aardse kleuren) maar volwassener; boekletter-cijfers zijn eigen; paden goed zichtbaar op de kaart | Nog veel kaders (punt 7 van stap 0 maar half opgelost); de korrel op kaart en lijn maakt het drukker dan A; zwaarste letters (76 kB, gelijk aan nu) | wie het eigen karakter van Nopav.es wil houden |

Gevonden en opgelost tijdens het maken:
- In B werd de kaart na het verschuiven van de sheet leeg (in de testbrowser). Oorzaak gevonden door de
  regels van B te halveren: een overbodige achtergrondregel op het paneel. Weggehaald, opnieuw bekeken.
- Aanraakdoelen te klein (zie hieronder). Opgelost in alle drie.

### accessibility-review (skill `accessibility-review`, WCAG 2.1 AA)

Gemeten met axe-core 4.10 (`tools/ontwerp/a11y.mjs`) op de plankaart en het resultaat (sheet vol),
telefoon, licht en donker; de kaarttegels zelf vallen erbuiten. Daarnaast de kleurmetingen hierboven en
een meting van alle knoppen en velden in het paneel.

| | axe: overtredingen | Aanraakdoelen < 44 px (voor → na) | Focus zichtbaar |
|---|---|---|---|
| Korrel nu | 0 | 14 op de plankaart, 23 bij het resultaat | standaard van de browser |
| A | 0 | 14 / 23 → 1 (greep van de sheet, 28 px hoog over de volle breedte) | 2 px inkt, 2 px afstand |
| B | 0 | 14 / 23 → 1 (idem) | 3 px kobalt |
| C | 0 | 14 / 26 → 1 (idem) | 2 px heide |

- **1.4.3 contrast**: alle tekst ≥ 4,5:1 in alle zes paletten (laagste 5,11). Korrel haalt dat nu niet op
  één plek (4,10).
- **1.4.11 niet-tekstueel contrast**: routerand ≥ 8,5:1 tegen de kaart; velden en steppers hebben een rand
  van ≥ 3:1 (A `#8F9691`, B en C inkt). In A en B hebben secundaire knoppen een vlak zonder rand; hun
  tekst en pictogram dragen de herkenning.
- **1.4.1 kleur niet als enige drager**: de vijf klassen verschillen ook in dikte en streep, de strook in
  hoogte (A, B) of korrel (C).
- **2.5.5 doelgrootte** (in WCAG 2.1 eigenlijk AAA, maar de huisregel is 44 px): opgelost; de greep van de
  sheet is 28 px hoog maar loopt over de hele breedte en haalt 2.5.8 (24 px).
- **Niet getest**: schermlezer (VoiceOver, TalkBack), 200 % zoom, toetsenbord van begin tot eind. De
  opbouw van de pagina (knoppen, labels, volgorde) is niet veranderd, alleen de stijl.

### ux-copy

Geen nieuwe of gewijzigde teksten in deze stap; alleen de stijl verandert. ux-copy volgt in stap 3.
