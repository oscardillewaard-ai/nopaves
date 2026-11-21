// Ontwerptokens voor de kaart (MapLibre-stijl op de OpenFreeMap-vectortegels) en de routelijnen (Leaflet),
// huisstijl Veldboek. kaartstijl.js en app.js lezen alleen hieruit. De vijf klassekleuren staan in tokens.css
// (--onverhard, --half, --open, --gesloten, --onbekend), omdat legenda en strook ze ook gebruiken.

const NOTO = { font: 'Noto Sans Regular', fontVet: 'Noto Sans Bold', fontSchuin: 'Noto Sans Italic' }

/**
 * Kaart, per thema. Licht: aards (stro, mos, heide, zand), paden in veenbruin, een vleug korrel op de
 * natuur. Donker (Bosgroen): dezelfde kaart bij nacht, groen getint.
 * - vlakken: bg (grond), wood, grass, scrub, heath, farm, sand, wetland, water, res (wonen), comm (handel),
 *   ind (industrie), campus, pitch (sportveld), park (natuurgebied, vlak en streeplijn), building, buildingLijn
 * - lijnen: snel, hoofd, klein (straat), fiets (verhard pad), onverhard (onverharde weg), pad (onverhard pad),
 *   wegRand (rand om grote wegen) en wegRandDoorzicht, rail en railStreep, grens, waterLijn
 * - tekst: ink, ink2, halo, waterLabel; letters: font, fontVet, fontSchuin (Noto Sans van OpenFreeMap)
 * - patronen: korrel op bos, gras, heide, zand, wetland en water; korrelInkt [r, g, b], korrelSterkte 0..1
 */
export const KAART = {
  licht: {
    bg: '#ECEADF', wood: '#BFD0A8', grass: '#D9E1C4', scrub: '#CDD8B6', heath: '#DFCFD7', farm: '#EFEBDC', sand: '#EADCB8',
    wetland: '#CFDACB', water: '#B5CCCF', res: '#E4E1D6', comm: '#E1DDD0', ind: '#DCD8CB', campus: '#E7E4D9', pitch: '#D3DDBC',
    rail: '#8F8B7C', railStreep: '#ECEADF', building: '#DAD6C8', buildingLijn: '#C9C4B4', ink: '#3E4234', ink2: '#5F6452', halo: '#F5F4EC',
    wegRand: '#CFCABB', wegRandDoorzicht: 1,
    snel: '#FBFAF5', hoofd: '#FBFAF5', klein: '#FBFAF5', fiets: '#D6D1C2', onverhard: '#7A6446', pad: '#6F5A3E',
    waterLabel: '#4A6E73', waterLijn: '#A3BEC2', park: '#4E6B2E', natuurDoorzicht: 0.05, grens: '#8E4A73',
    patronen: true, korrelInkt: [62, 66, 52], korrelSterkte: 0.25, ...NOTO,
  },
  donker: {
    bg: '#17231C', wood: '#1E3626', grass: '#213A28', scrub: '#1F3426', heath: '#2E2630', farm: '#19261E', sand: '#2F2B20',
    wetland: '#1D3330', water: '#0D2A36', res: '#1D2A22', comm: '#1F2C24', ind: '#212E26', campus: '#1B281F', pitch: '#213A26',
    rail: '#4C5A50', railStreep: '#17231C', building: '#24332A', buildingLijn: '#2D3D33', ink: '#C9D6CB', ink2: '#9DB0A1', halo: '#17231C',
    wegRand: '#0E1712', wegRandDoorzicht: 0.9,
    snel: '#45544A', hoofd: '#3C4A41', klein: '#324038', fiets: '#2C3932', onverhard: '#A38E66', pad: '#B09A70',
    waterLabel: '#7FA3A8', waterLijn: '#1A3540', park: '#6E8F4A', natuurDoorzicht: 0.06, grens: '#B07A9C',
    patronen: true, korrelInkt: [233, 240, 228], korrelSterkte: 0.15, ...NOTO,
  },
}

