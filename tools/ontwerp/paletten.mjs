// Paletten om te controleren met kleurcheck.mjs. 'korrel' is de huidige stand (stap 0).
export const PALETTEN = {
  korrel: {
    licht: {
      tekst: [['#2E3320', '#F1F3D4', 'inkt op vlak'], ['#4A5235', '#F1F3D4', 'inkt-2 op vlak'], ['#656E4B', '#F1F3D4', 'inkt-3 op vlak'], ['#656E4B', '#DDE5B3', 'inkt-3 op pagina'], ['#1F2A12', '#9BC046', 'tekst op hoofdknop'], ['#F6F6DA', '#4F6B2A', 'tekst op mos']],
      klassen: { onverhard: '#008300', half: '#eda100', open: '#e87ba4', gesloten: '#6250d6', onbekend: '#8a8985' },
      kaart: ['#DDE6B0', '#E4E9B5', '#E4DFAB', '#C9DA8E', '#8FB05A', '#8FB8C2', '#D8D09A'],
      rand: '#F6F7DD',
    },
    donker: {
      tekst: [['#EEF1CC', '#28301F', 'inkt op vlak'], ['#CCD4A2', '#28301F', 'inkt-2 op vlak'], ['#A1AC77', '#28301F', 'inkt-3 op vlak'], ['#1B2410', '#A9CF52', 'tekst op hoofdknop']],
      klassen: { onverhard: '#008300', half: '#c98500', open: '#d55181', gesloten: '#9085e9', onbekend: '#8a8985' },
      kaart: ['#222B1A', '#2A3320', '#3A5428', '#43572A', '#2E4F5A', '#363C2A'],
      rand: '#10150B',
    },
  },
}

// ---- stap 2: de drie richtingen. kaart = de vlakken waar een route overheen kan lopen. ----
PALETTEN.a = {
  licht: {
    tekst: [['#1B1E1C', '#FFFFFF', 'inkt op vlak'], ['#4A504C', '#FFFFFF', 'inkt-2 op vlak'], ['#626964', '#F3F4F2', 'inkt-3 op pagina'], ['#FFFFFF', '#1B1E1C', 'hoofdknop'], ['#1B1E1C', '#E7E9E6', 'op vlak-2']],
    klassen: { onverhard: '#0B8A5C', half: '#E19100', open: '#C4559C', gesloten: '#4D5A66', onbekend: '#A3A9AE' },
    kaart: ['#F2F2EF', '#F0F0EB', '#ECEBE7', '#E2E0DA', '#CCDCBF', '#E0E9D7', '#C9D9E2', '#EFE9DA', '#E8E1E6'],
    rand: '#1B1E1C',
  },
  donker: {
    tekst: [['#ECEEEC', '#1F2220', 'inkt op vlak'], ['#B9BEBA', '#1F2220', 'inkt-2 op vlak'], ['#8F9690', '#161817', 'inkt-3 op pagina'], ['#161817', '#ECEEEC', 'hoofdknop']],
    klassen: { onverhard: '#2DBE84', half: '#F2C14E', open: '#C8509E', gesloten: '#B7C3D3', onbekend: '#5F666C' },
    kaart: ['#1B1D1C', '#1D201E', '#222423', '#2A2D2B', '#1F2A22', '#212922', '#14222B', '#2A2822'],
    rand: '#F4F5F3',
  },
}
PALETTEN.b = {
  licht: {
    tekst: [['#12204A', '#FFFFFF', 'inkt op vlak'], ['#3D4A6B', '#FFFFFF', 'inkt-2 op vlak'], ['#56607A', '#EDF0F5', 'inkt-3 op pagina'], ['#FFFFFF', '#2347E8', 'hoofdknop kobalt'], ['#12204A', '#FFD23F', 'score op geel']],
    klassen: { onverhard: '#00A272', half: '#FF9A1A', open: '#D9479C', gesloten: '#46506A', onbekend: '#BCC2CE' },
    kaart: ['#E6EAEE', '#EAEDEF', '#DDE1E7', '#CBD1DA', '#AFD3B0', '#C8E2C0', '#9CC2EA', '#F0E2BE'],
    rand: '#12204A',
  },
  donker: {
    tekst: [['#F2F4FA', '#141C3F', 'inkt op vlak'], ['#C3CAE0', '#141C3F', 'inkt-2 op vlak'], ['#99A3C2', '#0C1330', 'inkt-3 op pagina'], ['#0C1330', '#8FA4FF', 'hoofdknop'], ['#12204A', '#FFD23F', 'score op geel']],
    klassen: { onverhard: '#21D199', half: '#FFC24A', open: '#E0569F', gesloten: '#BFC8E2', onbekend: '#4E5876' },
    kaart: ['#10172F', '#131B36', '#18213E', '#1F2947', '#15263A', '#172A33', '#0B2238'],
    rand: '#FFFFFF',
  },
}
PALETTEN.c = {
  licht: {
    tekst: [['#26291F', '#F7F7F1', 'inkt op vlak'], ['#4B5040', '#F7F7F1', 'inkt-2 op vlak'], ['#5C6250', '#E9EBE1', 'inkt-3 op pagina'], ['#F7F7F1', '#3E5A24', 'hoofdknop mos'], ['#26291F', '#E0E3D6', 'op vlak-2']],
    klassen: { onverhard: '#2F7D4A', half: '#C98A12', open: '#A64F86', gesloten: '#3D4250', onbekend: '#ABA69A' },
    kaart: ['#ECEADF', '#EFEBDC', '#E4E1D6', '#DAD6C8', '#BFD0A8', '#D9E1C4', '#B5CCCF', '#EADCB8', '#DFCFD7'],
    rand: '#26291F',
  },
  donker: {
    tekst: [['#E9EADF', '#23261E', 'inkt op vlak'], ['#C4C7B5', '#23261E', 'inkt-2 op vlak'], ['#9DA28D', '#1A1C16', 'inkt-3 op pagina'], ['#1A1C16', '#A9C66C', 'hoofdknop']],
    klassen: { onverhard: '#4FBF9A', half: '#E8B54A', open: '#B65A96', gesloten: '#BDC2CC', onbekend: '#5F6257' },
    kaart: ['#1C1E18', '#20231B', '#24271F', '#2C2F26', '#24321F', '#283023', '#1A2A2C', '#302B1F'],
    rand: '#E9EADF',
  },
}

// ---- de gekozen huisstijl (v1.3.0): Veldboek licht, Bosgroen donker. Houd gelijk met tokens.css en kaarttokens.js ----
PALETTEN.veldboek = {
  licht: { ...PALETTEN.c.licht },
  donker: {
    tekst: [['#EEF3EA', '#163A28', 'inkt op paneel'], ['#C2D3C4', '#1D4532', 'inkt-2 op vlak'], ['#A5BCA9', '#24503B', 'inkt-3 op vlak-2'], ['#A5BCA9', '#163A28', 'inkt-3 op paneel'], ['#14301F', '#C6E36A', 'hoofdknop'], ['#C2D3C4', '#24503B', 'inkt-2 op vlak-2']],
    klassen: { onverhard: '#4FBF9A', half: '#E8B54A', open: '#B65A96', gesloten: '#BDC2CC', onbekend: '#6E7568' },
    kaart: ['#17231C', '#19261E', '#1D2A22', '#24332A', '#1E3626', '#213A28', '#0D2A36', '#2F2B20', '#2E2630'],
    rand: '#EEF3EA',
  },
}
