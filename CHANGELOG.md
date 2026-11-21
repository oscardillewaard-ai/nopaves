# Wijzigingen

Alle noemenswaardige wijzigingen aan Nopav.es, in gewone taal. Versies volgen
[semver](https://semver.org/lang/nl/): groot.klein.reparatie.

## v1.3.0 (2026-11-21): Een nieuwe look, Veldboek

- **Nopav.es ziet er anders uit.** Een rustige, aardse stijl: mos, veen, stro en heide op salie-grijs papier,
  een boekletter voor koppen en cijfers, fijne lijnen. In het donker het diepe groen van het bos.
- **De kaart is kalmer**, zodat je route beter opvalt. Geen golfjes meer op het water, nog maar een vleugje korrel op bos en heide; onverharde paden
  staan als veenbruine stippellijntjes op de kaart.
- **De route vertelt zelf de ondergrond.** Hoe zachter de grond, hoe dikker de lijn: onverhard dik, asfalt
  dun, klinkers gestreept, onbekend gestippeld. Elke route heeft een rand, zodat hij op elke achtergrond te
  zien is. Ook als je kleuren slecht onderscheidt, zie je het verschil.
- **De andere routes zijn grijs**, met een letter. Zo zie je meteen welke route je gekozen hebt.
- **Grotere knoppen**: alles wat je aantikt is minstens 44 pixels, handig met koude vingers.
- **Een nieuw pictogram**: een zandpad naar de horizon.
- Alles werkt verder precies zoals het werkte. In de lagenkeuze heet de eigen kaart nu "Kaart".

## v1.2.0 (2026-11-20): De Nopave-router

- **Van A naar B rond Delft rekent Nopav.es nu zelf.** Binnen de regio Delft plant de Nopave-router je route
  van A naar B, in plaats van BRouter. Dat gaat 3 tot 9 keer sneller (meestal binnen 1 à 3 seconden), en op
  17 proefroutes scoorde hij gelijk of hoger op 16. Buiten de regio blijft BRouter rekenen. Wil je toch
  BRouter: voeg `?router=brouter` toe aan het adres.
- **De Nopave-router.** De eigen router van Nopav.es heet voortaan de Nopave-router. Gebruik
  `?router=nopave`; de oude naam `?router=eigen` blijft werken.
- **Groenere routes rond Delft.** De vooraf bewerkte routekaart weegt paden nu op de officiële ondergrond
  (BGT) in plaats van alleen op OpenStreetMap. Rondjes en routes naar een station worden daardoor groener.
- **A naar B met de Nopave-router** kiest uit vijf echt verschillende routes de route met de hoogste
  Nopav.es-score, hooguit 15% langer dan de kortste.

## v1.1.0 (2026-11-20): Snel plannen rond Delft

- **Rond Delft plan je veel sneller.** Binnen de regio Delft (van Den Haag tot Rotterdam en van Hoek van
  Holland tot Zoetermeer) gebruikt de app nu een vooraf bewerkte routekaart, gebouwd uit OpenStreetMap
  met de officiële ondergrond (BGT) en hoogtes (AHN) er al in. Een rondje of een route naar een station
  staat er daardoor in een paar seconden, en de app hoeft veel minder op te halen.
- De routes zijn daar vaak ook groener (op 7 van 10 proefplekken een hogere score). "Groene omwegen" biedt
  daardoor minder vaak iets aan.
- Buiten die regio werkt alles zoals voorheen. Wil je binnen de regio toch de oude werking: voeg
  `?graaf=tegels` toe aan het adres.
- Achter de schermen: de routekaart wordt elke week opnieuw gebouwd en pas na geslaagde tests aangeboden.

## v1.0.0 (2026-11-20): Plankaart, sneller en een eigen huis

- **Eigen huis**: Nopav.es staat nu op https://oscardillewaard-ai.github.io/nopaves/. De oude
  link (`/Tezt/onverhard/`) stuurt je door, en gedeelde routelinks blijven werken. Je bewaarde
  routes en instellingen gaan mee.
- **De plankaart**: kies soort, start en afstand op één kaart en tik op Plan. De oude indeling blijft
  bereikbaar met `?ui=oud`.
- **Sneller**: de eerste route staat er veel eerder (een rondje van 10 km koud ongeveer 4 s in plaats
  van 11 s). Kaarttegels, BGT en hoogte worden bewaard voor de volgende keer, en het rekenen gebeurt
  op de achtergrond, met een Stop-knop die echt stopt.
- **Afstand in minuten**, op basis van je eigen tempo.
- **Rondjes in een natuurgebied**: druk lang in een Natura 2000-gebied voor "Rondjes in <naam>".
- **Duidelijker score**: overal "26% onverhard · 28% half", met een uitleg waarom een route die score
  krijgt.
- **Mijn gebruik**: een teller die alleen in je eigen browser bijhoudt wat je doet. Hij wordt nooit
  verstuurd.
- **Proeven achter een schakelaar** (niet standaard): `?router=eigen` (eigen router voor A naar B),
  `?stations=ringen` (stations zoeken in ringen) en `?graaf=vooraf` (vooraf bewerkte routegraaf, alleen
  regio Delft).
