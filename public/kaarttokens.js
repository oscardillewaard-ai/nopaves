// Ontwerptokens voor de kaart (MapLibre-stijl op de OpenFreeMap-vectortegels) en voor de routelijnen
// (Leaflet). Een richting is één set waarden per thema; korrelkaart.js en app.js lezen alleen hieruit.
// De vijf klassekleuren staan in tokens.css (--onverhard, --half, --open, --gesloten, --onbekend), omdat
// de legenda en de ondergrondstrook ze ook gebruiken; app.js leest ze daar.

/**
 * Kaart, per thema:
 * - vlakken: bg (grond), wood, grass, scrub, heath, farm, sand, wetland, water, res (wonen), comm (handel),
 *   ind (industrie), campus, pitch (sportveld), park (natuurgebied, vlak en streeplijn), building, buildingLijn
 * - lijnen: snel (snelweg), hoofd (hoofdweg), klein (straat), fiets (verhard pad), onverhard (onverharde weg),
 *   pad (onverhard pad), wegRand (rand om grote wegen) en wegRandDoorzicht, rail, grens, waterLijn
 * - tekst: ink, ink2, halo, waterLabel; letters: font, fontVet, fontSchuin (Noto Sans van OpenFreeMap)
 * - patronen: true = korrel op bos, gras, heide, zand, wetland en water; korrelInkt [r, g, b]
 * - natuurDoorzicht: doorzicht van het natuurvlak
 */
export const KAART = {
  korrel: {
    licht: {
      bg: '#DDE6B0', wood: '#8FB05A', grass: '#C9DA8E', scrub: '#B8C77C', heath: '#D3A7C2', farm: '#E4E9B5', sand: '#EAD59C',
      wetland: '#B3CE9C', water: '#8FB8C2', res: '#E4DFAB', comm: '#DDD49C', ind: '#D3CB98', campus: '#E3E5B0', pitch: '#B9D47E',
      rail: '#4A5235', railStreep: '#DDE6B0', building: '#D8D09A', buildingLijn: '#BDB67E', ink: '#2E3320', ink2: '#4A5235', halo: '#F1F3D4',
      wegRand: '#F1F3D4', wegRandDoorzicht: 0.9,
      snel: '#4F535A', hoofd: '#5E636A', klein: '#80848B', fiets: '#8C9096', onverhard: '#6B4A2E', pad: '#2E3320',
      waterLabel: '#2F6070', waterLijn: '#8FB8C2', park: '#4F6B2A', natuurDoorzicht: 0.08, grens: '#9B4A7A',
      patronen: true, korrelInkt: [46, 51, 32], korrelSterkte: 1,
      font: 'Noto Sans Regular', fontVet: 'Noto Sans Bold', fontSchuin: 'Noto Sans Italic',
    },
    donker: {
      bg: '#222B1A', wood: '#3A5428', grass: '#43572A', scrub: '#394A26', heath: '#5B3F52', farm: '#2A3320', sand: '#5A4F2E',
      wetland: '#34503A', water: '#2E4F5A', res: '#2A3220', comm: '#30382A', ind: '#363B2A', campus: '#2C3523', pitch: '#3C5726',
      rail: '#CCD4A2', railStreep: '#222B1A', building: '#363C2A', buildingLijn: '#4C5538', ink: '#EEF1CC', ink2: '#CCD4A2', halo: '#222B1A',
      wegRand: '#222B1A', wegRandDoorzicht: 0.18,
      snel: '#B8BCC2', hoofd: '#9FA3A9', klein: '#82868C', fiets: '#6F7378', onverhard: '#D9B77A', pad: '#EEF1CC',
      waterLabel: '#9FC9CF', waterLijn: '#2E4F5A', park: '#A9CF52', natuurDoorzicht: 0.1, grens: '#C77BA7',
      patronen: true, korrelInkt: [238, 241, 204], korrelSterkte: 0.55,
      font: 'Noto Sans Regular', fontVet: 'Noto Sans Bold', fontSchuin: 'Noto Sans Italic',
    },
  },
}

