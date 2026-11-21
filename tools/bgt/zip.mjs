// Bestanden uit een grote zip op afstand lezen, zonder de zip te downloaden: de inhoudsopgave (central
// directory, ook ZIP64) via HTTP Range, en per bestand alleen zijn eigen bytes, in stukken die tegelijk
// worden opgehaald en op volgorde worden uitgepakt. Een mislukt stuk wordt opnieuw gehaald (hervatten).
// Fase 1 van docs/PLAN-heel-nederland.md: PDOK begrenst per verbinding (~1,3 MB/s), niet per afnemer;
// 8 stromen gaven 10,6 MB/s, 16 stromen 19,3 MB/s (gemeten 2026-11-21).
import zlib from 'node:zlib'

const KOP = { 'User-Agent': 'nopaves-graaf/bgt (wekelijkse voorbewerking)' }
const wacht = (ms) => new Promise((r) => setTimeout(r, ms))

/** Bytes [van, tot] (inclusief) van een adres, met herhalen bij fouten. */
export async function bereik(url, van, tot, { pogingen = 8 } = {}) {
  for (let p = 0; ; p++) {
    try {
      const r = await fetch(url, { headers: { ...KOP, Range: `bytes=${van}-${tot}` }, signal: AbortSignal.timeout(300000) })
      if (r.status !== 206) throw new Error(`HTTP ${r.status} voor bereik ${van}-${tot}`)
      const b = new Uint8Array(await r.arrayBuffer())
      if (b.length !== tot - van + 1) throw new Error(`kort antwoord: ${b.length} van ${tot - van + 1} bytes`)
      return b
    } catch (fout) {
      if (p + 1 >= pogingen) throw fout
      await wacht(Math.min(60000, 2000 * 2 ** p))
    }
  }
}

/** Het echte adres (PDOK stuurt een 307 naar een cache-adres) en de grootte. */
export async function bestandInfo(url) {
  const r = await fetch(url, { headers: { ...KOP, Range: 'bytes=0-0' }, redirect: 'follow' })
  if (r.status !== 206) throw new Error(`HTTP ${r.status}: geen Range-ondersteuning?`)
  await r.arrayBuffer()
  return { url: r.url, grootte: Number(r.headers.get('content-range').split('/')[1]), gewijzigd: r.headers.get('last-modified') }
}

const u16 = (b, o) => b[o] | (b[o + 1] << 8)
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
const u64 = (b, o) => u32(b, o) + u32(b, o + 4) * 2 ** 32

/** De inhoudsopgave: [{naam, methode, gecomprimeerd, uitgepakt, kop}] (kop = begin van de lokale kop). */
export async function inhoud(url, grootte) {
  const staart = await bereik(url, Math.max(0, grootte - 65558), grootte - 1)
  let e = -1
  for (let i = staart.length - 22; i >= 0; i--) if (u32(staart, i) === 0x06054b50) { e = i; break }
  if (e < 0) throw new Error('geen einde van de inhoudsopgave gevonden')
  let aantal = u16(staart, e + 10)
  let cdGrootte = u32(staart, e + 12)
  let cdBegin = u32(staart, e + 16)
  const z64 = e - 20 >= 0 && u32(staart, e - 20) === 0x07064b50
  if (z64) {
    const rec = u64(staart, e - 20 + 8)
    const r = await bereik(url, rec, rec + 55)
    if (u32(r, 0) !== 0x06064b50) throw new Error('ZIP64-einde niet gevonden')
    aantal = u64(r, 32)
    cdGrootte = u64(r, 40)
    cdBegin = u64(r, 48)
  }
  const cd = await bereik(url, cdBegin, cdBegin + cdGrootte - 1)
  const uit = []
  let o = 0
  for (let k = 0; k < aantal; k++) {
    if (u32(cd, o) !== 0x02014b50) throw new Error('kapotte inhoudsopgave')
    const methode = u16(cd, o + 10)
    let gecomprimeerd = u32(cd, o + 20)
    let uitgepakt = u32(cd, o + 24)
    const nLen = u16(cd, o + 28)
    const xLen = u16(cd, o + 30)
    const cLen = u16(cd, o + 32)
    let kop = u32(cd, o + 42)
    const naam = new TextDecoder().decode(cd.subarray(o + 46, o + 46 + nLen))
    // ZIP64-extra: alleen de velden die 0xFFFFFFFF zijn staan erin, in deze volgorde
    let x = o + 46 + nLen
    const xEind = x + xLen
    while (x + 4 <= xEind) {
      const id = u16(cd, x)
      const len = u16(cd, x + 2)
      if (id === 0x0001) {
        let p = x + 4
        if (uitgepakt === 0xffffffff) { uitgepakt = u64(cd, p); p += 8 }
        if (gecomprimeerd === 0xffffffff) { gecomprimeerd = u64(cd, p); p += 8 }
        if (kop === 0xffffffff) { kop = u64(cd, p); p += 8 }
      }
      x += 4 + len
    }
    uit.push({ naam, methode, gecomprimeerd, uitgepakt, kop })
    o = xEind + cLen
  }
  return uit
}

