/* Carte du parcours (page Parcours), avec Leaflet.
   Quatre fonds au choix (voir FONDS) :
   - « Carte simple », le fond par défaut : régions, départements et contour de la France
     (js/fond-carte-france.js), dessinés par le site en Lambert-93 (EPSG:2154), la projection
     officielle de la France métropolitaine. Aucune requête vers un service extérieur ;
   - OpenStreetMap, photos aériennes et Plan IGN : des tuiles en Web Mercator (EPSG:3857),
     chargées seulement si le visiteur les choisit. La carte est alors reconstruite dans
     cette projection, à la même place et à la même échelle. Les limites des régions, des
     départements et des communes y sont tracées par-dessus (voir « Limites administratives »). */

const ETIQUETTES_REGIONS = [
  ["Hauts-de-France", 49.95, 2.75], ["Normandie", 49.05, 0.1], ["Bretagne", 48.1, -2.9],
  ["Pays de la Loire", 47.35, -0.95], ["Centre-Val de Loire", 47.45, 1.75], ["Grand Est", 49.05, 6.5],
  ["Bourgogne-Franche-Comté", 47.15, 4.75], ["Nouvelle-Aquitaine", 45.0, 0.4], ["Auvergne-Rhône-Alpes", 45.45, 4.4],
  ["Occitanie", 44.35, 2.4], ["Provence-Alpes-Côte d'Azur", 44.0, 6.25], ["Corse", 42.15, 9.1],
];
const VILLES = [
  ["Lille", 50.63, 3.06], ["Rennes", 48.11, -1.68], ["Nantes", 47.22, -1.55], ["Bordeaux", 44.84, -0.58],
  ["Toulouse", 43.6, 1.44], ["Marseille", 43.3, 5.37], ["Lyon", 45.76, 4.84], ["Strasbourg", 48.58, 7.75],
  ["Nice", 43.7, 7.27], ["Dijon", 47.32, 5.04], ["Orléans", 47.9, 1.9],
];
const ORDRE = ["p8", "mca", "idgeo", "ccov", "sncf", "rna"]; // ordre chronologique : sert à numéroter les lieux
const EMPRISE_FRANCE = [[41.3, -5.2], [51.15, 9.6]];
const COULEURS = { region: "#FFFFFF", regionActive: "#E2F0EB" };
const SURVOL_POSSIBLE = matchMedia("(hover: hover)").matches;
const MOINS_D_ANIMATIONS = matchMedia("(prefers-reduced-motion: reduce)").matches;

let carte = null;
let marqueurs = {};
let regions = {};

const lieu = (id) => PLACES.find((p) => p.id === id);
const numero = (id) => ORDRE.indexOf(id) + 1;
const MARGES_ENSEMBLE = { padding: [16, 16] }; // cadrage de la vue d'ensemble

/* ---------- Projection Lambert-93 ----------
   Projection conique conforme de Lambert sur l'ellipsoïde GRS80 (système RGF93),
   parallèles automécoïques 44° et 49° N, origine 46,5° N / 3° E,
   X0 = 700 000 m, Y0 = 6 600 000 m.
   Formules : IGN, « Projection cartographique conique conforme de Lambert » (NT/G 71). */
