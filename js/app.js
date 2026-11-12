/* Pages du site et navigation.
   Le site tient sur une seule page HTML : le contenu de <main> est régénéré
   à chaque changement d'ancre (#projets, #contact, #hub-pnr…). */

/* ---------- Textes à compléter ---------- */

// En local, on montre les [[...]] ; en ligne, on les masque.
// Ajouter ?en-ligne à l'adresse pour prévisualiser la version publique.
const MODE_LOCAL =
  (location.protocol === "file:" || ["localhost", "127.0.0.1", ""].includes(location.hostname)) &&
  !new URLSearchParams(location.search).has("en-ligne");

const A_COMPLETER = /\[\[(.+?)\]\]/g;

// Renvoie le texte prêt à afficher, ou null s'il doit être masqué.
function texte(t) {
  if (!t || !t.includes("[[")) return t;
  if (!MODE_LOCAL) return null;
  return t.replace(A_COMPLETER, '<mark class="todo">$1</mark>');
}

function textes(liste) {
  return (liste || []).map(texte).filter(Boolean);
}

function paragraphes(liste) {
  return textes(liste).map((t) => `<p>${t}</p>`).join("");
}

/* ---------- Carte de situation des projets ---------- */

// Projection équirectangulaire corrigée par le cosinus de la latitude moyenne :
// largement suffisant pour situer un point sur une vignette.
// Chaque fond : coin haut gauche (lonMin, latMax), unités SVG par degré,
// latitude moyenne, taille du cadre SVG et anneaux du contour.
const FONDS_SITUATION = {
  france: {
    lonMin: -5.3, latMax: 51.2, echelle: 20, latMoy: 46.5, largeur: 207, hauteur: 200,
    anneaux: () => FR.o.geometries.flatMap((g) => (g.type === "MultiPolygon" ? g.coordinates.flat() : g.coordinates)),
  },
  burkina: {
    lonMin: -5.67, latMax: 15.23, echelle: 25, latMoy: 12.2, largeur: 201, hauteur: 150,
    anneaux: () => BF, // défini dans fond-carte-burkina.js
  },
};
const cheminsSituation = {};

function projeterSituation(fond, lon, lat) {
  const cosLat = Math.cos((fond.latMoy * Math.PI) / 180);
  return [(lon - fond.lonMin) * cosLat * fond.echelle, (fond.latMax - lat) * fond.echelle];
}

function contourSituation(nom) {
  if (cheminsSituation[nom]) return cheminsSituation[nom];
  const fond = FONDS_SITUATION[nom];
  cheminsSituation[nom] = fond.anneaux()
    .map((anneau) => "M" + anneau.map(([lon, lat]) => projeterSituation(fond, lon, lat).map((v) => v.toFixed(1)).join(" ")).join("L") + "Z")
    .join("");
  return cheminsSituation[nom];
}

// Sans coordonnées (p.ll), c'est tout le territoire qui est mis en évidence.
function carteSituation(p) {
  const nom = p.situation || "france";
  const fond = FONDS_SITUATION[nom];
  const cadre = `<svg class="situation" viewBox="0 0 ${fond.largeur} ${fond.hauteur}" role="img" aria-label="Localisation : ${p.lieu}">`;
  if (!p.ll) {
    return `${cadre}
      <path class="territoire" d="${contourSituation(nom)}"/>
      <text x="${fond.largeur / 2}" y="${fond.hauteur / 2 + 5}" text-anchor="middle">${p.lieu}</text>
    </svg>`;
  }
  const [x, y] = projeterSituation(fond, p.ll[1], p.ll[0]);
  const ville = p.lieu.replace(/\s*\(.*\)$/, "");
  const aDroite = x < fond.largeur / 2;
  return `${cadre}
    <path d="${contourSituation(nom)}"/>
    <circle class="halo" cx="${x}" cy="${y}" r="10"/>
    <circle class="point" cx="${x}" cy="${y}" r="4.5"/>
    <text x="${x + (aDroite ? 14 : -14)}" y="${y + 4.5}" text-anchor="${aDroite ? "start" : "end"}">${ville}</text>
  </svg>`;
}

/* ---------- Composants ---------- */

function carteProjet(p) {
  let image = "";
  const photo = p.couverture || p.vignette;
  // Avec un fond (cas d'un logo), l'image est affichée entière sur ce fond au lieu d'être recadrée.
  const fond = photo && photo.fond ? ` style="background:${photo.fond}"` : "";
  if (photo) image = `<img src="${photo.src}" alt="${photo.fond ? photo.legende || "" : ""}" loading="lazy"${photo.fond ? ' class="contenir"' : ""}>`;
  else if (p.ll || p.situation) image = carteSituation(p);
  return `<a class="projet" href="#${p.id}">
    <div class="projet-image"${fond}>${image}</div>
    <div class="projet-texte">
      <span class="projet-cadre">${logoProjet(p)}${p.cadre}, ${p.periode.toLowerCase()}${
        p.statut ? `<span class="statut ${p.statut.classe}">${p.statut.libelle}</span>` : ""
      }</span>
      <h3>${p.titreCourt}</h3>
      <p>${p.resume}</p>
      <span class="projet-lien">Lire le projet</span>
    </div>
  </a>`;
}

/* Bloc « Langues » de la page d'accueil (données : PROFIL.langues).
   Le niveau CECRL est montré sur l'échelle complète A1 → C2, cases remplies jusqu'au niveau atteint. */
const ECHELLE_CECRL = ["A1", "A2", "B1", "B2", "C1", "C2"];