/**
 * Routelijnen. Hoe zachter de grond, hoe dikker de lijn: elke klasse een eigen dikte en streep, met per stuk
 * een rand (rand.breedte aan elke kant) die tegen elk kaartvlak >= 3:1 haalt. Diktes in px.
 * - korrel: per klasse een dunne laag over de lijn ('inkt' of 'licht' = korrelInkt/korrelLicht), null = effen
 * - alternatief: de andere routes, in één neutrale kleur
 * - twijfel, tekening, slepen, omweg, afspeelstip, luchtfoto: de rest van wat op de kaart getekend wordt
 */
const klassen = { onverhard: { dikte: 6.5 }, half: { dikte: 5.5 }, open: { dikte: 4, streep: '7 5', kap: 'butt' }, gesloten: { dikte: 2.8 }, onbekend: { dikte: 2.8, streep: '0.1 6', kap: 'round' } }
export const ROUTE = {
  licht: {
    rand: { kleur: '#26291F', breedte: 1.5, doorzicht: 1 }, lijn: { dikte: 5, kap: 'butt' }, klassen,
    korrelInkt: '#26291F', korrelLicht: '#F7F7F1',
    korrel: {
      onverhard: { kleur: 'licht', dikte: 1.6, doorzicht: 0.75, streep: '0.1 7', kap: 'round' },
      half: { kleur: 'inkt', dikte: 1.6, doorzicht: 0.6, streep: '2 5', kap: 'butt' }, open: null, gesloten: null, onbekend: null,
    },
    alternatief: { rand: '#F7F7F1', randDikte: 7, randDoorzicht: 1, kleur: '#8C8778', dikte: 3.5, streep: null, doorzicht: 1, kap: 'round' },
    twijfel: { kleur: '#26291F', dikte: 1.6, streep: '3 6' },
    tekening: { kleur: '#8E4A73', dikte: 3.5, streep: '8 6', schaduw: '#F7F7F1', schaduwDikte: 7, schaduwDoorzicht: 0.9, vulling: 0.07 },
    slepen: { lijn: '#26291F', stip: '#8E4A73' },
    omweg: { onder: '#F7F7F1', onderDikte: 10, onderDoorzicht: 1, kleur: '#2F7D4A', dikte: 5, doorzicht: 1, streep: '1 8' },
    afspeelstip: { rand: '#FFFFFF' },
    luchtfoto: { route: '#FFFFFF', stuk: '#FF00C8' },
  },
  donker: {
    rand: { kleur: '#EEF3EA', breedte: 1.5, doorzicht: 1 }, lijn: { dikte: 5, kap: 'butt' }, klassen,
    korrelInkt: '#0F2418', korrelLicht: '#0F2418',
    korrel: {
      onverhard: { kleur: 'inkt', dikte: 1.6, doorzicht: 0.6, streep: '0.1 7', kap: 'round' },
      half: { kleur: 'inkt', dikte: 1.6, doorzicht: 0.6, streep: '2 5', kap: 'butt' }, open: null, gesloten: null, onbekend: null,
    },
    alternatief: { rand: '#17231C', randDikte: 7, randDoorzicht: 1, kleur: '#7E8C80', dikte: 3.5, streep: null, doorzicht: 1, kap: 'round' },
    twijfel: { kleur: '#EEF3EA', dikte: 1.6, streep: '3 6' },
    tekening: { kleur: '#E3A8CB', dikte: 3.5, streep: '8 6', schaduw: '#000000', schaduwDikte: 7, schaduwDoorzicht: 0.6, vulling: 0.07 },
    slepen: { lijn: '#EEF3EA', stip: '#E3A8CB' },
    omweg: { onder: '#17231C', onderDikte: 10, onderDoorzicht: 1, kleur: '#4FBF9A', dikte: 5, doorzicht: 1, streep: '1 8' },
    afspeelstip: { rand: '#17231C' },
    luchtfoto: { route: '#FFFFFF', stuk: '#FF00C8' },
  },
}

export const kaartTokens = (donker) => KAART[donker ? 'donker' : 'licht']
export const routeTokens = (donker) => ROUTE[donker ? 'donker' : 'licht']
