#!/bin/bash
# De graaf voor heel NL uit een GitHub-release in de Pages-site zetten (beslissing 1 van
# docs/PLAN-heel-nederland.md: de graaf staat buiten git; in git staat alleen welke versie is goedgekeurd).
#
#   tools/graaf/haal_release.sh <doelmap> [versie]
#
# Zonder versie: de inhoud van <doelmap>/goedgekeurd.txt; bestaat dat niet, dan doet het script niets (de
# site blijft zoals hij is). Haalt de bijlage graaf-<versie>.tar van release graaf-<versie>, pakt hem uit in
# <doelmap> en controleert elk blok tegen de sha256 in het manifest. Vereist gh met GH_TOKEN.
set -euo pipefail
DOEL="$1"
VERSIE="${2:-}"
if [ -z "$VERSIE" ]; then
  if [ ! -f "$DOEL/goedgekeurd.txt" ]; then echo "Geen $DOEL/goedgekeurd.txt: geen graaf voor heel NL in deze site."; exit 0; fi
  VERSIE=$(tr -d '[:space:]' < "$DOEL/goedgekeurd.txt")
fi
TMP=$(mktemp -d)
T0=$(date +%s)
gh release download "graaf-$VERSIE" -R "${GITHUB_REPOSITORY:?}" -p "graaf-$VERSIE.tar" -D "$TMP"
echo "Bijlage: $(du -h "$TMP/graaf-$VERSIE.tar" | cut -f1) in $(( $(date +%s) - T0 )) s"
mkdir -p "$DOEL"
tar -xf "$TMP/graaf-$VERSIE.tar" -C "$DOEL"
rm -rf "$TMP"
node --input-type=module -e "
  import fs from 'node:fs'
  import crypto from 'node:crypto'
  const doel = process.argv[1], versie = process.argv[2]
  const m = JSON.parse(fs.readFileSync(doel + '/actueel.json', 'utf8'))
  if (m.formaat !== 'NPG1' || m.versie !== versie) throw new Error('verkeerd manifest: ' + m.formaat + ' ' + m.versie)
  let fout = 0
  for (const b of m.blokken) {
    const h = crypto.createHash('sha256').update(fs.readFileSync(doel + '/' + b.bestand)).digest('hex').slice(0, 16)
    if (h !== b.sha256) { fout++; console.log('hash klopt niet:', b.bestand) }
  }
  if (fout) throw new Error(fout + ' blokken kloppen niet')
  console.log('Graaf ' + versie + ': ' + m.blokken.length + ' blokken, ' + m.stations.length + ' stations, hashes in orde')
" "$DOEL" "$VERSIE"