function sectionLangues() {
  const langue = (l) => {
    const rang = ECHELLE_CECRL.indexOf(l.cecrl);
    const echelle = rang < 0 ? "" : `
      <span class="echelle" role="img" aria-label="Niveau ${l.cecrl} sur l'échelle du CECRL, de A1 à C2">
        ${ECHELLE_CECRL.map((n, i) => `<span${i <= rang ? ' class="atteint"' : ""}>${n}</span>`).join("")}
      </span>`;
    const niveau = l.cecrl ? `<b>${l.cecrl}</b>, ${l.niveau}` : l.niveau;
    return `<li><span class="langue-nom">${l.langue}</span><span class="langue-niveau">${niveau}</span>${echelle}</li>`;
  };
  return `<div class="langues">
    <h3>Langues</h3>
    <ul class="langues-liste">${PROFIL.langues.map(langue).join("")}</ul>
    <p class="langues-note">Niveaux du Cadre européen commun de référence pour les langues (CECRL).</p>
  </div>`;
}

/* Recommandations (données : RECOMMANDATIONS). Sur l'accueil, avec un lien vers le projet ;
   sur la page d'un projet, sans ce lien. */
// Liens « Lire » (nouvel onglet) et « Télécharger » vers un document PDF.
// « Lire » s'ouvre dans la visionneuse (titre = sa légende) ; « Télécharger » enregistre le PDF original.
function liensPdf(src, texteLire, titre) {
  return `<span class="liens-pdf"><a href="${src}" target="_blank" rel="noopener" data-titre="${titre || texteLire}">${texteLire}</a><a href="${src}" download>Télécharger</a></span>`;
}

function recommandation(r, avecLienProjet) {
  const projet = avecLienProjet && PROJETS.find((p) => p.id === r.projet);
  const apercu = r.lettre && r.apercu
    ? `<a class="lettre-apercu" href="${r.lettre}" target="_blank" rel="noopener" title="Lire la lettre" data-titre="Lettre de recommandation de ${r.auteur} (${r.structure}), ${r.date}"><img src="${r.apercu}" alt="Première page de la lettre de ${r.auteur}" loading="lazy"></a>`
    : "";
  return `<figure class="recommandation">
    <blockquote><p>« ${r.extrait} »</p></blockquote>
    <figcaption>
      <div class="recommandation-auteur">
        <b>${r.auteur}</b>
        <span>${r.fonction}, ${r.structure}</span>
        <span>Lettre du ${r.date}</span>
        ${r.lettre ? liensPdf(r.lettre, "Lire la lettre", `Lettre de recommandation de ${r.auteur} (${r.structure}), ${r.date}`) : ""}
        ${projet ? `<a class="lien-projet" href="#${projet.id}">Voir le projet : ${projet.titreCourt.charAt(0).toLowerCase()}${projet.titreCourt.slice(1)} →</a>` : ""}
      </div>
      ${apercu}
    </figcaption>
  </figure>`;
}

function sectionRecommandations() {
  if (!RECOMMANDATIONS.length) return "";
  return `<section class="bloc">
    <h2>Recommandations</h2>
    <p class="chapo">Extraits des lettres de recommandation de mes tuteurs d'alternance. Les lettres originales sont à lire ou à télécharger en PDF.</p>
    <div class="recommandations">${RECOMMANDATIONS.map((r) => recommandation(r, true)).join("")}</div>
  </section>`;
}

/* Section « Savoir-être » de l'accueil (données : SAVOIR_ETRE). Chaque citation renvoie à la lettre d'où elle vient. */
function sectionSavoirEtre() {
  if (!SAVOIR_ETRE.length) return "";
  const qualite = (q) => {
    const r = RECOMMANDATIONS.find((x) => x.projet === q.lettre);
    const source = r ? `<a href="${r.lettre}" target="_blank" rel="noopener" data-titre="Lettre de recommandation de ${r.auteur} (${r.structure}), ${r.date}">${r.auteur}, ${r.structure}</a>` : "";
    return `<li><h3>${q.qualite}</h3><p>« ${q.extrait} »</p>${source}</li>`;
  };
  return `<section class="bloc">
    <h2>Savoir-être</h2>
    <p class="chapo">Ce que mes tuteurs d'alternance ont relevé dans leurs lettres de recommandation, avec leurs mots.</p>
    <ul class="savoir-etre">${SAVOIR_ETRE.map(qualite).join("")}</ul>
  </section>`;
}

/* Section « Centres d'intérêt » de l'accueil (données : CENTRES_INTERET). Chaque carte a une illustration
   dessinée en SVG / CSS, qui s'anime au survol (rien ne bouge si l'utilisateur a réduit les animations). */