/**
 * Routelijnen, per thema. Diktes in px.
 * - rand: de rand om de gekozen route; lijn: de klassekleur erin
 * - korrel: per klasse een dunne laag over de lijn (stip, streep), zodat de klasse niet alleen aan kleur
 *   hangt; null = effen. Kleur 'inkt' of 'licht' verwijst naar korrelInkt/korrelLicht hieronder.
 * - alternatief: de andere routes op de kaart. kleur null = in de klassekleuren.
 * - twijfel, tekening, slepen, omweg, afspeelstip, luchtfoto: de rest van wat op de kaart getekend wordt.
 */
export const ROUTE = {
  korrel: {
    licht: {
      rand: { kleur: '#F6F7DD', dikte: 9, doorzicht: 0.9 },
      lijn: { dikte: 5, kap: 'butt' },
      korrelInkt: '#2B211B', korrelLicht: '#F2E4B8',
      korrel: {
        onverhard: { kleur: 'inkt', dikte: 2.4, doorzicht: 0.7, streep: '0.1 6', kap: 'round' },
        half: { kleur: 'inkt', dikte: 2.2, doorzicht: 0.65, streep: '5 5', kap: 'butt' },
        open: { kleur: 'licht', dikte: 1.8, doorzicht: 0.9, streep: '10 6', kap: 'butt' },
        gesloten: null,
        onbekend: { kleur: 'inkt', dikte: 2, doorzicht: 0.5, streep: '0.1 10', kap: 'round' },
      },
      alternatief: { rand: '#F6F7DD', randDikte: 7, randDoorzicht: 0.7, kleur: null, dikte: 3.5, streep: '6 6', doorzicht: 1 },
      twijfel: { kleur: '#2E3320', dikte: 1.5, streep: '3 6' },
      tekening: { kleur: '#9B4A7A', dikte: 4, streep: '8 6', schaduw: '#2B211B', schaduwDikte: 7, schaduwDoorzicht: 0.35, vulling: 0.08 },
      slepen: { lijn: '#2B211B', stip: '#9B4A7A' },
      omweg: { onder: '#F2E4B8', onderDikte: 10, onderDoorzicht: 0.9, kleur: '#5F7A2F', dikte: 6, doorzicht: 0.95, streep: '2 9' },
      afspeelstip: { rand: '#fff' },
      luchtfoto: { route: '#fff', stuk: '#ff00c8' },
    },
    donker: {
      rand: { kleur: '#10150B', dikte: 9, doorzicht: 0.9 },
      lijn: { dikte: 5, kap: 'butt' },
      korrelInkt: '#2B211B', korrelLicht: '#F2E4B8',
      korrel: {
        onverhard: { kleur: 'inkt', dikte: 2.4, doorzicht: 0.7, streep: '0.1 6', kap: 'round' },
        half: { kleur: 'inkt', dikte: 2.2, doorzicht: 0.65, streep: '5 5', kap: 'butt' },
        open: { kleur: 'licht', dikte: 1.8, doorzicht: 0.9, streep: '10 6', kap: 'butt' },
        gesloten: null,
        onbekend: { kleur: 'inkt', dikte: 2, doorzicht: 0.5, streep: '0.1 10', kap: 'round' },
      },
      alternatief: { rand: '#10150B', randDikte: 7, randDoorzicht: 0.7, kleur: null, dikte: 3.5, streep: '6 6', doorzicht: 1 },
      twijfel: { kleur: '#EEF1CC', dikte: 1.5, streep: '3 6' },
      tekening: { kleur: '#9B4A7A', dikte: 4, streep: '8 6', schaduw: '#2B211B', schaduwDikte: 7, schaduwDoorzicht: 0.35, vulling: 0.08 },
      slepen: { lijn: '#2B211B', stip: '#9B4A7A' },
      omweg: { onder: '#F2E4B8', onderDikte: 10, onderDoorzicht: 0.9, kleur: '#5F7A2F', dikte: 6, doorzicht: 0.95, streep: '2 9' },
      afspeelstip: { rand: '#fff' },
      luchtfoto: { route: '#fff', stuk: '#ff00c8' },
    },
  },
}