const LAMBERT93 = (() => {
  const a = 6378137; // demi-grand axe de GRS80
  const e = 0.0818191910428158; // première excentricité de GRS80
  const X0 = 700000;
  const Y0 = 6600000;
  const rad = (deg) => (deg * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const lon0 = rad(3);
  const m = (phi) => Math.cos(phi) / Math.sqrt(1 - (e * Math.sin(phi)) ** 2);
  const t = (phi) => Math.tan(Math.PI / 4 - phi / 2) / ((1 - e * Math.sin(phi)) / (1 + e * Math.sin(phi))) ** (e / 2);
  const phi1 = rad(44);
  const phi2 = rad(49);
  const n = Math.log(m(phi1) / m(phi2)) / Math.log(t(phi1) / t(phi2));
  const F = m(phi1) / (n * t(phi1) ** n);
  const rho0 = a * F * t(rad(46.5)) ** n;

  // Latitude, longitude (degrés) → X, Y (mètres)
  function projeter(lat, lon) {
    const rho = a * F * t(rad(lat)) ** n;
    const theta = n * (rad(lon) - lon0);
    return [X0 + rho * Math.sin(theta), Y0 + rho0 - rho * Math.cos(theta)];
  }

  // X, Y (mètres) → latitude, longitude (degrés).
  // La latitude n'a pas d'expression directe : on la calcule par itérations successives.
  function inverser(x, y) {
    const dx = x - X0;
    const dy = Y0 + rho0 - y;
    const rho = Math.hypot(dx, dy);
    const theta = Math.atan2(dx, dy);
    const tt = (rho / (a * F)) ** (1 / n);
    let phi = Math.PI / 2 - 2 * Math.atan(tt);
    for (let i = 0; i < 10; i++) {
      const es = e * Math.sin(phi);
      phi = Math.PI / 2 - 2 * Math.atan(tt * ((1 - es) / (1 + es)) ** (e / 2));
    }
    return [deg(phi), deg(lon0 + theta / n)];
  }

  return { projeter, inverser };
})();

/* CRS Leaflet en Lambert-93. Leaflet utilise Web Mercator par défaut ; ici on lui fournit
   la projection ci-dessus et une échelle par niveau de zoom.
   Résolution au zoom 0 : celle du Web Mercator à 46,5° N, pour garder des niveaux de zoom
   comparables à ceux d'une carte Leaflet classique. */
const RESOLUTION_ZOOM_0 = 156543.03 * Math.cos((46.5 * Math.PI) / 180); // mètres par pixel
const CRS_LAMBERT93 = L.extend({}, L.CRS.Earth, {
  code: "EPSG:2154",
  projection: {
    project: (latlng) => L.point(LAMBERT93.projeter(latlng.lat, latlng.lng)),
    unproject: (point) => L.latLng(LAMBERT93.inverser(point.x, point.y)),
    bounds: L.bounds([-400000, 6000000], [1400000, 7300000]),
  },
  // Les Y des pixels croissent vers le bas : on inverse l'axe, avec une origine au nord de la France.
  transformation: new L.Transformation(1, 0, -1, 7300000),
  scale: (zoom) => 2 ** zoom / RESOLUTION_ZOOM_0,
  zoom: (echelle) => Math.log2(echelle * RESOLUTION_ZOOM_0),
  infinite: false,
});
/* ---------- Fonds de carte ----------
   Les crédits s'affichent dans le coin de la carte, comme l'exigent les licences
   (ODbL pour OpenStreetMap, Licence Ouverte pour l'IGN). */
const lienSource = (url, texte) => `<a href="${url}" target="_blank" rel="noopener">${texte}</a>`;
const SOURCE_IGN = lienSource("https://geoservices.ign.fr/", "IGN");
// Géoplateforme de l'IGN : tuiles WMTS en Web Mercator (jeu de tuiles « PM »), sans clé.
const tuilesIGN = (couche, format) => "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0"
  + `&LAYER=${couche}&STYLE=normal&TILEMATRIXSET=PM&FORMAT=${format}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`;
const FONDS = {
  simple: { nom: "Carte simple", credit: `Sources : ${SOURCE_IGN}, Admin Express` },
  osm: {
    nom: "OpenStreetMap",
    tuiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    credit: `© les contributeurs ${lienSource("https://www.openstreetmap.org/copyright", "OpenStreetMap")}`,
  },
  ortho: {
    nom: "Photos aériennes",
    tuiles: tuilesIGN("ORTHOIMAGERY.ORTHOPHOTOS", "image/jpeg"),
    credit: `© ${SOURCE_IGN}, Géoplateforme`,
  },
  plan: {
    nom: "Plan IGN",
    tuiles: tuilesIGN("GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2", "image/png"),
    credit: `© ${SOURCE_IGN}, Géoplateforme`,
  },
};
let fondActif = "simple";
let lieuActif = null; // lieu dont la fiche est ouverte : elle reste ouverte quand on change de fond

/* ---------- Limites administratives sur les fonds en tuiles ----------
   - Vue large (zoom < 10) : régions et départements du fond de la carte simple (js/fond-carte-france.js).
   - En zoomant : les communes de la vue, demandées au service WFS de l'IGN (Admin Express COG CARTO,
     version « petite échelle » puis version détaillée à partir du zoom 13).
     Les limites de départements et de régions sont déduites des communes : deux communes voisines
     partagent exactement les mêmes sommets, et un côté commun à deux communes de départements
     (ou de régions) différents est une limite de département (ou de région). */
const ZOOM_COMMUNES = 10;
const ZOOM_COMMUNES_DETAILLEES = 13;
const STYLES_LIMITES = {
  commune: { weight: 1, halo: 3, dashArray: "5 4", opacity: 0.9 },
  departement: { weight: 1.4, halo: 3.5, opacity: 1 },
  region: { weight: 2.8, halo: 6.5, opacity: 1 },
};
const COULEUR_LIMITES = "#5B2A86"; // violet : la couleur habituelle des limites administratives
const urlCommunes = (jeu, b) => "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature"
  + `&TYPENAMES=${jeu}:commune&PROPERTYNAME=geometrie,code_insee_du_departement,code_insee_de_la_region`
  + "&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=5000"
  + `&BBOX=${[b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map((v) => v.toFixed(4)).join(",")},urn:ogc:def:crs:EPSG::4326`;
let limites = null; // état des limites de la carte affichée (fonds en tuiles seulement)

// Chaque niveau est tracé deux fois : un liseré blanc dessous, pour rester lisible sur les photos aériennes.
function tracerLimite(groupe, niveau, ajouter) {
  const s = STYLES_LIMITES[niveau];
  ajouter({ color: "#FFFFFF", weight: s.halo, opacity: 0.6, fill: false, interactive: false }).addTo(groupe);
  ajouter({ color: COULEUR_LIMITES, weight: s.weight, opacity: s.opacity, dashArray: s.dashArray, fill: false, interactive: false }).addTo(groupe);
}

// Communes (GeoJSON) → segments classés par niveau : { commune: [...], departement: [...], region: [...] }.
function limitesDepuisCommunes(geojson) {
  const cote = new Map();
  for (const f of geojson.features) {
    const dep = f.properties.code_insee_du_departement;
    const reg = f.properties.code_insee_de_la_region;
    const polygones = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const anneau of polygones.flat()) {
      for (let i = 1; i < anneau.length; i++) {
        const a = anneau[i - 1];
        const b = anneau[i];
        const ka = `${a[0].toFixed(6)},${a[1].toFixed(6)}`;
        const kb = `${b[0].toFixed(6)},${b[1].toFixed(6)}`;
        const cle = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        const deja = cote.get(cle);
        if (!deja) cote.set(cle, { a, b, dep, reg, niveau: "commune" });
        else if (deja.reg !== reg) deja.niveau = "region";
        else if (deja.dep !== dep) deja.niveau = "departement";
      }
    }
  }
  const lignes = { commune: [], departement: [], region: [] };
  for (const s of cote.values()) lignes[s.niveau].push([[s.a[1], s.a[0]], [s.b[1], s.b[0]]]);
  return lignes;
}