/**
 * Eén bestand uit de zip als stroom tekst (async generator van strings), uitgepakt.
 * stromen: zoveel stukken tegelijk; stuk: bytes per verzoek. voortgang(bytesBinnen) optioneel.
 */
export async function* leesBestand(url, item, { stromen = 8, stuk = 8 << 20, voortgang = null } = {}) {
  const lk = await bereik(url, item.kop, item.kop + 29)
  if (u32(lk, 0) !== 0x04034b50) throw new Error('lokale kop niet gevonden voor ' + item.naam)
  const begin = item.kop + 30 + u16(lk, 26) + u16(lk, 28)
  const eind = begin + item.gecomprimeerd // exclusief
  const stukken = []
  for (let a = begin; a < eind; a += stuk) stukken.push([a, Math.min(eind, a + stuk) - 1])
  // ophalen: hooguit 'stromen' tegelijk, maar niet verder dan 2 × stromen vooruit (geheugen)
  const klaar = new Map()
  let volgende = 0
  let binnen = 0
  const wachtenden = []
  const start = () => {
    while (volgende < stukken.length && klaar.size + wachtenden.length < stromen && volgende < uitgegeven + 2 * stromen) {
      const i = volgende++
      const p = bereik(url, ...stukken[i]).then((b) => { binnen += b.length; if (voortgang) voortgang(binnen); return b })
      klaar.set(i, p)
    }
  }
  let uitgegeven = 0
  const inflate = item.methode === 8 ? zlib.createInflateRaw({ chunkSize: 1 << 20 }) : null
  const dec = new TextDecoder('utf-8')
  const uitStukken = []
  let fout = null
  let klaarMetInflate = !inflate
  if (inflate) {
    inflate.on('data', (d) => uitStukken.push(dec.decode(d, { stream: true })))
    inflate.on('error', (e) => { fout = e })
    inflate.on('end', () => { klaarMetInflate = true })
  }
  start()
  while (uitgegeven < stukken.length) {
    const b = await klaar.get(uitgegeven)
    klaar.delete(uitgegeven)
    uitgegeven++
    start()
    if (inflate) {
      if (!inflate.write(b)) await new Promise((r) => inflate.once('drain', r))
    } else uitStukken.push(dec.decode(b, { stream: true }))
    while (uitStukken.length) yield uitStukken.shift()
    if (fout) throw fout
  }
  if (inflate) {
    inflate.end()
    while (!klaarMetInflate) { await new Promise((r) => setTimeout(r, 5)); while (uitStukken.length) yield uitStukken.shift(); if (fout) throw fout }
  }
  while (uitStukken.length) yield uitStukken.shift()
  const laatste = dec.decode()
  if (laatste) yield laatste
}