const ILLUSTRATIONS_INTERETS = {
  // Une étagère : un livre par genre, de hauteurs et couleurs différentes
  lecture: () => `<div class="etagere">${[
    ["Thriller", 86, "#2F5D7C"], ["Policier", 72, "#8C3B3B"], ["Drame", 92, "#5B4A8A"],
    ["Poignant", 66, "#B7720E"], ["Dév. perso", 80, "#157A62"],
  ].map(([genre, h, c], i) => `<span style="--h:${h}%;--c:${c};--i:${i}">${genre}</span>`).join("")}</div>`,
  // Un ballon sur un demi-terrain, avec son ombre
  basket: () => `<svg class="terrain" viewBox="0 0 200 110" aria-hidden="true"><path d="M4 106V4h192v102M100 4v102"/><circle cx="100" cy="55" r="18"/><path d="M4 33h34v44H4M196 33h-34v44h34"/></svg>
    <span class="ombre-ballon"></span>
    <svg class="ballon" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44"/><path d="M6 50h88M50 6v88M20 18c15 13 15 51 0 64M80 18c-15 13-15 51 0 64"/></svg>`,
  // Une note (musique), un égaliseur de neuf barres et un micro (podcasts)
  musique: () => `<svg class="note" viewBox="0 0 40 50" aria-hidden="true"><path d="M14 40V8l22-5v31"/><ellipse cx="9" cy="40" rx="7" ry="5.5"/><ellipse cx="31" cy="35" rx="7" ry="5.5"/></svg>
    <div class="egaliseur">${[45, 75, 55, 95, 65, 85, 40, 70, 50].map((h, i) => `<i style="--h:${h}%;--d:${(i % 4) * -0.18}s"></i>`).join("")}</div>
    <svg class="micro" viewBox="0 0 40 56" aria-hidden="true"><rect x="12" y="2" width="16" height="30" rx="8"/><path d="M5 24a15 15 0 0 0 30 0M20 39v10M11 52h18"/></svg>`,
  // Un itinéraire en pointillés entre trois repères (clin d'œil de géomaticien)
  decouvertes: () => `<svg class="itineraire" viewBox="0 0 220 120" aria-hidden="true">
      <path class="trace" d="M30 98C60 42 90 112 112 72S170 32 190 54"/>
      ${[[30, 98, "Rencontres", "start"], [112, 72, "Activités", "middle"], [190, 54, "Et ensuite ?", "end"]]
        .map(([x, y, txt, ancre], i) => `<g class="repere r${i}"><path d="M${x} ${y}c-7-9-11-14-11-19a11 11 0 0 1 22 0c0 5-4 10-11 19z"/><circle cx="${x}" cy="${y - 19}" r="4"/>
          <text x="${x + (ancre === "start" ? -12 : ancre === "end" ? 12 : 0)}" y="${y - 36}" text-anchor="${ancre}">${txt}</text></g>`).join("")}
    </svg>`,
};

function sectionInterets() {
  if (!CENTRES_INTERET.length) return "";
  const carte = (c) => `<li class="interet interet-${c.id}">
      <div class="interet-illu" aria-hidden="true">${(ILLUSTRATIONS_INTERETS[c.id] || (() => ""))()}${c.badge ? `<b class="interet-badge">${c.badge}</b>` : ""}</div>
      <h3>${c.titre}</h3>
      <p>${c.texte}</p>
    </li>`;
  return `<section class="bloc">
    <h2>Centres d'intérêt</h2>
    <p class="chapo">Ce que je fais quand je ne suis pas devant une carte.</p>
    <ul class="interets">${CENTRES_INTERET.map(carte).join("")}</ul>
  </section>`;
}