function initLimites() {
  const etat = { vueLarge: L.layerGroup(), communes: L.layerGroup(), jeu: null, emprise: null, controleur: null };
  [[FR.d, "departement"], [FR.r, "region"]].forEach(([donnees, niveau]) =>
    tracerLimite(etat.vueLarge, niveau, (style) => L.geoJSON(donnees, { style, interactive: false })));
  limites = etat;
  carte.on("moveend", majLimites);
  majLimites();
}

function majLimites() {
  const etat = limites;
  if (!etat || !carte) return;
  const montrer = (couche, oui) => (oui ? couche.addTo(carte) : couche.remove());
  if (carte.getZoom() < ZOOM_COMMUNES) {
    montrer(etat.communes, false);
    montrer(etat.vueLarge, true);
    return;
  }
  // Tant que les premières communes ne sont pas arrivées, la vue large reste affichée.
  montrer(etat.communes, Boolean(etat.jeu));
  montrer(etat.vueLarge, !etat.jeu);
  const jeu = carte.getZoom() >= ZOOM_COMMUNES_DETAILLEES ? "ADMINEXPRESS-COG-CARTO.LATEST" : "ADMINEXPRESS-COG-CARTO-PE.LATEST";
  const vue = carte.getBounds();
  if (etat.jeu === jeu && etat.emprise.contains(vue)) return; // déjà chargé
  if (etat.controleur) etat.controleur.abort();
  const controleur = new AbortController();
  etat.controleur = controleur;
  const emprise = vue.pad(0.2); // une marge autour de la vue : un petit déplacement ne relance pas la requête
  fetch(urlCommunes(jeu, emprise), { signal: controleur.signal })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`WFS ${r.status}`))))
    .then((geojson) => {
      if (limites !== etat || etat.controleur !== controleur) return; // la carte a changé entre-temps
      const lignes = limitesDepuisCommunes(geojson);
      etat.communes.clearLayers();
      ["commune", "departement", "region"].forEach((niveau) => {
        if (lignes[niveau].length) tracerLimite(etat.communes, niveau, (style) => L.polyline(lignes[niveau], style));
      });
      Object.assign(etat, { jeu, emprise, controleur: null });
      majLimites();
    })
    .catch(() => {}); // service indisponible ou requête annulée : la carte reste utilisable sans les communes
}

