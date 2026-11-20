# Wijzigingen

Alle noemenswaardige wijzigingen aan Nopav.es, in gewone taal. Versies volgen
[semver](https://semver.org/lang/nl/): groot.klein.reparatie.

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
