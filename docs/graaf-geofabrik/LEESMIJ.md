# Metingen: graaf uit het Geofabrik-extract

Ruwe cijfers bij docs/GRAAF-PROEF.md, sectie "Na de proef: graaf uit het Geofabrik-extract".

- `oordeel-pr15.json`: `tools/graaf/vergelijk_oordeel.mjs` op de graaf van PR #15 (eerste
  Geofabrik-bouw, 2026-11-20, extract van 2026-11-19 21:22 UTC).
- `brouter-ab.json`: `tools/onverhard/benchmark_snelheid.mjs … 5 '' ab` (BRouter, de standaard).
- `vooraf-ab-pr15.json`: idem met `ONVERHARD_QUERY='graaf=vooraf&router=eigen'` op die graaf.

Gemeten in de cloudomgeving van Claude Code (desktop-Chromium headless, via de proxy), 5× koud en
5× warm per paar, mediaan, achter elkaar en niet tegelijk met tests.