/* ---------- Éléments HTML ---------- */

// Rond pour une alternance, carré pour une formation, avec le numéro chronologique.
function forme(p) {
  return `<span class="forme ${p.kind}">${numero(p.id)}</span>`;
}

// Logo de la structure dans un cadre blanc, ou le numéro du lieu s'il n'y a pas de logo.
function logoOuNumero(p) {
  return LOGOS[p.id] ? `<span class="logo-lieu"><img src="${LOGOS[p.id]}" alt="${p.org}"></span>` : forme(p);
}

function fiche(p) {
  const lien = p.project ? `<a class="go" href="#${p.project}">Voir la page du projet →</a>` : "";
  return `<button class="x" type="button" data-fermer aria-label="Fermer">×</button>
    <div class="fiche-entete">${logoOuNumero(p)}<div><b>${p.org}</b><span>${p.city}, ${p.dates}</span></div></div>
    <p class="fiche-role">${p.role}</p>
    <ul>${p.missions.map((m) => `<li>${m}</li>`).join("")}</ul>
    ${lien}`;
}

function pageParcours() {
  const antechronologique = [...ORDRE].reverse().map(lieu);
  return `<div class="wrap"><section class="bloc">
    <h1 class="titre-page">Parcours</h1>
    <p class="chapo">Six lieux entre 2019 et 2026, numérotés dans l'ordre chronologique. Cliquez sur un lieu pour voir ce que j'y ai fait, et changez de fond de carte avec les boutons au-dessus de la carte.</p>
    <!-- Sur grand écran, la liste des lieux se range à droite de la carte (voir .parcours-grille) -->
    <div class="parcours-grille">
    <figure class="planche">
      <div class="planche-titre">
        <span>Lieux de formation et d'alternance, 2019-2026</span>
        <button class="planche-bouton" id="resetbtn" type="button">Vue d'ensemble</button>
      </div>
      <div class="planche-fonds" role="group" aria-label="Fond de carte">
        <span>Fond</span>
        ${Object.entries(FONDS).map(([id, f]) => `<button type="button" data-fond="${id}" aria-pressed="${id === fondActif}">${f.nom}</button>`).join("")}
      </div>
      <div class="mapstage">
        <div id="map" aria-label="Carte des lieux de formation et d'alternance"></div>
        <svg class="nord" viewBox="0 0 24 40" role="img" aria-label="Nord"><path d="M12 2 L18 24 L12 19 L6 24 Z"/><text x="12" y="37">N</text></svg>
        <div class="legende">
          <b>Légende</b>
          <span><i class="forme pro"></i>Alternance</span>
          <span><i class="forme edu"></i>Formation</span>
          <span class="legende-note">1 à 6 : ordre chronologique</span>
        </div>
        <div class="mapcard" id="mapcard" hidden></div>
      </div>
    </figure>
    <!-- Frise des six lieux, du plus récent au plus ancien : chaque étape porte le même symbole
         numéroté que sur la carte ; un clic l'ouvre sur la carte (voir « Interactions »). -->
    <div class="frise-bloc">
      <p class="frise-titre">Du plus récent au plus ancien</p>
      <ol class="frise">${antechronologique.map((p) => `
        <li><button type="button" class="place ${p.kind}" data-place="${p.id}">
          <span class="frise-noeud">${forme(p)}</span>
          <span class="frise-carte">
            <span class="frise-haut"><span class="dates">${p.dates}</span><span class="kind ${p.kind}">${p.kind === "pro" ? "Alternance" : "Formation"}</span></span>
            <span class="frise-org">${LOGOS[p.id] ? `<span class="logo-lieu"><img src="${LOGOS[p.id]}" alt=""></span>` : ""}
              <span><b>${p.org}</b><span class="where">${p.city}</span></span></span>
            <span class="rl">${p.role}</span>
          </span>
        </button></li>`).join("")}
      </ol>
    </div>
    </div>
  </section>
  ${sectionFormations() /* défini dans app.js */}
  </div>`;
}

