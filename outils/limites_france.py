"""Fabrique assets/donnees/limites-departements-regions.json, les limites des départements et des
régions de France métropolitaine tracées sur les fonds en tuiles de la carte du parcours (js/carte.js).

Source : IGN, Admin Express COG CARTO (départements en polygones), service WFS de la Géoplateforme.
Méthode :
  1. un côté partagé par deux départements est une limite de département, ou de région si les deux
     départements sont dans des régions différentes (les contours de l'IGN sont topologiques : deux
     départements voisins ont exactement les mêmes sommets) ;
  2. les côtés non partagés (côtes, frontières) sont écartés : les fonds de carte les dessinent déjà ;
  3. les côtés sont fusionnés en lignes, simplifiés en Lambert-93 (Douglas-Peucker), puis encodés au
     format « polyline » (précision 1e-5 degré), que js/carte.js décode.

Téléchargement des départements (environ 19 Mo) :
  curl -o departements.json "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=500&TYPENAMES=ADMINEXPRESS-COG-CARTO.LATEST:departement&PROPERTYNAME=geometrie,code_insee,code_insee_de_la_region&BBOX=41.0,-5.5,51.3,10.0,urn:ogc:def:crs:EPSG::4326"
Usage (shapely et pyproj requis) :
  python outils/limites_france.py departements.json 40 assets/donnees/limites-departements-regions.json
Avec une tolérance de 40 m, l'écart reste sous deux pixels jusqu'au zoom 12, où les communes prennent le relais.
"""
import gzip
import json
import sys
from collections import defaultdict

import shapely
from pyproj import Transformer
from shapely.geometry import MultiLineString
from shapely.ops import linemerge

source, tolerance, sortie = sys.argv[1], float(sys.argv[2]), sys.argv[3]
vers_lambert93 = Transformer.from_crs(4326, 2154, always_xy=True).transform
vers_wgs84 = Transformer.from_crs(2154, 4326, always_xy=True).transform

# 1. Qui utilise chaque côté ?
cotes = defaultdict(list)
for f in json.load(open(source, encoding="utf-8"))["features"]:
    dep, reg = f["properties"]["code_insee"], f["properties"]["code_insee_de_la_region"]
    g = f["geometry"]
    for polygone in g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]:
        for anneau in polygone:
            for a, b in zip(anneau, anneau[1:]):
                ka, kb = (round(a[0], 6), round(a[1], 6)), (round(b[0], 6), round(b[1], 6))
                cotes[(ka, kb) if ka < kb else (kb, ka)].append((dep, reg))

# 2. Classement des côtés partagés
niveaux = defaultdict(list)
for (a, b), qui in cotes.items():
    if len(qui) < 2:
        continue  # côte ou frontière
    niveaux["region" if qui[0][1] != qui[1][1] else "departement"].append((a, b))


def encoder(points):
    """[(lat, lon), ...] → texte « polyline » (algorithme de Google, précision 1e-5)."""
    texte, plat, plon = [], 0, 0
    for lat, lon in points:
        ilat, ilon = round(lat * 1e5), round(lon * 1e5)
        for v in (ilat - plat, ilon - plon):
            v = ~(v << 1) if v < 0 else v << 1
            while v >= 0x20:
                texte.append(chr((0x20 | (v & 0x1F)) + 63))
                v >>= 5
            texte.append(chr(v + 63))
        plat, plon = ilat, ilon
    return "".join(texte)


# 3. Fusion, simplification, encodage
resultat, sommets = {}, 0
for niveau, segments in niveaux.items():
    fusion = linemerge(MultiLineString(segments))
    lignes = list(fusion.geoms) if fusion.geom_type == "MultiLineString" else [fusion]
    resultat[niveau] = []
    for ligne in lignes:
        simple = shapely.transform(ligne, lambda x, y: vers_lambert93(x, y), interleaved=False).simplify(tolerance, preserve_topology=False)
        simple = shapely.transform(simple, lambda x, y: vers_wgs84(x, y), interleaved=False)
        points = [(y, x) for x, y in simple.coords]
        sommets += len(points)
        resultat[niveau].append(encoder(points))

texte = json.dumps(resultat, separators=(",", ":"))
open(sortie, "w", encoding="utf-8").write(texte)
print(f"tolérance {tolerance:.0f} m : {sum(len(v) for v in resultat.values())} lignes, {sommets} sommets, "
      f"{len(texte) // 1024} Ko ({len(gzip.compress(texte.encode())) // 1024} Ko compressé)")