// ---- stap 2: drie richtingen (live achter ?ontwerp=a|b|c) ----
const NOTO = { font: 'Noto Sans Regular', fontVet: 'Noto Sans Bold', fontSchuin: 'Noto Sans Italic' }
// A Stil: bijna kleurloos, wegen wit met een grijze rand, paden zacht gestippeld; de route is de enige kleur.
KAART.a = {
  licht: {
    bg: '#F2F2EF', wood: '#CCDCBF', grass: '#E0E9D7', scrub: '#D8E2CC', heath: '#E8E1E6', farm: '#F0F0EB', sand: '#EFE9DA',
    wetland: '#DCE6E2', water: '#C9D9E2', res: '#ECEBE7', comm: '#EAE8E3', ind: '#E6E4DF', campus: '#EEEDE8', pitch: '#E1EAD9',
    rail: '#B4B4AE', railStreep: '#F2F2EF', building: '#E2E0DA', buildingLijn: '#D3D1CB', ink: '#4F5551', ink2: '#737975', halo: '#F7F7F5',
    wegRand: '#CBCBC5', wegRandDoorzicht: 1,
    snel: '#FFFFFF', hoofd: '#FFFFFF', klein: '#FFFFFF', fiets: '#DAD9D3', onverhard: '#9C9282', pad: '#8E8576',
    waterLabel: '#5A7A8C', waterLijn: '#B7CCD8', park: '#6F9A5C', natuurDoorzicht: 0.05, grens: '#B9A3B5',
    patronen: false, korrelInkt: [0, 0, 0], korrelSterkte: 0, ...NOTO,
  },
  donker: {
    bg: '#1B1D1C', wood: '#1F2A22', grass: '#212922', scrub: '#202721', heath: '#2A2429', farm: '#1D201E', sand: '#2A2822',
    wetland: '#1E2826', water: '#14222B', res: '#222423', comm: '#242625', ind: '#262827', campus: '#212322', pitch: '#212A22',
    rail: '#4A4E4C', railStreep: '#1B1D1C', building: '#2A2D2B', buildingLijn: '#333634', ink: '#AEB3AF', ink2: '#868C88', halo: '#1B1D1C',
    wegRand: '#121413', wegRandDoorzicht: 0.9,
    snel: '#4A4E4C', hoofd: '#404442', klein: '#363A38', fiets: '#2F3331', onverhard: '#7D7466', pad: '#8A8172',
    waterLabel: '#6F93A6', waterLijn: '#1D3340', park: '#6F9A5C', natuurDoorzicht: 0.05, grens: '#6E5A6B',
    patronen: false, korrelInkt: [0, 0, 0], korrelSterkte: 0, ...NOTO,
  },
}
// B Startnummer: koel en scherp, meer contrast; wegen wit, natuur helder.
KAART.b = {
  licht: {
    bg: '#E6EAEE', wood: '#AFD3B0', grass: '#C8E2C0', scrub: '#BCDABA', heath: '#DCCBE0', farm: '#EAEDEF', sand: '#F0E2BE',
    wetland: '#C2DDD8', water: '#9CC2EA', res: '#DDE1E7', comm: '#D9DDE5', ind: '#D3D8E1', campus: '#E2E6EB', pitch: '#C2E0BC',
    rail: '#7F899B', railStreep: '#E6EAEE', building: '#CBD1DA', buildingLijn: '#B6BECA', ink: '#1E2B4D', ink2: '#4A5574', halo: '#F4F6F9',
    wegRand: '#A3ADBC', wegRandDoorzicht: 1,
    snel: '#FFFFFF', hoofd: '#FFFFFF', klein: '#FFFFFF', fiets: '#CDD3DC', onverhard: '#8A7C62', pad: '#7A6E5A',
    waterLabel: '#2D5F92', waterLijn: '#8DB8E6', park: '#2E8A50', natuurDoorzicht: 0.08, grens: '#8A93A8',
    patronen: false, korrelInkt: [0, 0, 0], korrelSterkte: 0, ...NOTO,
  },
  donker: {
    bg: '#10172F', wood: '#15263A', grass: '#172A33', scrub: '#162633', heath: '#1F1D3A', farm: '#131B36', sand: '#1F2238',
    wetland: '#132836', water: '#0B2238', res: '#18213E', comm: '#1A2342', ind: '#1C2544', campus: '#161F3A', pitch: '#172B37',
    rail: '#3A4566', railStreep: '#10172F', building: '#1F2947', buildingLijn: '#283354', ink: '#C3CAE0', ink2: '#8F99B8', halo: '#10172F',
    wegRand: '#0A0F22', wegRandDoorzicht: 0.9,
    snel: '#3A4566', hoofd: '#323C5C', klein: '#2A3452', fiets: '#242D4A', onverhard: '#8C8270', pad: '#9A8F7A',
    waterLabel: '#7FA6D6', waterLijn: '#123153', park: '#3E8E5A', natuurDoorzicht: 0.08, grens: '#4A5577',
    patronen: false, korrelInkt: [0, 0, 0], korrelSterkte: 0, ...NOTO,
  },
}
// C Veldboek: aards (stro, mos, heide, zand), paden in veenbruin, een vleug korrel op de natuur.
KAART.c = {
  licht: {
    bg: '#ECEADF', wood: '#BFD0A8', grass: '#D9E1C4', scrub: '#CDD8B6', heath: '#DFCFD7', farm: '#EFEBDC', sand: '#EADCB8',
    wetland: '#CFDACB', water: '#B5CCCF', res: '#E4E1D6', comm: '#E1DDD0', ind: '#DCD8CB', campus: '#E7E4D9', pitch: '#D3DDBC',
    rail: '#8F8B7C', railStreep: '#ECEADF', building: '#DAD6C8', buildingLijn: '#C9C4B4', ink: '#3E4234', ink2: '#5F6452', halo: '#F5F4EC',
    wegRand: '#CFCABB', wegRandDoorzicht: 1,
    snel: '#FBFAF5', hoofd: '#FBFAF5', klein: '#FBFAF5', fiets: '#D6D1C2', onverhard: '#7A6446', pad: '#6F5A3E',
    waterLabel: '#4A6E73', waterLijn: '#A3BEC2', park: '#4E6B2E', natuurDoorzicht: 0.05, grens: '#8E4A73',
    patronen: true, korrelInkt: [62, 66, 52], korrelSterkte: 0.35, ...NOTO,
  },
  donker: {
    bg: '#1C1E18', wood: '#24321F', grass: '#283023', scrub: '#262E21', heath: '#2E2329', farm: '#20231B', sand: '#302B1F',
    wetland: '#212C26', water: '#1A2A2C', res: '#24271F', comm: '#262921', ind: '#282B23', campus: '#22251D', pitch: '#283222',
    rail: '#4E5244', railStreep: '#1C1E18', building: '#2C2F26', buildingLijn: '#363A2F', ink: '#C4C7B5', ink2: '#9DA28D', halo: '#1C1E18',
    wegRand: '#121410', wegRandDoorzicht: 0.9,
    snel: '#4A4D40', hoofd: '#41443A', klein: '#373A31', fiets: '#30332A', onverhard: '#9C8862', pad: '#A8926A',
    waterLabel: '#7FA3A8', waterLijn: '#22383B', park: '#A9C66C', natuurDoorzicht: 0.05, grens: '#9C6A88',
    patronen: true, korrelInkt: [233, 234, 223], korrelSterkte: 0.2, ...NOTO,
  },
}