/* Section « Formation » de la page Parcours (données : FORMATIONS dans donnees.js). */
function sectionFormations() {
  const formation = (f) => {
    const projet = f.projet && PROJETS.find((p) => p.id === f.projet);
    const lienProjet = projet ? ` <a href="#${projet.id}">Voir le projet →</a>` : "";
    const detail = texte(f.validationDetail);
    // Sur grand écran : présentation et validation à gauche, contenu de la formation à droite
    return `<article class="formation">
      <div class="formation-gauche">
        <h3>${f.titre}</h3>
        <p class="formation-meta">${f.organisme}, ${f.periode}</p>
        ${f.certification ? `<p>${f.certification} ${f.alternance || ""}</p>` : ""}
        ${f.obtenu ? `<p class="formation-obtenu">${f.obtenu}</p>` : ""}
        ${f.validation ? `<p>${f.validation}${lienProjet}</p>` : ""}
        ${detail ? `<p>${detail}</p>` : ""}
        <p class="formation-liens">${f.liens.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.texte} ↗</a>`).join("")}</p>
      </div>
      <div class="formation-droite">
        <p class="formation-intro">${f.intro}</p>
        <dl class="formation-contenu">${f.contenu.map(([intitule, detail, certificat]) => `<div><dt>${intitule}</dt><dd>${detail}</dd>${
          certificat ? `<dd class="formation-certificat">${liensPdf(certificat, "Voir le certificat", `Certificat de compétences : ${intitule}`)}</dd>` : ""
        }</div>`).join("")}</dl>
      </div>
    </article>`;
  };
  return `<section class="bloc formations">
    <h2>Formation</h2>
    <p class="chapo">Des études de géographie à l'université, puis deux titres de géomatique préparés en alternance à l'IDGEO.</p>
    ${FORMATIONS.map(formation).join("")}
  </section>`;
}

// Logo de la structure ou de la marque du projet (champ logo de donnees.js), vide s'il n'y en a pas.
function logoProjet(p) {
  if (!p.logo) return "";
  return `<img class="logo-projet${p.logo.surBlanc ? " sur-blanc" : ""}" src="${p.logo.src}" alt="${p.logo.nom}" title="${p.logo.nom}">`;
}

function visuel(v) {
  if (typeof v === "string") {
    const t = texte(v);
    return t ? `<div class="visuel-a-ajouter">Image à ajouter : ${t}</div>` : "";
  }
  // Un clic sur l'image l'ouvre en taille réelle (utile pour lire les cartes).
  // format "telephone" : capture en portrait, affichée en colonne étroite à côté des autres.
  return `<figure${v.format === "telephone" ? ' class="telephone"' : ""}><a href="${v.src}" target="_blank" rel="noopener"><img src="${v.src}" alt="${v.legende}" loading="lazy"></a><figcaption>${v.legende}</figcaption></figure>`;
}

// Vitrine des captures de téléphone (visuels au format "telephone") : les écrans alignés dans un cadre
// de téléphone, numérotés avec un titre court, puis les légendes complètes en liste numérotée.
function galerieTelephones(liste) {
  if (!liste.length) return "";
  const ecran = (v, i) => `<li>
      <a class="tel-cadre" href="${v.src}" target="_blank" rel="noopener" title="Agrandir">
        <i class="tel-num">${i + 1}</i>
        <img src="${v.src}" alt="${v.titre ? `${v.titre} : ` : ""}${v.legende}" loading="lazy">
      </a>
      ${v.titre ? `<span class="tel-titre">${v.titre}</span>` : ""}
    </li>`;
  const legende = (v, i) => `<li><i>${i + 1}</i><p>${v.titre ? `<b>${v.titre}.</b> ` : ""}${v.legende}</p></li>`;
  return `<div class="galerie-tel">
    <ol class="tel-ecrans">${liste.map(ecran).join("")}</ol>
    <ol class="tel-legendes">${liste.map(legende).join("")}</ol>
  </div>`;
}

// Galeries séparées d'un projet (champ galeries) : une section par galerie, avec son titre et son intro.
//   format "ecran" : chaque capture dans une fenêtre de navigateur, sur deux colonnes ;
//   format "carte" : chaque carte présentée comme une planche imprimée, en grille.
function galerieSection(g) {
  if (!g.images || !g.images.length) return "";
  const ecran = (im) => `<figure class="ecran">
      <a class="ecran-fenetre" href="${im.src}" target="_blank" rel="noopener" title="Agrandir">
        <span class="ecran-barre" aria-hidden="true"><i></i><i></i><i></i><span>${im.titre || ""}</span></span>
        <img src="${im.src}" alt="${im.titre ? `${im.titre} : ` : ""}${im.legende}" loading="lazy">
      </a>
      <figcaption>${im.legende}</figcaption>
    </figure>`;
  const carte = (im) => `<figure class="carte-planche">
      <a class="carte-papier" href="${im.src}" target="_blank" rel="noopener" title="Ouvrir la carte en grand">
        <img src="${im.vignette || im.src}" alt="${im.titre ? `${im.titre} : ` : ""}${im.legende}" loading="lazy">
      </a>
      <figcaption>${im.titre ? `<b>${im.titre}</b>` : ""}<span>${im.legende}</span></figcaption>
    </figure>`;
  const contenu = g.format === "carte"
    ? `<div class="galerie-cartes">${g.images.map(carte).join("")}</div>`
    : g.format === "planche"   // schémas (MCD, MPD…) : présentation papier, en colonnes pour des hauteurs différentes
      ? `<div class="galerie-planches">${g.images.map(carte).join("")}</div>`
      : `<div class="galerie-ecrans">${g.images.map(ecran).join("")}</div>`;
  return `<section class="galerie"><h2>${g.titre}</h2>${g.intro ? `<p class="galerie-intro">${g.intro}</p>` : ""}${contenu}</section>`;
}

/* Page « Cartothèque » : toutes les cartes du portfolio au même endroit.
   Elles viennent des projets (galeries au format "carte", atlas des ZAEnR) et de la liste CARTES
   (nouvelles cartes). Les boutons filtrent par série ; un clic ouvre la carte dans la visionneuse. */
function cartesDuPortfolio() {
  const cartes = [];
  PROJETS.forEach((p) => {
    (p.galeries || []).filter((g) => g.format === "carte").forEach((g) =>
      g.images.forEach((im) => cartes.push({ ...im, serie: p.titreCourt, projet: p.id })));
    (p.atlas || []).forEach((pl) => cartes.push({
      src: pl.src, vignette: pl.vignette,
      titre: `${pl.commune} : ${pl.type.toLowerCase()}`,
      legende: "Planche de l'atlas des zones d'accélération des énergies renouvelables remis aux communes.",
      serie: p.titreCourt, projet: p.id,
    }));
  });
  return cartes.concat(CARTES.map((c) => ({ serie: "Cartes personnelles", ...c })));
}

function pageCartotheque() {
  const cartes = cartesDuPortfolio();
  const series = [...new Set(cartes.map((c) => c.serie))];
  const boutons = series.length < 2 ? "" : `<div class="filtres-enr" role="group" aria-label="Filtrer les cartes par série">
    <button type="button" data-filtre-enr="" aria-pressed="true">Toutes <span>${cartes.length}</span></button>
    ${series.map((s) => `<button type="button" data-filtre-enr="${s}" aria-pressed="false">${s} <span>${cartes.filter((c) => c.serie === s).length}</span></button>`).join("")}
  </div>`;
  const carte = (c) => {
    const projet = c.projet && PROJETS.find((p) => p.id === c.projet);
    return `<figure class="carte-planche" data-type-enr="${c.serie}">
      <a class="carte-papier" href="${c.src}" target="_blank" rel="noopener" title="Ouvrir la carte en grand"><img src="${c.vignette || c.src}" alt="${c.titre} : ${c.legende}" loading="lazy"></a>
      <figcaption><b>${c.titre}</b><span>${c.legende}${c.annee ? ` Carte réalisée en ${c.annee}.` : ""}</span>
        ${projet ? `<a class="carto-projet" href="#${projet.id}">Voir le projet : ${projet.titreCourt.charAt(0).toLowerCase()}${projet.titreCourt.slice(1)} →</a>` : ""}</figcaption>
    </figure>`;
  };
  return `<div class="wrap"><section class="bloc">
    <h1 class="titre-page">Cartothèque</h1>
    <p class="chapo">Les cartes présentées dans mes projets, réunies au même endroit. Cliquez sur une carte pour l'ouvrir en grand ; les boutons filtrent par projet.</p>
    <div class="atlas cartotheque">
      ${boutons}
      <div class="planches">${cartes.map(carte).join("")}</div>
    </div>
  </section></div>`;
}

// Planches de l'atlas des ZAEnR, regroupées par type d'énergie (ordre alphabétique),
// puis par commune. Un bouton par type permet de n'afficher que ses planches
// (le clic est géré plus bas, dans « Interactions »).
function atlasParType(planches) {
  if (!planches || !planches.length) return "";
  const types = [...new Set(planches.map((pl) => pl.type))].sort((a, b) => a.localeCompare(b, "fr"));
  const pastille = (type) => `<i class="pastille" style="background:${COULEURS_ENR[type] || "#9AA7B8"}"></i>`;
  const nombre = (type) => planches.filter((pl) => pl.type === type).length;

  const boutons = types.length < 2 ? "" : `<div class="filtres-enr" role="group" aria-label="Filtrer les planches par type d'énergie">
    <button type="button" data-filtre-enr="" aria-pressed="true">Tous <span>${planches.length}</span></button>
    ${types.map((t) => `<button type="button" data-filtre-enr="${t}" aria-pressed="false">${pastille(t)}${t} <span>${nombre(t)}</span></button>`).join("")}
  </div>`;

  const cartes = types
    .flatMap((t) => planches.filter((pl) => pl.type === t).sort((a, b) => a.commune.localeCompare(b.commune, "fr")))
    // Même présentation que les cartes d'exemple (planches imprimées : .carte-planche, .carte-papier)
    .map((pl) => `<figure class="carte-planche" data-type-enr="${pl.type}">
      <a class="carte-papier" href="${pl.src}" target="_blank" rel="noopener" title="Ouvrir la carte en grand"><img src="${pl.vignette || pl.src}" alt="Carte des zones d'accélération de ${pl.commune} : ${pl.type.toLowerCase()}" loading="lazy"></a>
      <figcaption><b>${pl.commune}</b><span>${pastille(pl.type)}${pl.type}</span></figcaption>
    </figure>`)
    .join("");

  return `<div class="atlas">
    <p class="galerie-intro">Quelques planches de l'atlas remis aux communes, une par type d'énergie. Les boutons filtrent les planches par type ; un clic sur une carte l'ouvre en grand.</p>
    ${boutons}
    <div class="planches">${cartes}</div>
  </div>`;
}

