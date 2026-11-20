#!/usr/bin/env python3
"""Bron "pbf" voor de graaf-proef: wegen, paden, stranden, waterpunten en stations uit een
OpenStreetMap-extract (Geofabrik, .osm.pbf), bijgesneden tot een bbox, als ndjson voor bouw.mjs.

    pip install osmium
    python3 tools/graaf/bron_pbf.py zuid-holland-latest.osm.pbf uit.ndjson 4.1309 51.8358 4.6582 52.2682

Schrijft uit.ndjson (één element per regel) en uit.json (bron, datum van het extract). De tags gaan
ruw mee; bouw.mjs brengt ze terug tot wat de app uit de kaarttegels kent (osmtags.mjs).
"""
import json
import sys

import osmium

TAGS = ('highway', 'surface', 'access', 'foot', 'service', 'bridge', 'tunnel', 'layer', 'area', 'natural')
POI = {
    ('amenity', 'drinking_water'): 'water', ('amenity', 'cafe'): 'horeca', ('amenity', 'restaurant'): 'horeca',
    ('amenity', 'fast_food'): 'horeca', ('amenity', 'pub'): 'horeca', ('amenity', 'bar'): 'horeca',
    ('amenity', 'ice_cream'): 'horeca', ('shop', 'supermarket'): 'winkel', ('shop', 'convenience'): 'winkel',
    ('shop', 'bakery'): 'winkel', ('amenity', 'toilets'): 'toilet', ('amenity', 'fuel'): 'tank',
}


def is_trein(t):
    """Waarschijnlijk een treinstation (NS of een andere spoorvervoerder), geen museumlijn.

    train=yes of een NS-operator wint altijd, ook als er een metro- of RandstadRail-perron bij hoort
    (Rotterdam Blaak, Schiedam Centrum, Den Haag Laan van NOI). Metro- en RandstadRail-haltes zonder
    train=yes zijn geen trein; museumlijnen (toeristisch of bewaard) ook niet.
    """
    museum = (t.get('usage') in ('tourism', 'heritage') or t.get('railway:preserved') == 'yes' or 'tourism' in t
              or any(w in (t.get('operator', '') + ' ' + t.get('network', '')).lower() for w in ('museum', 'smalspoor', 'stoomtrein', 'stichting')))
    return not museum and (t.get('train') == 'yes' or t.get('operator', '').startswith('NS') or t.get('network', '').startswith('NS'))


class Lezer(osmium.SimpleHandler):
    def __init__(self, uit, bbox):
        super().__init__()
        self.uit = uit
        self.w, self.s, self.e, self.n = bbox
        self.aantal = {'way': 0, 'poi': 0, 'station': 0}

    def binnen(self, lat, lon):
        return self.s <= lat <= self.n and self.w <= lon <= self.e

    def schrijf(self, d):
        self.uit.write(json.dumps(d, ensure_ascii=False, separators=(',', ':')) + '\n')
        self.aantal[d['soort']] += 1

    def node(self, n):
        if not n.location.valid() or not self.binnen(n.location.lat, n.location.lon):
            return
        t = n.tags
        naam = t.get('name:nl') or t.get('name') or ''
        spoor = t.get('railway') in ('station', 'halt') or (t.get('public_transport') == 'station' and t.get('train') == 'yes')
        if spoor and naam:
            # Zoals de app in de kaarttegels (laag poi, railway/station en railway/halt): ook metro- en
            # RandstadRail-haltes, maar dan als 'geen trein' (de app geeft ze een straf en noemt ze
            # "misschien een tram- of metrohalte").
            self.schrijf({'soort': 'station', 'naam': naam, 'trein': bool(is_trein(t)), 'rank': 0, 'lat': n.location.lat, 'lon': n.location.lon})
            return
        for (k, v), s in POI.items():
            if t.get(k) == v:
                self.schrijf({'soort': 'poi', 'poi': s, 'naam': naam, 'lat': n.location.lat, 'lon': n.location.lon})
                return

    def way(self, w):
        t = w.tags
        if 'highway' not in t and t.get('natural') != 'beach':
            return
        try:
            geom = [[round(nd.location.lat, 7), round(nd.location.lon, 7)] for nd in w.nodes]
        except osmium.InvalidLocationError:
            return
        if len(geom) < 2 or not any(self.binnen(la, lo) for la, lo in geom):
            return
        self.schrijf({'soort': 'way', 'osm': w.id, 'tags': {k: t[k] for k in TAGS if k in t}, 'geometry': geom})


def main():
    pbf, uitpad, *bb = sys.argv[1:]
    bbox = [float(x) for x in bb]
    kop = osmium.io.Reader(pbf, osmium.osm.osm_entity_bits.NOTHING).header()
    datum = kop.get('osmosis_replication_timestamp') or kop.get('timestamp') or ''
    with open(uitpad, 'w', encoding='utf-8') as uit:
        lezer = Lezer(uit, bbox)
        lezer.apply_file(pbf, locations=True, idx='flex_mem')
    with open(uitpad.rsplit('.', 1)[0] + '.json', 'w') as f:
        json.dump({'bestand': pbf.split('/')[-1], 'datum': datum, 'bbox': bbox, 'aantal': lezer.aantal}, f)
    print(lezer.aantal, datum)


if __name__ == '__main__':
    main()
