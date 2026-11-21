// De bron van de BGT voor heel NL: het kant-en-klare bestand van PDOK (gmllight, alle objecttypes zonder
// plaatsbepalingspunten, elke nacht ververst; ~28 GB, waarvan ~19,7 GB voor de vijf typen die de app leest).
export const NL_ZIP = 'https://api.pdok.nl/lv/bgt/download/v1_0/full/predefined/bgt-gmllight-nl-nopbp.zip'
export const COLLECTIES = ['wegdeel', 'ondersteunendwegdeel', 'begroeidterreindeel', 'onbegroeidterreindeel', 'waterdeel']
export const API = 'https://api.pdok.nl/lv/bgt/download/v1_0'
export const DATASET = API + '/dataset' // actualiteit per objecttype (datetimeTo)