/* ---------- Pages ---------- */

const PAGES = {
  accueil() {
    return `
    <section class="hero">
      <canvas id="courbes" aria-hidden="true"></canvas>
      <div class="wrap hero-grille">
        <div>
          <h1>${PROFIL.nom}</h1>
          <p class="hero-poste">${PROFIL.poste}, formé en alternance à l'IDGEO (Bac+5)</p>
          <p class="hero-intro">Fraîchement diplômé de l'IDGEO et impatient de commencer ma carrière, je recherche un poste de géomaticien ou de technicien SIG.
            Mon métier consiste à transformer des données géographiques en outils utiles pour décider et aménager le territoire.
            Pendant mes alternances à la Région Nouvelle-Aquitaine, chez SNCF Réseau et à la Communauté de communes de l'Ouest Vosgien,
            j'ai surtout travaillé sur des bases PostGIS et sur l'automatisation des mises à jour de données.
            Mon projet de certification, une application web sur l'accessibilité des cheminements piétons, est <a href="#accessibilite">en ligne</a>.</p>
          <dl class="hero-infos">
            <div><dt>Disponibilité</dt><dd>${PROFIL.disponibilite}</dd></div>
            <div><dt>Secteur</dt><dd>${PROFIL.zone}</dd></div>
          </dl>
          <div class="boutons">
            <a class="btn principal" href="${PROFIL.cv}" download>Télécharger mon CV (PDF)</a>
            <a class="btn secondaire" href="#contact">Me contacter</a>
          </div>
        </div>
        <img class="hero-photo" src="${PROFIL.photo}" alt="Portrait d'${PROFIL.nom}">
      </div>
    </section>

    <div class="wrap">
      <section class="bloc">
        <div class="bloc-entete">
          <h2>Projets</h2>
          <a href="#projets">Voir les ${PROJETS.length} projets →</a>
        </div>
        <div class="grille-projets">${PROJETS.slice(0, 3).map(carteProjet).join("")}</div>
      </section>

      ${sectionRecommandations()}

      <section class="bloc">
        <h2>Compétences</h2>
        <div class="competences">
          ${COMPETENCES.map((c) => `
            <div>
              <h3>${c.titre}</h3>
              <dl>${c.lignes.map(([cat, outils]) => `<dt>${cat}</dt><dd>${outils}</dd>`).join("")}</dl>
            </div>`).join("")}
        </div>
        ${sectionLangues()}
      </section>

      ${sectionSavoirEtre()}

      ${sectionInterets()}
    </div>`;
  },

  projets() {
    const perso = PROJETS.filter((p) => p.perso);
    return `<div class="wrap"><section class="bloc">
      <h1 class="titre-page">Projets</h1>
      <p class="chapo">Quatre missions d'alternance et mon projet de certification à l'IDGEO.
        Chaque page présente le contexte, ce que j'ai fait et le résultat.</p>
      <div class="grille-projets">${PROJETS.filter((p) => !p.perso).map(carteProjet).join("")}</div>
    </section>
    ${perso.length ? `<section class="bloc">
      <h2>Projets personnels</h2>
      <p class="chapo">Des projets que je mène de mon côté, en dehors de l'alternance et de la formation.</p>
      <div class="grille-projets">${perso.map(carteProjet).join("")}</div>
    </section>` : ""}</div>`;
  },

  cartotheque() {
    return pageCartotheque();
  },

  parcours() {
    return pageParcours(); // défini dans carte.js
  },

  contact() {
    const tel = PROFIL.telephone.replace(/\s/g, "");
    return `<div class="wrap"><section class="bloc">
      <h1 class="titre-page">Contact</h1>
      <p class="chapo">Je cherche un poste de géomaticien, en Île-de-France ou ailleurs.
        Le plus simple est de m'écrire.</p>
      <dl class="coordonnees">
        <div><dt>E-mail</dt><dd><a id="email" href="mailto:${PROFIL.email}">${PROFIL.email}</a><button class="copier" type="button" data-copier="email">Copier</button></dd></div>
        <div><dt>Téléphone</dt><dd><a id="telephone" href="tel:${tel}">${PROFIL.telephone}</a><button class="copier" type="button" data-copier="telephone">Copier</button></dd></div>
        <div><dt>LinkedIn</dt><dd><a href="${PROFIL.linkedin}" target="_blank" rel="noopener">hermès-barry</a></dd></div>
        <div><dt>GitHub</dt><dd><a href="${PROFIL.github}" target="_blank" rel="noopener">Hermes-bit</a></dd></div>
        <div><dt>CV</dt><dd><a href="${PROFIL.cv}" download>Télécharger (PDF)</a></dd></div>
        <div><dt>Secteur</dt><dd>${PROFIL.zone}</dd></div>
      </dl>
    </section></div>`;
  },
};