// Routetaal van de richtingen: hoe zachter de grond, hoe dikker de lijn. Elke klasse een eigen dikte en
// streep, en een rand per stuk (rand.breedte aan elke kant) die tegen elk kaartvlak >= 3:1 haalt.
const klassen = (d, open, dun) => ({
  onverhard: { dikte: d }, half: { dikte: d - 1 }, open: { dikte: open, streep: '7 5', kap: 'butt' },
  gesloten: { dikte: dun }, onbekend: { dikte: dun, streep: '0.1 6', kap: 'round' },
})
const korrelHalf = (kleur) => ({ onverhard: null, half: { kleur, dikte: 2, doorzicht: 0.9, streep: '0.1 5', kap: 'round' }, open: null, gesloten: null, onbekend: null })
const route = (o) => ({
  lijn: { dikte: 5, kap: 'butt' }, afspeelstip: { rand: '#FFFFFF' }, luchtfoto: { route: '#FFFFFF', stuk: '#FF00C8' }, ...o,
})
ROUTE.a = {
  licht: route({
    rand: { kleur: '#1B1E1C', breedte: 1.5, doorzicht: 1 }, klassen: klassen(7, 4.5, 3),
    korrelInkt: '#1B1E1C', korrelLicht: '#FFFFFF', korrel: korrelHalf('licht'),
    alternatief: { rand: '#FFFFFF', randDikte: 8, randDoorzicht: 1, kleur: '#7D8580', dikte: 4, streep: null, doorzicht: 1, kap: 'round' },
    twijfel: { kleur: '#1B1E1C', dikte: 2, streep: '3 6' },
    tekening: { kleur: '#1B1E1C', dikte: 3, streep: '8 6', schaduw: '#FFFFFF', schaduwDikte: 7, schaduwDoorzicht: 0.9, vulling: 0.06 },
    slepen: { lijn: '#1B1E1C', stip: '#FFFFFF' },
    omweg: { onder: '#FFFFFF', onderDikte: 10, onderDoorzicht: 1, kleur: '#0B8A5C', dikte: 5, doorzicht: 1, streep: '1 8' },
  }),
  donker: route({
    rand: { kleur: '#F4F5F3', breedte: 1.5, doorzicht: 1 }, klassen: klassen(7, 4.5, 3),
    korrelInkt: '#161817', korrelLicht: '#161817', korrel: korrelHalf('inkt'),
    alternatief: { rand: '#1B1D1C', randDikte: 8, randDoorzicht: 1, kleur: '#8A918C', dikte: 4, streep: null, doorzicht: 1, kap: 'round' },
    twijfel: { kleur: '#F4F5F3', dikte: 2, streep: '3 6' },
    tekening: { kleur: '#ECEEEC', dikte: 3, streep: '8 6', schaduw: '#000000', schaduwDikte: 7, schaduwDoorzicht: 0.6, vulling: 0.06 },
    slepen: { lijn: '#ECEEEC', stip: '#1B1D1C' }, afspeelstip: { rand: '#1B1D1C' },
    omweg: { onder: '#1B1D1C', onderDikte: 10, onderDoorzicht: 1, kleur: '#2DBE84', dikte: 5, doorzicht: 1, streep: '1 8' },
  }),
}
ROUTE.b = {
  licht: route({
    rand: { kleur: '#12204A', breedte: 2, doorzicht: 1 }, klassen: klassen(8, 5, 3.5),
    korrelInkt: '#12204A', korrelLicht: '#FFFFFF', korrel: korrelHalf('licht'),
    alternatief: { rand: '#FFFFFF', randDikte: 9, randDoorzicht: 1, kleur: '#7F89A3', dikte: 5, streep: null, doorzicht: 1, kap: 'round' },
    twijfel: { kleur: '#12204A', dikte: 2, streep: '3 6' },
    tekening: { kleur: '#2347E8', dikte: 4, streep: '10 6', schaduw: '#FFFFFF', schaduwDikte: 8, schaduwDoorzicht: 0.9, vulling: 0.08 },
    slepen: { lijn: '#12204A', stip: '#FFD23F' },
    omweg: { onder: '#FFFFFF', onderDikte: 11, onderDoorzicht: 1, kleur: '#00A272', dikte: 6, doorzicht: 1, streep: '1 9' },
  }),
  donker: route({
    rand: { kleur: '#FFFFFF', breedte: 2, doorzicht: 1 }, klassen: klassen(8, 5, 3.5),
    korrelInkt: '#0C1330', korrelLicht: '#0C1330', korrel: korrelHalf('inkt'),
    alternatief: { rand: '#10172F', randDikte: 9, randDoorzicht: 1, kleur: '#7380A6', dikte: 5, streep: null, doorzicht: 1, kap: 'round' },
    twijfel: { kleur: '#FFFFFF', dikte: 2, streep: '3 6' },
    tekening: { kleur: '#8FA4FF', dikte: 4, streep: '10 6', schaduw: '#000000', schaduwDikte: 8, schaduwDoorzicht: 0.6, vulling: 0.08 },
    slepen: { lijn: '#FFFFFF', stip: '#FFD23F' }, afspeelstip: { rand: '#10172F' },
    omweg: { onder: '#10172F', onderDikte: 11, onderDoorzicht: 1, kleur: '#21D199', dikte: 6, doorzicht: 1, streep: '1 9' },
  }),
}
ROUTE.c = {
  licht: route({
    rand: { kleur: '#26291F', breedte: 1.5, doorzicht: 1 }, klassen: klassen(6.5, 4, 2.8),
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
  }),
  donker: route({
    rand: { kleur: '#E9EADF', breedte: 1.5, doorzicht: 1 }, klassen: klassen(6.5, 4, 2.8),
    korrelInkt: '#1A1C16', korrelLicht: '#1A1C16',
    korrel: {
      onverhard: { kleur: 'inkt', dikte: 1.6, doorzicht: 0.6, streep: '0.1 7', kap: 'round' },
      half: { kleur: 'inkt', dikte: 1.6, doorzicht: 0.6, streep: '2 5', kap: 'butt' }, open: null, gesloten: null, onbekend: null,
    },
    alternatief: { rand: '#1C1E18', randDikte: 7, randDoorzicht: 1, kleur: '#7E8072', dikte: 3.5, streep: null, doorzicht: 1, kap: 'round' },
    twijfel: { kleur: '#E9EADF', dikte: 1.6, streep: '3 6' },
    tekening: { kleur: '#D79BBE', dikte: 3.5, streep: '8 6', schaduw: '#000000', schaduwDikte: 7, schaduwDoorzicht: 0.6, vulling: 0.07 },
    slepen: { lijn: '#E9EADF', stip: '#D79BBE' }, afspeelstip: { rand: '#1C1E18' },
    omweg: { onder: '#1C1E18', onderDikte: 10, onderDoorzicht: 1, kleur: '#4FBF9A', dikte: 5, doorzicht: 1, streep: '1 8' },
  }),
}

/** De richting die nu geldt (data-ontwerp op <html>), met Korrel als terugval. */
export function ontwerpNu() {
  const o = typeof document !== 'undefined' && document.documentElement.dataset.ontwerp
  return o && KAART[o] ? o : 'korrel'
}
export const kaartTokens = (donker, ontwerp = ontwerpNu()) => KAART[ontwerp][donker ? 'donker' : 'licht']
export const routeTokens = (donker, ontwerp = ontwerpNu()) => ROUTE[ontwerp][donker ? 'donker' : 'licht']
