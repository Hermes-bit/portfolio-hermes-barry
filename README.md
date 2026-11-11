# Portfolio – Hermès Barry

Mon portfolio de chef de projet géomatique : mes projets, mon parcours et mes coordonnées.

Site en ligne : https://hermes-bit.github.io/portfolio-hermes-barry/

## Contenu

- **Projets** : une page par projet, avec le contexte, ce que j'ai fait, le résultat et les outils utilisés.
- **Parcours** : une carte Leaflet de mes formations et alternances, affichée en Lambert-93 (EPSG:2154). Leaflet travaille par défaut en Web Mercator : `js/carte.js` lui fournit un CRS personnalisé, avec la projection conique conforme et son inverse (`LAMBERT93.projeter` et `LAMBERT93.inverser`).
- **Accueil** : les courbes de niveau du bandeau sont tracées avec un algorithme de *marching squares* sur un relief généré (`dessinerCourbes` dans `js/app.js`).

## Technique

Site statique, sans framework ni étape de compilation : HTML, CSS et JavaScript.

- [Leaflet](https://leafletjs.com/) 1.9.4, copie locale dans `vendor/leaflet/`
- Fond de carte : IGN Admin Express (régions, départements), simplifié, via [france-geojson](https://github.com/gregoiredavid/france-geojson)
- Tous les contenus (profil, projets, compétences, lieux) sont regroupés dans `js/donnees.js`

## Lancer en local

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```bash
python -m http.server 8000
```

## Crédits

Leaflet © contributeurs Leaflet (licence BSD-2). Limites administratives © IGN, Admin Express.