function pageProjet(p) {
  const i = PROJETS.indexOf(p);
  const precedent = PROJETS[(i - 1 + PROJETS.length) % PROJETS.length];
  const suivant = PROJETS[(i + 1) % PROJETS.length];
  const section = (titre, contenu) => (contenu ? `<section><h2>${titre}</h2>${contenu}</section>` : "");
  // Les captures de téléphone vont dans la vitrine ; les autres images gardent la grille habituelle.
  const estTelephone = (v) => typeof v === "object" && v.format === "telephone";
  const visuels = (p.visuels || []).filter((v) => !estTelephone(v)).map(visuel).join("");
  const galerie = galerieTelephones((p.visuels || []).filter(estTelephone));
  const outils = textes(p.outils);
  const liens = (p.liens || [])
    .map((l) => `<a class="btn ${l === p.liens[0] ? "principal" : "secondaire"}" href="${l.url}" target="_blank" rel="noopener">${l.texte} ↗</a>`)
    .join("");
  const notes = (p.liens || []).filter((l) => l.note).map((l) => `<p class="note-lien">${l.note}</p>`).join("");

  return `
  <div class="entete-projet"><div class="wrap">
    <a class="retour" href="#projets">← Tous les projets</a>
    <h1>${p.titre}</h1>
    <dl class="infos-projet">
      <div><dt>Structure</dt><dd${p.logo ? ' class="avec-logo"' : ""}>${logoProjet(p)}${p.cadre}</dd></div>
      <div><dt>Rôle</dt><dd>${p.role}</dd></div>
      <div><dt>Période</dt><dd>${p.periode}</dd></div>
      <div><dt>Lieu</dt><dd>${p.lieu}</dd></div>
      ${p.statut ? `<div><dt>État</dt><dd class="statut ${p.statut.classe}">${p.statut.libelle}${p.statut.detail ? `, ${p.statut.detail}` : ""}</dd></div>` : ""}
    </dl>
    ${liens ? `<div class="boutons">${liens}</div>${notes}` : ""}
  </div></div>

  <!-- Sur grand écran : le récit à gauche, les outils et la recommandation dans une colonne à droite -->
  <div class="wrap contenu-projet">
    <div class="projet-principal">
      ${p.couverture ? visuel(p.couverture).replace("<figure>", '<figure class="couverture">') : ""}
      ${p.statut && p.statut.texte ? section("Où en est le projet", paragraphes(p.statut.texte)).replace("<section>", `<section class="etat-projet ${p.statut.classe}">`) : ""}
      ${section("Contexte", paragraphes(p.contexte))}
      ${section("Ce que j'ai fait", paragraphes(p.actions))}
      ${visuels ? `<div class="visuels">${visuels}</div>` : ""}
      ${galerie}
      ${(p.galeries || []).map(galerieSection).join("")}
      ${section("L'atlas des zones d'accélération", atlasParType(p.atlas))}
      ${section("Résultat", paragraphes(p.resultat))}
      ${section("Difficulté rencontrée", paragraphes(p.difficulte))}
    </div>
    <aside class="projet-cote">
      ${section("Outils", outils.length ? `<ul class="outils">${outils.map((o) => `<li>${o}</li>`).join("")}</ul>` : "")}
      ${section("Recommandation", RECOMMANDATIONS.filter((r) => r.projet === p.id).map((r) => recommandation(r, false)).join(""))}
    </aside>
    <nav class="projets-voisins" aria-label="Autres projets">
      <a href="#${precedent.id}"><span>← Projet précédent</span>${precedent.titreCourt}</a>
      <a href="#${suivant.id}"><span>Projet suivant →</span>${suivant.titreCourt}</a>
    </nav>
  </div>`;
}

/* ---------- Courbes de niveau du bandeau d'accueil ----------
   On fabrique un relief fictif (somme de quelques « bosses » gaussiennes),
   puis on trace ses isolignes avec l'algorithme des marching squares. */

