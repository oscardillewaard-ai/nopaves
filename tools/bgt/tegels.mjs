// De BGT-download op de tegelindeling van de app (NetherlandsRDNewQuad 12, vakjes van 215,04 m), zodat de
// bouw dezelfde vragen kan stellen als aan de vectortegels: "welke vlakken raken tegel col/row?".
// Een vlak staat (in zijn geheel) bij elke tegel die het raakt, net als in een vectortegel.
import * as K from '../../public/kern.js'

export function bboxVan(pol) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity
  for (const ringen of pol) for (const r of ringen) for (let i = 0; i < r.length; i += 2) {
    if (r[i] < a) a = r[i]
    if (r[i] > c) c = r[i]
    if (r[i + 1] < b) b = r[i + 1]
    if (r[i + 1] > d) d = r[i + 1]
  }
  return [a, b, c, d]
}

function inRing(x, y, r) {
  let binnen = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > y) !== (r[j + 1] > y) && x < ((r[j] - r[i]) * (y - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) binnen = !binnen
  }
  return binnen
}

function kruist(ax, ay, bx, by, cx, cy, dx, dy) {
  const o = (px, py, qx, qy, rx, ry) => Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px))
  return o(ax, ay, bx, by, cx, cy) * o(ax, ay, bx, by, dx, dy) < 0 && o(cx, cy, dx, dy, ax, ay) * o(cx, cy, dx, dy, bx, by) < 0
}

/** Raakt het vlak (polygonen in RD) het gebied [x0, y0, x1, y1]? */
export function raakt(pol, [tx0, ty0, tx1, ty1]) {
  const hoeken = [[tx0, ty0], [tx1, ty0], [tx1, ty1], [tx0, ty1]]
  for (const ringen of pol) {
    const buiten = ringen[0]
    for (let i = 0; i < buiten.length; i += 2) if (buiten[i] >= tx0 && buiten[i] <= tx1 && buiten[i + 1] >= ty0 && buiten[i + 1] <= ty1) return true
    if (hoeken.some(([x, y]) => inRing(x, y, buiten) && !ringen.slice(1).some((g) => inRing(x, y, g)))) return true
    for (let i = 0, j = buiten.length - 2; i < buiten.length; j = i, i += 2) {
      for (let k = 0; k < 4; k++) {
        const [px, py] = hoeken[k]
        const [qx, qy] = hoeken[(k + 1) % 4]
        if (kruist(buiten[j], buiten[j + 1], buiten[i], buiten[i + 1], px, py, qx, qy)) return true
      }
    }
  }
  return false
}

/** De tegels ('col/row') die een vlak raakt. */
export function tegelsVan(pol, bbox = bboxVan(pol)) {
  const [c0, r0] = K.tegelVan(bbox[0], bbox[3])
  const [c1, r1] = K.tegelVan(bbox[2], bbox[1])
  const uit = []
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if ((c1 - c0 + 1) * (r1 - r0 + 1) === 1 || raakt(pol, K.tegelGebied(c, r))) uit.push(c + '/' + r)
  }
  return uit
}

/** Index in het geheugen: tegel -> vlakken. bron(col, row) past op vlakkenVoor(tegels, bron) in bouw.mjs. */
export class TegelIndex {
  constructor() { this.tegels = new Map() }
  voegToe(o) {
    for (const k of tegelsVan(o.polygonen)) {
      const l = this.tegels.get(k)
      if (l) l.push(o)
      else this.tegels.set(k, [o])
    }
  }
  get bron() { return async (col, row) => this.tegels.get(col + '/' + row) || [] }
}
