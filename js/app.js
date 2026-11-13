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

/* Rubrique « Recommandations » (page #recommandations) : chaque lettre en entier ou presque,
   avec la citation principale, les qualités qu'elle souligne (SAVOIR_ETRE), d'autres passages
   et la lettre originale à lire ou à télécharger. */
function pageRecommandations() {
  const lettre = (r) => {
    const lieu = PLACES.find((pl) => pl.project === r.projet);
    const projet = PROJETS.find((p) => p.id === r.projet);
    const qualites = SAVOIR_ETRE.filter((q) => q.lettre === r.projet);
    const titre = `Lettre de recommandation de ${r.auteur} (${r.structure}), ${r.date}`;
    const logo = lieu && LOGOS[lieu.id] ? `<span class="logo-lieu"><img src="${LOGOS[lieu.id]}" alt=""></span>` : "";
    return `<article class="lettre">
      <div class="lettre-texte">
        <header class="lettre-entete">${logo}
          <div><b>${r.auteur}</b><span>${r.fonction}</span><span>${r.structure}</span></div>
        </header>
        <blockquote class="lettre-citation"><p>${r.extrait}</p></blockquote>
        ${qualites.length ? `<div class="lettre-qualites"><h3>Ce que la lettre souligne</h3>
          <ul>${qualites.map((q) => `<li>${q.qualite}</li>`).join("")}</ul></div>` : ""}
        ${(r.passages || []).length ? `<div class="lettre-passages"><h3>Dans la lettre aussi</h3>
          ${r.passages.map((t) => `<blockquote><p>« ${t} »</p></blockquote>`).join("")}</div>` : ""}
        <p class="lettre-contexte">${lieu ? `${lieu.role}, ${lieu.org}, ${lieu.dates.charAt(0).toLowerCase()}${lieu.dates.slice(1)}. ` : ""}Lettre du ${r.date}.</p>
        ${projet ? `<a class="lien-projet" href="#${projet.id}">Voir le projet : ${projet.titreCourt.charAt(0).toLowerCase()}${projet.titreCourt.slice(1)} →</a>` : ""}
      </div>
      <div class="lettre-document">
        <a class="lettre-feuille" href="${r.lettre}" target="_blank" rel="noopener" title="Lire la lettre" data-titre="${titre}"><img src="${r.apercu}" alt="La lettre de ${r.auteur}" loading="lazy"></a>
        ${liensPdf(r.lettre, "Lire la lettre", titre)}
      </div>
    </article>`;
  };
  return `<div class="wrap"><section class="bloc">
    <a class="retour-page" href="#accueil" data-retour>← Retour</a>
    <h1 class="titre-page">Recommandations</h1>
    <p class="chapo">Mes deux tuteurs d'alternance ont écrit une lettre de recommandation. Voici ce qu'ils disent de mon travail, cité mot pour mot ; les lettres originales sont à lire ou à télécharger en PDF.</p>
    <div class="lettres">${RECOMMANDATIONS.map(lettre).join("")}</div>
  </section></div>`;
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

/* Vidéo de démonstration d'un projet (champ video) : le lecteur dans une fenêtre de navigateur,
   et un bouton par chapitre qui fait sauter la vidéo au bon moment (voir « Interactions »). */
function videoProjet(v) {
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const chapitres = (v.chapitres || []).map(([t, titre], i) =>
    `<li><button type="button" data-chapitre="${t}" aria-pressed="${i === 0}"><b>${mmss(t)}</b>${i + 1}. ${titre}</button></li>`).join("");
  return `<section class="galerie video-projet">
    <h2>La démo en vidéo</h2>
    ${v.intro ? `<p class="galerie-intro">${v.intro}</p>` : ""}
    <div class="ecran-fenetre video-fenetre">
      <span class="ecran-barre" aria-hidden="true"><i></i><i></i><i></i><span>${v.titre || ""}</span></span>
      <video controls preload="metadata" playsinline poster="${v.affiche || ""}" src="${v.src}" aria-label="${v.titre || "Vidéo de démonstration"}"></video>
    </div>
    ${chapitres ? `<ol class="chapitres" aria-label="Chapitres de la vidéo">${chapitres}</ol>` : ""}
  </section>`;
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
          <p class="hero-intro">Fraîchement diplômé de l'IDGEO et impatient de commencer ma carrière, je recherche un poste de géomaticien ou de chef de projet en géomatique.
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
        <div class="hero-portrait"><img class="hero-photo" src="${PROFIL.photo}" alt="Portrait d'${PROFIL.nom}"></div>
      </div>
    </section>

    <div class="wrap">
      <section class="bloc">
        <div class="bloc-entete">
          <h2>Projets</h2>
          <a href="#projets">Voir les ${PROJETS.length} projets →</a>
        </div>
        <div class="grille-projets vedette">${PROJETS.slice(0, 3).map(carteProjet).join("")}</div>
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

  recommandations() {
    return pageRecommandations();
  },

  contact() {
    const tel = PROFIL.telephone.replace(/\s/g, "");
    return `<div class="wrap"><section class="bloc">
      <h1 class="titre-page">Contact</h1>
      <p class="chapo">Je cherche un poste de géomaticien ou de chef de projet en géomatique, en Île-de-France ou ailleurs.
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

  // Mentions légales (LCEN, art. 6), lien dans le pied de page. Le site ne collecte aucune donnée :
  // côté RGPD, il suffit d'indiquer quels tiers voient passer l'adresse IP (hébergeur, fonds de carte au choix).
  "mentions-legales"() {
    const lien = (url, texte) => `<a href="${url}" target="_blank" rel="noopener">${texte}</a>`;
    return `<div class="wrap"><section class="bloc">
      <h1 class="titre-page">Mentions légales</h1>
      <p class="chapo">Qui édite ce site et qui l'héberge.</p>
      <div class="mentions">
        <section>
          <h2>Éditeur</h2>
          <p>Ce site est mon portfolio personnel, sans activité commerciale. J'en suis l'éditeur et le directeur de la publication.</p>
          <p><b>${PROFIL.nom}</b><br><a href="mailto:${PROFIL.email}">${PROFIL.email}</a></p>
        </section>
        <section>
          <h2>Hébergeur</h2>
          <p>Le site est hébergé par GitHub Pages, un service de&nbsp;:</p>
          <p><b>GitHub, Inc.</b><br>88 Colin P. Kelly Jr. Street<br>San Francisco, CA 94107, États-Unis<br>Téléphone&nbsp;: +1 877 448 4820<br>${lien("https://github.com", "github.com")}</p>
        </section>
        <section>
          <h2>Données personnelles</h2>
          <p>Ce site ne collecte aucune donnée personnelle&nbsp;: pas de cookie, pas de mesure d'audience, pas de formulaire.</p>
          <p>Seuls des tiers voient passer votre adresse IP&nbsp;: GitHub, qui héberge le site et la conserve pour des raisons de sécurité (${lien("https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement", "déclaration de confidentialité")}), et, si vous choisissez le fond OpenStreetMap ou un fond IGN sur la carte du parcours, les serveurs qui fournissent ces images et les limites administratives (Fondation OpenStreetMap, IGN).</p>
        </section>
        <section>
          <h2>Documents publiés</h2>
          <p>Les lettres de recommandation et les certificats sont publiés dans leur version originale. Si vous figurez dans l'un de ces documents et souhaitez qu'il soit modifié ou retiré, écrivez-moi&nbsp;: je le ferai sans délai.</p>
        </section>
        <section>
          <h2>Propriété intellectuelle</h2>
          <ul>
            <li>Les textes, les photos et mes cartes personnelles sont de moi. Merci de me demander avant de les reprendre.</li>
            <li>Les captures et les cartes réalisées pendant mes alternances, pour la Région Nouvelle-Aquitaine et la Communauté de communes de l'Ouest Vosgien, sont présentées comme références professionnelles. Ces structures en conservent les droits.</li>
            <li>Les logos et les marques appartiennent à leurs propriétaires. Ils servent seulement à identifier les structures où j'ai travaillé ou étudié.</li>
          </ul>
        </section>
        <section>
          <h2>Fonds de carte</h2>
          <p>La carte du parcours et les cartes de situation des projets sont dessinées à partir de&nbsp;:</p>
          <ul>
            <li>limites de la France (régions, départements, communes)&nbsp;: IGN, Admin Express (${lien("https://www.etalab.gouv.fr/licence-ouverte-open-licence/", "Licence Ouverte 2.0")})&nbsp;;</li>
            <li>contour du Burkina Faso&nbsp;: ${lien("https://www.geoboundaries.org/", "geoBoundaries")}, Banque mondiale (${lien("https://creativecommons.org/licenses/by/4.0/deed.fr", "CC BY 4.0")}).</li>
          </ul>
        </section>
      </div>
      <p class="maj">Mentions mises à jour le 12 novembre 2026.</p>
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
  const outils = textes(p.outils); // affichés en haut de la page, dans l'en-tête du projet
  const recommandations = RECOMMANDATIONS.filter((r) => r.projet === p.id).map((r) => recommandation(r, false)).join("");
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
    ${outils.length ? `<div class="outils-projet"><h2>Outils</h2><ul class="outils">${outils.map((o) => `<li>${o}</li>`).join("")}</ul></div>` : ""}
    ${liens ? `<div class="boutons">${liens}</div>${notes}` : ""}
  </div></div>

  <!-- Sur grand écran, quand le projet a une recommandation : le récit à gauche, la recommandation à droite -->
  <div class="wrap contenu-projet${recommandations ? " avec-cote" : ""}">
    <div class="projet-principal">
      ${p.couverture ? visuel(p.couverture).replace("<figure>", '<figure class="couverture">') : ""}
      ${p.statut && p.statut.texte ? section("Où en est le projet", paragraphes(p.statut.texte)).replace("<section>", `<section class="etat-projet ${p.statut.classe}">`) : ""}
      ${section("Contexte", paragraphes(p.contexte))}
      ${section("Ce que j'ai fait", paragraphes(p.actions))}
      ${visuels ? `<div class="visuels">${visuels}</div>` : ""}
      ${galerie}
      ${p.video ? videoProjet(p.video) : ""}
      ${(p.galeries || []).map(galerieSection).join("")}
      ${section("L'atlas des zones d'accélération", atlasParType(p.atlas))}
      ${section("Résultat", paragraphes(p.resultat))}
      ${section("Difficulté rencontrée", paragraphes(p.difficulte))}
    </div>
    ${recommandations ? `<aside class="projet-cote">${section("Recommandation", recommandations)}</aside>` : ""}
    <nav class="projets-voisins" aria-label="Autres projets">
      <a href="#${precedent.id}"><span>← Projet précédent</span>${precedent.titreCourt}</a>
      <a href="#${suivant.id}"><span>Projet suivant →</span>${suivant.titreCourt}</a>
    </nav>
  </div>`;
}

/* ---------- Relief du bandeau d'accueil : une carte topographique imaginaire ----------
   Le relief (somme de « bosses » gaussiennes) est dessiné à la manière d'une carte IGN : estompage
   (ombrage éclairé du nord-ouest), courbes de niveau tous les 10 m (algorithme des marching squares),
   courbes maîtresses tous les 50 m avec leur cote, points cotés, cours d'eau qui suivent la plus grande pente,
   carroyage kilométrique Lambert-93 centré sur Paris, sentier balisé jusqu'au repère du portrait,
   flèche du nord et échelle. À l'arrivée, le relief monte puis l'habillage apparaît. Avec une souris,
   une petite colline suit le pointeur, avec ses coordonnées et son altitude, comme dans un SIG.
   Le terrain est calculé une seule fois ; à chaque image, on n'ajoute que la colline du pointeur. */

const MOUVEMENT_REDUIT = matchMedia("(prefers-reduced-motion: reduce)");
const SOURIS = matchMedia("(hover: hover) and (pointer: fine)");
const RELIEF = {
  canvas: null, ctx: null, largeur: 0, hauteur: 0, bosses: [], couleurs: {}, grilles: {},
  montee: 1, habillage: 1, debut: 0, boucle: 0,
  curseur: { x: 0, y: 0, z: 0 }, cible: { x: 0, y: 0, z: 0 }, pointeur: null,
  carte: null, // cotes, points cotés, cours d'eau, zones à laisser libres : calculés une fois le relief au repos
};
const COLLINE_CURSEUR = { hauteur: 0.8, rayon: 120 };
const PAS_COURBES = 12;            // maille de la grille des courbes de niveau (px)
const PAS_ESTOMPAGE = 8;           // maille de l'ombrage, plus fine
const PAS_NIVEAU = 0.15;           // écart entre deux courbes, en unités du relief
const EQUIDISTANCE = 10;           // le même écart, en mètres
const NIVEAUX = Array.from({ length: 20 }, (_, n) => PAS_NIVEAU * (n + 1));
const METRES_PAR_PIXEL = 6;
const CENTRE_L93 = { x: 652000, y: 6862000 }; // centre du bandeau : Paris, en Lambert-93
const POLICE = '"Source Sans 3", "Segoe UI", sans-serif';
const POLICE_CHIFFRES = '"Cascadia Mono", Consolas, Menlo, "DejaVu Sans Mono", monospace';

const enMetres = (z) => Math.round((z / PAS_NIVEAU) * EQUIDISTANCE);
const lambert = (x, y) => ({
  x: CENTRE_L93.x + (x - RELIEF.largeur / 2) * METRES_PAR_PIXEL,
  y: CENTRE_L93.y - (y - RELIEF.hauteur / 2) * METRES_PAR_PIXEL,
});
const kilometres = (m) => Math.round(m).toLocaleString("fr-FR");

function altitudeTerrain(x, y) {
  let z = 0;
  for (const b of RELIEF.bosses) z += b.hauteur * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.rayon * b.rayon));
  return z;
}

// (Re)prépare le relief : taille du canevas, bosses, couleurs du thème. intro = faire monter le relief.
function preparerRelief(intro) {
  const canvas = document.getElementById("courbes");
  if (!canvas) return;
  const { width, height } = canvas.getBoundingClientRect();
  if (!width) return;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  // Générateur pseudo-aléatoire à graine fixe : le relief est le même à chaque visite.
  let graine = 11;
  const aleatoire = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const bosses = Array.from({ length: 7 }, () => ({
    x: width * (aleatoire() * 1.1 - 0.05),
    y: height * aleatoire(),
    rayon: 100 + aleatoire() * 200,
    hauteur: 0.6 + aleatoire(),
  }));

  // Couleurs du thème (clair ou sombre), définies dans style.css
  const styles = getComputedStyle(document.documentElement);
  const lire = (nom, defaut) => styles.getPropertyValue(nom).trim() || defaut;
  const couleurs = {
    courbe: lire("--courbe", "rgba(146,98,52,.17)"),
    maitresse: lire("--courbe-forte", "rgba(146,98,52,.42)"),
    cote: lire("--courbe-texte", "rgba(128,82,38,.9)"),
    eau: lire("--eau", "rgba(46,124,186,.6)"),
    carroyage: lire("--carroyage", "rgba(23,33,45,.34)"),
    encre: lire("--ink", "#17212D"),
    sentier: lire("--repere", "#C43E14"),
    fond: lire("--bg", "#F4F1EA"),
    ombrage: lire("--ombrage", "70, 48, 26").split(",").map(Number),
    lumiere: lire("--lumiere", "255, 253, 246").split(",").map(Number),
    forceOmbre: Number(lire("--ombrage-force", ".45")),
    forceLumiere: Number(lire("--lumiere-force", ".5")),
  };

  Object.assign(RELIEF, { canvas, ctx, largeur: width, hauteur: height, bosses, couleurs, grilles: {}, carte: null });
  if (intro && !MOUVEMENT_REDUIT.matches) {
    Object.assign(RELIEF, { montee: 0, habillage: 0, debut: performance.now() });
  } else {
    Object.assign(RELIEF, { montee: 1, habillage: 1 });
  }
  animerRelief();
}

// Une image par rafraîchissement de l'écran, tant que quelque chose bouge (montée, habillage, colline du pointeur).
function animerRelief() {
  if (RELIEF.boucle) return;
  RELIEF.boucle = requestAnimationFrame((t) => {
    RELIEF.boucle = 0;
    if (!RELIEF.canvas || !RELIEF.canvas.isConnected) return;
    let encore = false;
    if (RELIEF.habillage < 1) {
      const ecoule = Math.max(0, t - RELIEF.debut);
      RELIEF.montee = 1 - (1 - Math.min(1, ecoule / 1800)) ** 3;
      RELIEF.habillage = Math.min(1, Math.max(0, (ecoule - 1500) / 1000));
      encore = RELIEF.habillage < 1;
    }
    const c = RELIEF.curseur, v = RELIEF.cible;
    const ecart = Math.abs(v.x - c.x) + Math.abs(v.y - c.y) + 400 * Math.abs(v.z - c.z);
    if (ecart > 0.6) {
      c.x += (v.x - c.x) * 0.14;
      c.y += (v.y - c.y) * 0.14;
      c.z += (v.z - c.z) * 0.1;
      encore = true;
    } else {
      Object.assign(c, v);
    }
    tracerRelief();
    if (encore) animerRelief();
  });
}

/* Altitudes aux nœuds d'une grille de « pas » pixels, avec une rangée de marge tout autour (pour les pentes).
   base = le terrain seul, calculé une fois ; z = l'état affiché (terrain qui monte + colline du pointeur). */
function champ(pas) {
  let g = RELIEF.grilles[pas];
  if (!g) {
    const nx = Math.ceil(RELIEF.largeur / pas) + 2, ny = Math.ceil(RELIEF.hauteur / pas) + 2, l = nx + 2;
    const base = new Float32Array(l * (ny + 2));
    for (let j = -1; j <= ny; j++) for (let i = -1; i <= nx; i++) base[(j + 1) * l + i + 1] = altitudeTerrain(i * pas, j * pas);
    g = RELIEF.grilles[pas] = { pas, nx, ny, l, base, z: new Float32Array(base.length) };
  }
  const { nx, ny, l, base, z } = g;
  const { montee, curseur } = RELIEF;
  for (let k = 0; k < base.length; k++) z[k] = base[k] * montee;
  if (curseur.z > 0.002) {
    const r2 = 2 * COLLINE_CURSEUR.rayon ** 2, portee = 3.2 * COLLINE_CURSEUR.rayon;
    const i0 = Math.max(-1, Math.floor((curseur.x - portee) / pas)), i1 = Math.min(nx, Math.ceil((curseur.x + portee) / pas));
    const j0 = Math.max(-1, Math.floor((curseur.y - portee) / pas)), j1 = Math.min(ny, Math.ceil((curseur.y + portee) / pas));
    const h = curseur.z * montee;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) z[(j + 1) * l + i + 1] += h * Math.exp(-((i * pas - curseur.x) ** 2 + (j * pas - curseur.y) ** 2) / r2);
    }
  }
  return g;
}

// Segments de courbe d'un niveau (marching squares) : chaque case est classée selon ses coins
// situés au-dessus du niveau (16 cas), ce qui donne le ou les segments à tracer.
function segmentsNiveau(g, valeurs, niveau, rappel) {
  const { pas, nx, ny, l } = g;
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const k = (j + 1) * l + i + 1;
      const a = valeurs[k], b = valeurs[k + 1], c = valeurs[k + l + 1], d = valeurs[k + l];
      const cas = (a > niveau ? 8 : 0) | (b > niveau ? 4 : 0) | (c > niveau ? 2 : 0) | (d > niveau ? 1 : 0);
      if (cas === 0 || cas === 15) continue;
      // Position du niveau sur chaque côté de la case (interpolation linéaire)
      const x = i * pas, y = j * pas, t = (p, q) => (niveau - p) / (q - p);
      const haut = [x + pas * t(a, b), y];
      const droite = [x + pas, y + pas * t(b, c)];
      const bas = [x + pas * t(d, c), y + pas];
      const gauche = [x, y + pas * t(a, d)];
      const segments = {
        1: [gauche, bas], 2: [bas, droite], 3: [gauche, droite], 4: [haut, droite],
        5: [gauche, haut, bas, droite], 6: [haut, bas], 7: [gauche, haut], 8: [gauche, haut],
        9: [haut, bas], 10: [haut, droite, gauche, bas], 11: [haut, droite], 12: [gauche, droite],
        13: [bas, droite], 14: [gauche, bas],
      }[cas];
      for (let s = 0; s < segments.length; s += 2) rappel(segments[s], segments[s + 1], i, j);
    }
  }
}

function tracerRelief() {
  const { ctx, largeur, hauteur, couleurs, montee } = RELIEF;
  ctx.clearRect(0, 0, largeur, hauteur);

  // Courbes de niveau : une maîtresse (plus marquée) toutes les cinq, soit tous les 50 m
  const g = champ(PAS_COURBES);
  NIVEAUX.forEach((niveau, n) => {
    const maitresse = (n + 1) % 5 === 0;
    ctx.beginPath();
    ctx.lineWidth = maitresse ? 1.3 : 0.8;
    ctx.strokeStyle = maitresse ? couleurs.maitresse : couleurs.courbe;
    segmentsNiveau(g, g.z, niveau, (p, q) => {
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
    });
    ctx.stroke();
  });

  if (RELIEF.habillage > 0) {
    if (montee === 1 && !RELIEF.carte) RELIEF.carte = construireCarte();
    if (RELIEF.carte) habillerCarte(RELIEF.carte);
  }
  // L'ombrage passe sous tout le reste (y compris sous les cotes, où les courbes sont interrompues)
  estomper();
}

/* Estompage : chaque pente est éclairée par une lumière venant du nord-ouest (azimut 315°, hauteur 45°),
   comme sur les cartes en relief. Les versants à l'ombre sont teintés, ceux au soleil éclaircis.
   Calculé en basse résolution, puis agrandi avec lissage. */
const CANEVAS_ESTOMPAGE = document.createElement("canvas");
function estomper() {
  const { ctx, couleurs } = RELIEF;
  const g = champ(PAS_ESTOMPAGE);
  const { pas, nx, ny, l, z } = g;
  if (CANEVAS_ESTOMPAGE.width !== nx || CANEVAS_ESTOMPAGE.height !== ny) {
    CANEVAS_ESTOMPAGE.width = nx;
    CANEVAS_ESTOMPAGE.height = ny;
  }
  const cx = CANEVAS_ESTOMPAGE.getContext("2d");
  const image = cx.createImageData(nx, ny);
  const px = image.data;
  const exageration = 70 / pas;
  const plat = Math.SQRT1_2; // éclairement d'un terrain plat (lumière à 45°)
  const [ro, vo, bo] = couleurs.ombrage, [rl, vl, bl] = couleurs.lumiere;
  const fo = couleurs.forceOmbre * 255, fl = couleurs.forceLumiere * 255;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = (j + 1) * l + i + 1;
      const dx = (z[k + 1] - z[k - 1]) * 0.5 * exageration;
      const dy = (z[k + l] - z[k - l]) * 0.5 * exageration;
      // Normale (-dx, -dy, 1) et lumière du nord-ouest (-0,5 ; -0,5 ; 0,707) dans le repère de l'écran (y vers le bas)
      const eclairement = (0.5 * dx + 0.5 * dy + plat) / Math.sqrt(dx * dx + dy * dy + 1);
      const p = (j * nx + i) * 4;
      if (eclairement < plat) {
        px[p] = ro; px[p + 1] = vo; px[p + 2] = bo; px[p + 3] = Math.min(255, (plat - eclairement) * fo);
      } else {
        px[p] = rl; px[p + 1] = vl; px[p + 2] = bl; px[p + 3] = Math.min(255, (eclairement - plat) * fl);
      }
    }
  }
  cx.putImageData(image, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(CANEVAS_ESTOMPAGE, 0, 0, nx * pas, ny * pas);
  ctx.restore();
}

/* Ce qui ne bouge pas une fois le relief monté : on le calcule une seule fois, sur le terrain sans la colline du pointeur. */
function construireCarte() {
  const { largeur: L, hauteur: H, canvas } = RELIEF;
  const rc = canvas.getBoundingClientRect();
  const cadre = (r, marge) => ({ x0: r.left - rc.left - marge, y0: r.top - rc.top - marge, x1: r.right - rc.left + marge, y1: r.bottom - rc.top + marge });
  const hero = canvas.closest(".hero");

  // Zones laissées libres : le texte (son étendue réelle, pas la colonne entière) et le portrait
  const texte = [...hero.querySelectorAll(".hero-grille > div:first-child > *")].map((el) => {
    const plage = document.createRange();
    plage.selectNodeContents(el);
    return cadre(plage.getBoundingClientRect(), 16);
  });
  const portraitEl = hero.querySelector(".hero-portrait");
  const portrait = portraitEl ? cadre(portraitEl.getBoundingClientRect(), 34) : null;
  const zones = portrait ? [...texte, portrait] : [...texte];
  const libre = (x, y, marge = 0) => x > marge && y > marge && x < L - marge && y < H - marge
    && !zones.some((z) => x > z.x0 - marge && x < z.x1 + marge && y > z.y0 - marge && y < z.y1 + marge);
  const loin = (liste, x, y, d) => liste.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 > d * d);
  const finTexte = Math.max(...texte.map((z) => z.x1));
  const portraitADroite = portrait && portrait.x0 > finTexte;

  // Flèche du nord en haut à droite ; échelle graphique sous le portrait (ou en bas à droite).
  // Elles deviennent ensuite des zones libres, pour que rien ne s'écrive dessus.
  const marge = Math.min(56, L * 0.05);
  const nord = libre(L - marge - 10, 70) ? { x: L - marge - 24, y: 70 } : null;
  const longueur = 1000 / METRES_PAR_PIXEL;
  const yEchelle = portraitADroite ? Math.min(H - 34, portrait.y1 + 46) : H - 34;
  const echelle = libre(L - marge - longueur, yEchelle) && libre(L - marge, yEchelle) ? { x: L - marge - longueur, y: yEchelle, longueur } : null;
  if (nord) zones.push({ x0: nord.x - 24, y0: nord.y - 46, x1: nord.x + 24, y1: nord.y + 22 });
  if (echelle) zones.push({ x0: echelle.x - 20, y0: echelle.y - 24, x1: echelle.x + longueur + 20, y1: echelle.y + 28 });

  // Sommets : maxima locaux du terrain, du plus haut au plus bas
  const g = champ(PAS_COURBES);
  const { pas, nx, ny, l, base } = g;
  const B = (i, j) => base[(j + 1) * l + i + 1];
  const sommets = [];
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const z = B(i, j);
      let max = z > 0.5;
      for (let dj = -1; dj <= 1 && max; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && B(i + di, j + dj) >= z) { max = false; break; }
      if (max) sommets.push({ x: i * pas, y: j * pas, z });
    }
  }
  sommets.sort((a, b) => b.z - a.z);
  const pointsCotes = [];
  for (const s of sommets) if (pointsCotes.length < 4 && libre(s.x, s.y, 26) && loin(pointsCotes, s.x, s.y, 160)) pointsCotes.push(s);
  // Comme sur une carte, des points cotés aussi hors des sommets : tirés au hasard (graine fixe) dans les zones libres
  let graine = 7;
  const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  for (let essai = 0; essai < 300 && pointsCotes.length < 5; essai++) {
    const x = 30 + hasard() * (L - 60), y = 40 + hasard() * (H - 80);
    if (libre(x, y, 30) && loin(pointsCotes, x, y, 190)) pointsCotes.push({ x, y, z: altitudeTerrain(x, y) });
  }
  pointsCotes.sort((a, b) => b.z - a.z);

  // Cotes des courbes maîtresses : quelques morceaux de courbe dans les zones libres, bien espacés
  const cotes = [];
  NIVEAUX.forEach((niveau, n) => {
    if ((n + 1) % 5 !== 0) return;
    let surCeNiveau = 0;
    segmentsNiveau(g, base, niveau, (p, q, i, j) => {
      if (surCeNiveau >= 2 || cotes.length >= 9 || (i + j) % 5 !== 0) return;
      const x = (p[0] + q[0]) / 2, y = (p[1] + q[1]) / 2;
      if (!libre(x, y, 34) || !loin(cotes, x, y, 230) || !loin(pointsCotes, x, y, 90)) return;
      let angle = Math.atan2(q[1] - p[1], q[0] - p[0]);
      if (angle > Math.PI / 2) angle -= Math.PI;
      if (angle < -Math.PI / 2) angle += Math.PI;
      cotes.push({ x, y, angle, texte: String(enMetres(niveau)) });
      surCeNiveau++;
    });
  });

  // Cours d'eau : partent sous un sommet et descendent la plus grande pente jusqu'au bord ou au fond d'une cuvette
  const pente = (x, y) => {
    const e = 2;
    return [(altitudeTerrain(x + e, y) - altitudeTerrain(x - e, y)) / (2 * e), (altitudeTerrain(x, y + e) - altitudeTerrain(x, y - e)) / (2 * e)];
  };
  const coursEau = [];
  for (const s of sommets.slice(0, 5)) {
    if (coursEau.length >= 2) break;
    let x = s.x + 34, y = s.y + 22;
    const trace = [];
    for (let k = 0; k < 700; k++) {
      if (!libre(x, y, -40)) break;
      trace.push([x, y]);
      const [gx, gy] = pente(x, y);
      const n = Math.hypot(gx, gy);
      if (n < 1e-6) break;
      x -= (gx / n) * 4;
      y -= (gy / n) * 4;
    }
    if (trace.length > 45 && coursEau.every((c) => loin(c.map(([px, py]) => ({ x: px, y: py })), trace[20][0], trace[20][1], 80))) coursEau.push(trace);
  }

  // Sentier balisé : monte du bas du bandeau jusqu'au repère vermillon du portrait (quand le portrait est à droite du texte)
  let sentier = null;
  if (portraitADroite && portrait.x0 > finTexte + 80 && L > 1000) {
    const r = portraitEl.getBoundingClientRect();
    const arrivee = { x: r.right - rc.left - r.width * 0.03 - 9, y: r.top - rc.top + r.height * 0.09 + 9 };
    const depart = { x: (finTexte + portrait.x0) / 2 - 40, y: H + 10 };
    const c1 = { x: depart.x + 70, y: H * 0.42 };
    const c2 = { x: arrivee.x - 150, y: arrivee.y - 230 };
    sentier = Array.from({ length: 140 }, (_, k) => {
      const t = k / 139, u = 1 - t;
      return [
        u ** 3 * depart.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * arrivee.x,
        u ** 3 * depart.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * arrivee.y,
      ];
    });
  }

  // Carroyage kilométrique Lambert-93 : positions des lignes de kilomètre rond
  const pasKm = 1000 / METRES_PAR_PIXEL;
  const coin = lambert(0, 0);
  const premierX = Math.ceil(coin.x / 1000) * 1000;
  const premierY = Math.floor(coin.y / 1000) * 1000;
  const lignesX = [], lignesY = [];
  for (let X = premierX, x = (premierX - coin.x) / METRES_PAR_PIXEL; x < L; X += 1000, x += pasKm) lignesX.push({ x, X });
  for (let Y = premierY, y = (coin.y - premierY) / METRES_PAR_PIXEL; y < H; Y -= 1000, y += pasKm) lignesY.push({ y, Y });

  return { libre, cotes, pointsCotes, coursEau, sentier, lignesX, lignesY, nord, echelle };
}

/* Dessine l'habillage de la carte par-dessus les courbes. */
function habillerCarte(carte) {
  const { ctx, couleurs, habillage, curseur, largeur: L } = RELIEF;
  const colline = curseur.z > 0.05 ? curseur : null;
  const horsColline = (x, y) => !colline || (x - colline.x) ** 2 + (y - colline.y) ** 2 > (COLLINE_CURSEUR.rayon * 1.7) ** 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Cotes des courbes maîtresses, écrites dans le sens de la courbe, qui s'interrompt pour les laisser lire
  ctx.font = `600 10px ${POLICE}`;
  for (const c of carte.cotes) {
    if (!horsColline(c.x, c.y)) continue;
    const w = ctx.measureText(c.texte).width;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.globalAlpha = habillage;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(-w / 2 - 4, -6, w + 8, 12);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = couleurs.cote;
    ctx.fillText(c.texte, 0, 0.5);
    ctx.restore();
  }

  // Cours d'eau : un trait bleu qui s'élargit vers l'aval
  ctx.globalAlpha = habillage;
  ctx.strokeStyle = couleurs.eau;
  ctx.lineCap = "round";
  for (const trace of carte.coursEau) {
    for (let k = 1; k < trace.length; k++) {
      ctx.lineWidth = 0.6 + 1.8 * (k / trace.length);
      ctx.beginPath();
      ctx.moveTo(...trace[k - 1]);
      ctx.lineTo(...trace[k]);
      ctx.stroke();
    }
  }

  // Carroyage : croisillons, puis graduations et valeurs (km) en haut et à droite
  ctx.strokeStyle = couleurs.carroyage;
  ctx.fillStyle = couleurs.carroyage;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const { x } of carte.lignesX) {
    for (const { y } of carte.lignesY) {
      if (!carte.libre(x, y, 8)) continue;
      ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6);
    }
  }
  for (const { x } of carte.lignesX) { ctx.moveTo(x, 0); ctx.lineTo(x, 7); }
  for (const { y } of carte.lignesY) { ctx.moveTo(L, y); ctx.lineTo(L - 7, y); }
  ctx.stroke();
  ctx.font = `9.5px ${POLICE_CHIFFRES}`;
  for (const { x, X } of carte.lignesX) if (x > 30 && x < L - 60 && carte.libre(x, 17)) ctx.fillText(String(X / 1000), x, 17);
  ctx.textAlign = "right";
  for (const { y, Y } of carte.lignesY) if (y > 30 && carte.libre(L - 30, y - 8)) ctx.fillText(kilometres(Y / 1000), L - 11, y - 8);
  ctx.textAlign = "center";

  // Points cotés : un triangle pointé (point géodésique) pour le plus haut, un point pour les autres
  ctx.fillStyle = couleurs.encre;
  ctx.strokeStyle = couleurs.encre;
  ctx.font = `600 10.5px ${POLICE}`;
  carte.pointsCotes.forEach((s, rang) => {
    if (!horsColline(s.x, s.y)) return;
    ctx.globalAlpha = 0.62 * habillage;
    if (rang === 0) {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 6); ctx.lineTo(s.x + 5.5, s.y + 4); ctx.lineTo(s.x - 5.5, s.y + 4); ctx.closePath();
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s.x, s.y + 0.8, 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.textAlign = "left";
    ctx.fillText(String(enMetres(s.z)), s.x + 8, s.y - 7);
    ctx.textAlign = "center";
  });

  // Sentier balisé (tirets vermillon) qui se dessine jusqu'au repère du portrait
  if (carte.sentier) {
    const n = Math.max(2, Math.round(carte.sentier.length * habillage));
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = couleurs.sentier;
    ctx.lineWidth = 1.7;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(...carte.sentier[0]);
    for (let k = 1; k < n; k++) ctx.lineTo(...carte.sentier[k]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Flèche du nord : une moitié pleine, l'autre en trait
  if (carte.nord) {
    const { x, y } = carte.nord;
    ctx.globalAlpha = 0.6 * habillage;
    ctx.fillStyle = ctx.strokeStyle = couleurs.encre;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y - 18); ctx.lineTo(x - 7, y + 10); ctx.lineTo(x, y + 4); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - 18); ctx.lineTo(x + 7, y + 10); ctx.lineTo(x, y + 4); ctx.closePath();
    ctx.stroke();
    ctx.font = `700 11px ${POLICE}`;
    ctx.fillText("N", x, y - 28);
  }

  // Échelle graphique : 1 km en quatre tronçons alternés, et la projection dessous
  if (carte.echelle) {
    const { x, y, longueur } = carte.echelle;
    ctx.globalAlpha = 0.62 * habillage;
    ctx.fillStyle = ctx.strokeStyle = couleurs.encre;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, longueur, 5);
    for (let k = 0; k < 4; k += 2) ctx.fillRect(x + (k * longueur) / 4, y, longueur / 4, 5);
    ctx.font = `9.5px ${POLICE_CHIFFRES}`;
    ctx.fillText("0", x, y - 9);
    ctx.fillText("500", x + longueur / 2, y - 9);
    ctx.fillText("1 km", x + longueur, y - 9);
    ctx.textAlign = "right";
    ctx.fillText("Lambert-93 · équidistance 10 m", x + longueur, y + 18);
    ctx.textAlign = "center";
  }

  // Pointeur : réticule, coordonnées Lambert-93 et altitude, comme l'outil d'identification d'un SIG
  if (RELIEF.pointeur && RELIEF.cible.z > 0) {
    const { x, y } = RELIEF.pointeur;
    const z = altitudeTerrain(x, y) + curseur.z * Math.exp(-((x - curseur.x) ** 2 + (y - curseur.y) ** 2) / (2 * COLLINE_CURSEUR.rayon ** 2));
    const p = lambert(x, y);
    const texte = `X ${kilometres(p.x)}  Y ${kilometres(p.y)}  Z ${enMetres(z)} m`;
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = couleurs.encre;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 14, y); ctx.lineTo(x - 5, y); ctx.moveTo(x + 5, y); ctx.lineTo(x + 14, y);
    ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 5); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 14);
    ctx.stroke();
    ctx.font = `10px ${POLICE_CHIFFRES}`;
    const w = ctx.measureText(texte).width + 14;
    const bx = x + 16 + w > L ? x - 16 - w : x + 16;
    ctx.fillStyle = couleurs.fond;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, y + 12, w, 20, 10);
    else ctx.rect(bx, y + 12, w, 20);
    ctx.fill();
    ctx.fillStyle = couleurs.encre;
    ctx.textAlign = "left";
    ctx.fillText(texte, bx + 7, y + 22.5);
  }
  ctx.restore();
}

// La colline du pointeur : elle suit la souris dans le bandeau et s'affaisse quand on en sort.
document.addEventListener("pointermove", (e) => {
  const canvas = RELIEF.canvas;
  if (!canvas || !canvas.isConnected || !SOURIS.matches || MOUVEMENT_REDUIT.matches || e.pointerType !== "mouse") return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  const dedans = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
  if (!dedans && RELIEF.cible.z === 0 && RELIEF.curseur.z === 0) return;
  // La colline naît sous le pointeur au lieu de glisser depuis l'endroit où elle a disparu
  if (dedans && RELIEF.curseur.z < 0.02) Object.assign(RELIEF.curseur, { x, y });
  RELIEF.pointeur = dedans ? { x, y } : null;
  RELIEF.cible = dedans ? { x, y, z: COLLINE_CURSEUR.hauteur } : { ...RELIEF.curseur, z: 0 };
  animerRelief();
}, { passive: true });

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
  document.title = projet ? `${projet.titreCourt} | ${PROFIL.nom}`
    : page === "mentions-legales" ? `Mentions légales | ${PROFIL.nom}`
    : page === "recommandations" ? `Recommandations | ${PROFIL.nom}`
    : `${PROFIL.nom} | ${PROFIL.poste}`;
  document.documentElement.dataset.page = projet ? "projet" : page; // barre de lecture des projets (style.css)
  window.scrollTo(0, 0);
  majProgression();

  if (page === "accueil") requestAnimationFrame(() => preparerRelief(true));
  if (page === "parcours") requestAnimationFrame(initCarte);
  revelerAuDefilement();
}

// Changement de page : fondu enchaîné quand le navigateur sait le faire (View Transitions)
function naviguer() {
  if (!document.startViewTransition || MOUVEMENT_REDUIT.matches) return afficher();
  document.startViewTransition(afficher);
}

/* ---------- Apparition au fil du défilement ----------
   Les cartes et encadrés montent en se dévoilant quand ils entrent dans l'écran ; dans une même grille,
   les voisins arrivent l'un après l'autre. Rien n'est masqué si les animations sont réduites. */
const A_REVELER = [
  ".grille-projets > .projet", ".competences > div", ".langues", ".recommandations > .recommandation",
  ".savoir-etre > li", ".interets > li", ".lettres > .lettre", ".formation", ".frise > li",
  ".mentions > section", ".coordonnees", ".galerie-tel", ".galerie-cartes > *", ".planches > *",
].join(", ");
let observateur = null;

function revelerAuDefilement() {
  observateur?.disconnect();
  if (!("IntersectionObserver" in window) || MOUVEMENT_REDUIT.matches) return;
  observateur = new IntersectionObserver((entrees) => {
    entrees.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      observateur.unobserve(target);
      target.classList.add("revele");
      // Une fois arrivé, l'élément retrouve ses transitions habituelles (survol)
      target.addEventListener("transitionend", () => {
        target.classList.remove("a-reveler", "revele");
        target.style.removeProperty("--retard");
      }, { once: true });
    });
  }, { rootMargin: "0px 0px -6% 0px" });
  app.querySelectorAll(A_REVELER).forEach((el) => {
    const rang = [...el.parentElement.children].indexOf(el) % 4;
    el.style.setProperty("--retard", `${rang * 90}ms`);
    el.classList.add("a-reveler");
    observateur.observe(el);
  });
}

// Barre de lecture (pages de projet) : part de la page déjà lue
function majProgression() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  document.documentElement.style.setProperty("--lu", total > 0 ? Math.min(1, window.scrollY / total).toFixed(4) : 0);
}

// Bouton clair / sombre : le choix est gardé dans ce navigateur (localStorage), sinon on suit l'appareil
document.getElementById("theme").addEventListener("click", () => {
  const racine = document.documentElement;
  const sombre = racine.dataset.theme ? racine.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  racine.dataset.theme = sombre ? "light" : "dark";
  try { localStorage.setItem("theme", racine.dataset.theme); } catch (e) {}
  preparerRelief(false); // les courbes prennent les couleurs du nouveau thème
});

function remplirPied() {
  document.getElementById("cv-entete").href = PROFIL.cv;
  document.getElementById("pied").innerHTML = `<div class="wrap">
    <span>© ${new Date().getFullYear()} ${PROFIL.nom} · <a href="#mentions-legales">Mentions légales</a></span>
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

// Bouton « ← Retour » : revient à la page vue juste avant sur le site ; si on arrive directement
// sur la page (lien partagé, favori), il mène à l'accueil (son href).
let pagesVues = 0;
window.addEventListener("hashchange", () => pagesVues++);
document.addEventListener("click", (e) => {
  const retour = e.target.closest("[data-retour]");
  if (retour && pagesVues > 0) {
    e.preventDefault();
    history.back();
  }
});

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
  // Chapitre d'une vidéo de démonstration : aller au moment indiqué et lancer la lecture
  const chapitre = e.target.closest("[data-chapitre]");
  if (chapitre) {
    const video = chapitre.closest(".video-projet").querySelector("video");
    video.currentTime = Number(chapitre.dataset.chapitre);
    video.play().catch(() => {});
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
  redimension = setTimeout(() => preparerRelief(false), 150);
});
// Passage du thème clair au thème sombre (ou l'inverse) : les courbes changent de couleur
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => preparerRelief(false));
window.addEventListener("hashchange", naviguer);

// Pendant la lecture d'une vidéo de démonstration, le bouton du chapitre en cours est mis en avant.
// (timeupdate ne remonte pas jusqu'au document : on l'écoute en phase de capture.)
document.addEventListener("timeupdate", (e) => {
  const section = e.target.closest?.(".video-projet");
  if (!section) return;
  const boutons = [...section.querySelectorAll("[data-chapitre]")];
  const courant = boutons.filter((b) => Number(b.dataset.chapitre) <= e.target.currentTime + 0.5).pop();
  boutons.forEach((b) => b.setAttribute("aria-pressed", b === courant));
}, true);

// Pied de page fixe : sa hauteur (qui change si les liens passent sur deux lignes) est réservée en bas de la page.
const pied = document.getElementById("pied");
new ResizeObserver(() => document.documentElement.style.setProperty("--hauteur-pied", `${pied.offsetHeight}px`)).observe(pied);
// Même chose pour l'en-tête : la carte du parcours reste collée juste en dessous (carte.css).
const entete = document.querySelector(".entete");
new ResizeObserver(() => document.documentElement.style.setProperty("--hauteur-entete", `${entete.offsetHeight}px`)).observe(entete);

// Bouton « revenir en haut » : visible dès qu'on a fait défiler la page de 400 px.
const boutonHaut = document.getElementById("haut");
window.addEventListener("scroll", () => {
  boutonHaut.hidden = window.scrollY < 400;
  majProgression();
}, { passive: true });
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
const GROUPES = ".galerie-ecrans, .galerie-cartes, .galerie-planches, .tel-ecrans, .visuels, .planches, .formation-contenu, .recommandations, .lettres, .savoir-etre";
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