function dessinerCourbes() {
  const canvas = document.getElementById("courbes");
  if (!canvas) return;
  const { width, height } = canvas.getBoundingClientRect();
  if (!width) return;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  // Générateur pseudo-aléatoire à graine fixe : le relief est le même à chaque visite.
  let graine = 11;
  const aleatoire = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const bosses = Array.from({ length: 7 }, () => ({
    x: width * (aleatoire() * 1.1 - 0.05),
    y: height * aleatoire(),
    rayon: 100 + aleatoire() * 200,
    hauteur: 0.6 + aleatoire(),
  }));
  const altitude = (x, y) =>
    bosses.reduce((z, b) => z + b.hauteur * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.rayon * b.rayon)), 0);

  // Altitude calculée aux nœuds d'une grille de PAS pixels.
  const PAS = 12;
  const nx = Math.ceil(width / PAS) + 2;
  const ny = Math.ceil(height / PAS) + 2;
  const grille = [];
  for (let j = 0; j < ny; j++) {
    grille[j] = [];
    for (let i = 0; i < nx; i++) grille[j][i] = altitude(i * PAS, j * PAS);
  }

  // Pour chaque niveau, chaque case de la grille est classée selon les coins
  // situés au-dessus du niveau (16 cas), ce qui donne le ou les segments à tracer.
  const niveaux = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2, 1.35];
  niveaux.forEach((niveau, n) => {
    const maitresse = n % 4 === 3; // une courbe sur quatre est plus marquée
    ctx.beginPath();
    ctx.lineWidth = maitresse ? 1.2 : 0.8;
    ctx.strokeStyle = maitresse ? "rgba(69,201,163,.30)" : "rgba(255,255,255,.07)";
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = grille[j][i], b = grille[j][i + 1], c = grille[j + 1][i + 1], d = grille[j + 1][i];
        const cas = (a > niveau ? 8 : 0) | (b > niveau ? 4 : 0) | (c > niveau ? 2 : 0) | (d > niveau ? 1 : 0);
        if (cas === 0 || cas === 15) continue;
        // Position du niveau sur chaque côté de la case (interpolation linéaire)
        const x = i * PAS, y = j * PAS, t = (p, q) => (niveau - p) / (q - p);
        const haut = [x + PAS * t(a, b), y];
        const droite = [x + PAS, y + PAS * t(b, c)];
        const bas = [x + PAS * t(d, c), y + PAS];
        const gauche = [x, y + PAS * t(a, d)];
        const segments = {
          1: [gauche, bas], 2: [bas, droite], 3: [gauche, droite], 4: [haut, droite],
          5: [gauche, haut, bas, droite], 6: [haut, bas], 7: [gauche, haut], 8: [gauche, haut],
          9: [haut, bas], 10: [haut, droite, gauche, bas], 11: [haut, droite], 12: [gauche, droite],
          13: [bas, droite], 14: [gauche, bas],
        }[cas];
        for (let k = 0; k < segments.length; k += 2) {
          ctx.moveTo(...segments[k]);
          ctx.lineTo(...segments[k + 1]);
        }
      }
    }
    ctx.stroke();
  });
}

/* ---------- Navigation ---------- */

const app = document.getElementById("app");

function afficher() {
  const id = location.hash.slice(1) || "accueil";
  const projet = PROJETS.find((p) => p.id === id);
  const page = projet ? "projets" : PAGES[id] ? id : "accueil";

  if (page !== "parcours") fermerCarte(); // libère la carte Leaflet si on quitte la page Parcours
  app.innerHTML = projet ? pageProjet(projet) : PAGES[page]();

  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === page) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.getElementById("menu").classList.remove("ouvert");
  document.getElementById("burger").setAttribute("aria-expanded", "false");
  document.title = projet ? `${projet.titreCourt} | ${PROFIL.nom}` : `${PROFIL.nom} | ${PROFIL.poste}`;
  window.scrollTo(0, 0);

  if (page === "accueil") requestAnimationFrame(dessinerCourbes);
  if (page === "parcours") requestAnimationFrame(initCarte);
}

function remplirPied() {
  document.getElementById("cv-entete").href = PROFIL.cv;
  document.getElementById("pied").innerHTML = `<div class="wrap">
    <span>© ${new Date().getFullYear()} ${PROFIL.nom}</span>
    <span class="pied-liens">
      <a href="mailto:${PROFIL.email}">${PROFIL.email}</a>
      <a href="${PROFIL.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
      <a href="${PROFIL.github}" target="_blank" rel="noopener">GitHub</a>
    </span>
  </div>`;
}

// Petit rappel visible uniquement en local : nombre de [[...]] restant à compléter.
function rappelLocal() {
  if (!MODE_LOCAL) return;
  // On parcourt tous les textes des données (les listes imbriquées commencent aussi par « [[ » en JSON).
  const chaines = (v) => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(chaines) : []);
  const restants = chaines([PROJETS, FORMATIONS]).filter((t) => t.includes("[[")).length;
  if (!restants) return;
  const div = document.createElement("div");
  div.className = "rappel-local";
  div.innerHTML = `${restants} passages à compléter dans <code>js/donnees.js</code> (surlignés en jaune).
    <a href="?en-ligne${location.hash}">Voir la version en ligne</a>
    <button type="button" aria-label="Masquer ce rappel">×</button>`;
  div.querySelector("button").addEventListener("click", () => div.remove());
  document.body.append(div);
}

/* ---------- Interactions ---------- */

document.addEventListener("click", (e) => {
  const bouton = e.target.closest("[data-copier]");
  if (bouton) {
    const valeur = document.getElementById(bouton.dataset.copier).textContent;
    const confirmer = (msg) => {
      bouton.textContent = msg;
      setTimeout(() => (bouton.textContent = "Copier"), 1600);
    };
    navigator.clipboard?.writeText(valeur).then(() => confirmer("Copié"), () => confirmer("Échec"));
  }
  // Atlas des ZAEnR : n'afficher que les planches du type choisi ("" = tous les types)
  const filtre = e.target.closest("[data-filtre-enr]");
  if (filtre) {
    const atlas = filtre.closest(".atlas");
    const type = filtre.dataset.filtreEnr;
    atlas.querySelectorAll("[data-filtre-enr]").forEach((b) => b.setAttribute("aria-pressed", b === filtre));
    atlas.querySelectorAll("[data-type-enr]").forEach((f) => (f.hidden = type !== "" && f.dataset.typeEnr !== type));
  }
  if (e.target.closest("#burger")) {
    const menu = document.getElementById("menu");
    menu.classList.toggle("ouvert");
    e.target.closest("#burger").setAttribute("aria-expanded", menu.classList.contains("ouvert"));
  }
});

let redimension;
window.addEventListener("resize", () => {
  clearTimeout(redimension);
  redimension = setTimeout(dessinerCourbes, 150);
});
window.addEventListener("hashchange", afficher);