/* ---------- Carte ---------- */

// vue : { centre, zoom, molette } quand la carte est reconstruite pour changer de fond.
// (Appelée sans vue à l'ouverture de la page : requestAnimationFrame lui passe alors un nombre.)
function initCarte(vue) {
  const reconstruction = Boolean(vue && vue.centre);
  if (!reconstruction) lieuActif = null;
  fermerCarte();
  marqueurs = {};
  regions = {};
  const conteneur = document.getElementById("map");
  if (!conteneur || !window.L) return;
  const fond = FONDS[fondActif];
  const tuiles = Boolean(fond.tuiles);

  carte = L.map(conteneur, {
    crs: tuiles ? L.CRS.EPSG3857 : CRS_LAMBERT93,
    renderer: L.svg({ padding: 2.5 }), // marge de rendu : évite les bords vides pendant les déplacements animés
    zoomSnap: 0.25,
    minZoom: 4.25,
    maxZoom: tuiles ? 18 : 11, // les tuiles permettent de zoomer jusqu'à la rue
    scrollWheelZoom: false, // activé au premier clic, pour ne pas bloquer le défilement de la page
    zoomControl: false,
    maxBounds: [[39.5, -9], [52.5, 13]],
    dragging: SURVOL_POSSIBLE || !L.Browser.mobile,
  });
  carte.attributionControl.setPrefix(false); // seulement les crédits des données
  L.control.zoom({ position: "bottomright", zoomInTitle: "Zoom avant", zoomOutTitle: "Zoom arrière" }).addTo(carte);
  L.control.scale({ position: "bottomright", imperial: false, maxWidth: 120 }).addTo(carte);
  if (reconstruction) carte.setView(vue.centre, vue.zoom, { animate: false });
  else carte.fitBounds(EMPRISE_FRANCE, MARGES_ENSEMBLE);
  if (reconstruction && vue.molette) carte.scrollWheelZoom.enable();
  else conteneur.addEventListener("click", () => carte && carte.scrollWheelZoom.enable(), { once: true });
  conteneur.dataset.fond = fondActif;

  if (tuiles) {
    L.tileLayer(fond.tuiles, { maxZoom: 18, attribution: fond.credit }).addTo(carte);
    carte.attributionControl.addAttribution(`Limites : ${SOURCE_IGN}, Admin Express`);
    initLimites();
  } else {
    carte.attributionControl.addAttribution(fond.credit);
    // Fond : aplat des régions (pour mettre en valeur la région du lieu choisi), limites des
    // départements, puis limites des régions et contour du pays par-dessus.
    L.geoJSON(FR.r, {
      style: { stroke: false, fillColor: COULEURS.region, fillOpacity: 1 },
      interactive: false,
      onEachFeature: (f, couche) => (regions[f.properties.nom] = couche),
    }).addTo(carte);
    L.geoJSON(FR.d, { style: { color: "#D5DBE1", weight: 0.6, fill: false }, interactive: false }).addTo(carte);
    L.geoJSON(FR.r, { style: { color: "#9FAAB6", weight: 1, fill: false }, interactive: false }).addTo(carte);
    L.geoJSON(FR.o, { style: { color: "#5E6B78", weight: 1.3, fill: false }, interactive: false }).addTo(carte);

    // Noms des régions et des villes de repère (les fonds en tuiles ont déjà les leurs).
    // zIndexOffset négatif : ils restent sous les symboles des lieux.
    const etiquette = (classe) => ([nom, lat, lon]) =>
      L.marker([lat, lon], { interactive: false, keyboard: false, zIndexOffset: -1000, icon: L.divIcon({ className: classe, html: `<span>${nom}</span>`, iconSize: [0, 0] }) }).addTo(carte);
    ETIQUETTES_REGIONS.forEach(etiquette("rlabel"));
    VILLES.forEach(etiquette("clabel"));
  }

  // Symboles des lieux. Saint-Denis et Paris sont trop proches pour être lisibles à l'échelle
  // de la France : leur symbole est décalé (champ off) et relié au point exact par un trait.
  PLACES.forEach((p) => {
    const facteur = innerWidth < 680 ? 0.55 : 0.75;
    const dx = Math.round(p.off[0] * facteur);
    const dy = Math.round(p.off[1] * facteur);
    const renvoi = dx || dy
      ? `<svg class="renvoi" width="1" height="1"><line x1="0" y1="0" x2="${dx}" y2="${dy}"/></svg><span class="point-exact"></span>`
      : "";
    const html = `<div class="lieu ${p.kind}" style="--dx:${dx}px;--dy:${dy}px">${renvoi}
      <div class="lieu-symbole">${forme(p)}<span class="lieu-nom">${p.city.split(" (")[0]}</span></div></div>`;
    const marqueur = L.marker(p.ll, {
      icon: L.divIcon({ className: "lieu-icone", html, iconSize: [0, 0] }),
      riseOnHover: true,
      keyboard: true,
      title: `${numero(p.id)}. ${p.org}`,
      alt: p.org,
    }).addTo(carte);
    marqueur.on("mouseover", () => surligner(p.id, true));
    marqueur.on("mouseout", () => surligner(p.id, false));
    marqueur.on("click", () => choisir(p.id, true));
    marqueurs[p.id] = marqueur;
  });

  // Les noms de villes de repère n'apparaissent qu'en zoomant (voir carte.css).
  const majNiveau = () => {
    const z = carte.getZoom();
    conteneur.dataset.z = z < 6.5 ? "low" : z > 7.5 ? "high" : "mid";
  };
  carte.on("zoomend", majNiveau);
  majNiveau();
}