// Pied de page fixe : sa hauteur (qui change si les liens passent sur deux lignes) est réservée en bas de la page.
const pied = document.getElementById("pied");
new ResizeObserver(() => document.documentElement.style.setProperty("--hauteur-pied", `${pied.offsetHeight}px`)).observe(pied);

// Bouton « revenir en haut » : visible dès qu'on a fait défiler la page de 400 px.
const boutonHaut = document.getElementById("haut");
window.addEventListener("scroll", () => (boutonHaut.hidden = window.scrollY < 400), { passive: true });
boutonHaut.addEventListener("click", () => {
  const doux = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: doux ? "smooth" : "auto" });
});

/* ---------- Visionneuse ----------
   Un clic sur une image ou un document du site (lien vers assets/…) l'ouvre ici, par-dessus le site assombri,
   au lieu d'un nouvel onglet. Les PDF (une page chacun) sont montrés par leur image « -page.jpg », générée
   à partir du PDF, car un PDF intégré ne s'affiche pas sur la plupart des téléphones ; le PDF original
   reste téléchargeable. Dans une galerie, les flèches (ou ← →) passent d'une image à l'autre.
   Les liens « Télécharger » (attribut download) ne sont pas concernés. */
const visionneuse = document.getElementById("visionneuse");
const V = (id) => document.getElementById(id);
const VISIONNABLE = /^assets\/.+\.(jpe?g|png|webp|gif|pdf)$/i;
const GROUPES = ".galerie-ecrans, .galerie-cartes, .galerie-planches, .tel-ecrans, .visuels, .planches, .formation-contenu, .recommandations, .savoir-etre";
let vListe = [], vIndex = 0, vDeclencheur = null;

const estVisionnable = (a) => a && !a.hasAttribute("download") && VISIONNABLE.test(a.getAttribute("href") || "");

// Légende : titre donné par le lien, sinon le texte alternatif de l'image (titre et légende), sinon la légende de la figure.
function infosLien(a) {
  const href = a.getAttribute("href");
  const pdf = /\.pdf$/i.test(href);
  const fc = a.closest("figure")?.querySelector("figcaption");
  const legendeFigure = fc && !a.closest(".recommandation")
    ? [...fc.childNodes].map((n) => n.textContent.trim()).filter(Boolean).join(" : ")
    : "";
  return {
    src: pdf ? href.replace(/\.pdf$/i, "-page.jpg") : href,
    pdf: pdf ? href : null,
    legende: a.dataset.titre || a.querySelector("img")?.alt || legendeFigure || "",
  };
}

function montrerImage() {
  const it = vListe[vIndex];
  visionneuse.classList.remove("zoome");
  V("v-img").src = it.src;
  V("v-img").alt = it.legende;
  V("v-texte").textContent = it.legende;
  V("v-compteur").textContent = vListe.length > 1 ? `${vIndex + 1} / ${vListe.length}` : "";
  V("v-actions").innerHTML = it.pdf ? `<a href="${it.pdf}" download>Télécharger le PDF</a>` : "";
  V("v-prec").hidden = V("v-suiv").hidden = vListe.length < 2;
}

function ouvrirVisionneuse(a) {
  // Les autres images de la même galerie (visibles : les filtres de l'atlas en masquent), sans doublon
  const groupe = a.closest(GROUPES);
  const liens = groupe ? [...groupe.querySelectorAll("a[href]")].filter((x) => estVisionnable(x) && x.getClientRects().length) : [a];
  const vus = new Set();
  vListe = liens.filter((x) => !vus.has(x.getAttribute("href")) && vus.add(x.getAttribute("href"))).map(infosLien);
  vIndex = Math.max(0, vListe.findIndex((it) => (it.pdf || it.src) === a.getAttribute("href")));
  vDeclencheur = a;
  montrerImage();
  document.documentElement.classList.add("v-ouverte");
  visionneuse.showModal();
}

const changerImage = (pas) => {
  if (vListe.length < 2) return;
  vIndex = (vIndex + pas + vListe.length) % vListe.length;
  montrerImage();
};

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!estVisionnable(a) || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  ouvrirVisionneuse(a);
});
V("v-fermer").addEventListener("click", () => visionneuse.close());
V("v-prec").addEventListener("click", () => changerImage(-1));
V("v-suiv").addEventListener("click", () => changerImage(1));
// Clic à côté de l'image (sur le fond assombri) : fermer
visionneuse.addEventListener("click", (e) => {
  if (e.target === visionneuse || e.target === V("v-scene")) visionneuse.close();
});
visionneuse.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") changerImage(-1);
  if (e.key === "ArrowRight") changerImage(1);
});
// Clic sur une grande image (carte, capture) : taille réelle, qu'on parcourt en faisant défiler ; second clic : retour
V("v-img").addEventListener("click", (e) => {
  const img = e.currentTarget, cadre = V("v-image");
  if (!visionneuse.classList.contains("zoome") && img.naturalWidth < img.clientWidth * 1.2) return;
  const rx = e.offsetX / img.clientWidth, ry = e.offsetY / img.clientHeight;
  visionneuse.classList.toggle("zoome");
  if (visionneuse.classList.contains("zoome")) {
    cadre.scrollLeft = rx * img.naturalWidth - cadre.clientWidth / 2;
    cadre.scrollTop = ry * img.naturalHeight - cadre.clientHeight / 2;
  }
});
visionneuse.addEventListener("close", () => {
  document.documentElement.classList.remove("v-ouverte");
  V("v-img").removeAttribute("src");           // arrête aussi les animations (démo Vision AR)
  vDeclencheur?.focus({ preventScroll: true });
});

remplirPied();
rappelLocal();
afficher();