// Change de fond en gardant la vue et la fiche ouverte.
function changerFond(id) {
  if (!FONDS[id] || id === fondActif) return;
  fondActif = id;
  document.querySelectorAll("[data-fond]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fond === id)));
  if (!carte) return;
  const ouvert = lieuActif;
  initCarte({ centre: carte.getCenter(), zoom: carte.getZoom(), molette: carte.scrollWheelZoom.enabled() });
  if (ouvert) choisir(ouvert, false);
}

function fermerCarte() {
  if (limites && limites.controleur) limites.controleur.abort();
  limites = null;
  if (carte) {
    carte.remove();
    carte = null;
  }
}

// Centre la carte sur un lieu en tenant compte de la fiche affichée à droite.
function centrerSur(ll, zoom, duree) {
  const options = { duration: MOINS_D_ANIMATIONS ? 0 : duree };
  if (carte.getContainer().clientWidth < 680) return carte.flyTo(ll, zoom, options);
  const point = carte.project(ll, zoom).add([(370 - 40) / 2, 0]);
  carte.flyTo(carte.unproject(point, zoom), zoom, options);
}

function elementMarqueur(id) {
  const m = marqueurs[id];
  return m && m.getElement() && m.getElement().querySelector(".lieu");
}

function surligner(id, actif) {
  const el = elementMarqueur(id);
  if (el) el.classList.toggle("hot", actif);
}

function choisir(id, deplacer) {
  const p = lieu(id);
  if (!p || !carte) return;
  lieuActif = id;
  Object.values(regions).forEach((r) => r.setStyle({ fillColor: COULEURS.region }));
  if (regions[p.region]) regions[p.region].setStyle({ fillColor: COULEURS.regionActive });
  PLACES.forEach((q) => {
    const el = elementMarqueur(q.id);
    if (el) el.classList.toggle("actif", q.id === id);
  });
  document.querySelectorAll(".place").forEach((b) => b.classList.toggle("on", b.dataset.place === id));
  if (deplacer) centrerSur(p.ll, id === "p8" || id === "mca" ? 9.5 : 8, 1.2);
  const carteFiche = document.getElementById("mapcard");
  carteFiche.hidden = false;
  carteFiche.innerHTML = fiche(p);
}

function fermerFiche() {
  const carteFiche = document.getElementById("mapcard");
  if (carteFiche) carteFiche.hidden = true;
  lieuActif = null;
  Object.values(regions).forEach((r) => r.setStyle({ fillColor: COULEURS.region }));
  document.querySelectorAll(".lieu.actif").forEach((el) => el.classList.remove("actif"));
  document.querySelectorAll(".place").forEach((b) => b.classList.remove("on"));
}

function vueEnsemble() {
  fermerFiche();
  if (carte) carte.flyToBounds(EMPRISE_FRANCE, { ...MARGES_ENSEMBLE, duration: MOINS_D_ANIMATIONS ? 0 : 1 });
}

/* ---------- Interactions ---------- */

document.addEventListener("click", (e) => {
  if (e.target.closest("#resetbtn")) vueEnsemble();
  const boutonFond = e.target.closest("[data-fond]");
  if (boutonFond) changerFond(boutonFond.dataset.fond);
  if (e.target.closest("[data-fermer]")) fermerFiche();
  const carteLieu = e.target.closest(".place");
  if (carteLieu) {
    choisir(carteLieu.dataset.place, true);
    document.querySelector(".planche").scrollIntoView({ behavior: MOINS_D_ANIMATIONS ? "auto" : "smooth", block: "center" });
  }
});
document.addEventListener("mouseover", (e) => {
  const carteLieu = e.target.closest && e.target.closest(".place");
  if (carteLieu && SURVOL_POSSIBLE) surligner(carteLieu.dataset.place, true);
});
document.addEventListener("mouseout", (e) => {
  const carteLieu = e.target.closest && e.target.closest(".place");
  if (carteLieu && SURVOL_POSSIBLE) surligner(carteLieu.dataset.place, false);
});
