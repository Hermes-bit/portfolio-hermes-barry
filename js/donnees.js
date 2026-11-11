/* Contenu du portfolio : profil, projets, compétences et lieux du parcours.

   Convention : un texte entre [[ ]] est à compléter.
   - en local (Live Server ou double-clic), il est surligné en jaune ;
   - une fois le site en ligne, la phrase qui le contient est masquée.
*/

const PROFIL = {
  nom: "Hermès Barry",
  poste: "Chef de projet géomatique",
  photo: "assets/photo.jpg",
  cv: "assets/CV-Hermes-Barry.pdf",
  email: "hermesbarry58@gmail.com",
  telephone: "+33 7 51 50 34 26",
  linkedin: "https://www.linkedin.com/in/hermes-barry-8727581bb",
  github: "https://github.com/Hermes-bit",
  zone: "Paris et périphérie, ouvert à la mobilité",
  disponibilite: "Dès maintenant",
  // cecrl : niveau du Cadre européen commun de référence (A1 à C2), affiché sur une échelle.
  // Sans cecrl (langue maternelle), seul le niveau en toutes lettres s'affiche.
  langues: [
    { langue: "Français", niveau: "Langue maternelle" },
    { langue: "Anglais", cecrl: "B1", niveau: "utilisateur indépendant" },
    { langue: "Allemand", cecrl: "A2", niveau: "utilisateur élémentaire" },
  ],
};

/* Projets
   Chaque projet a sa propre page (adresse #id). Les champs facultatifs
   (visuels, resultat, difficulte, liens) peuvent être retirés : la section
   correspondante disparaît.
   visuels : soit { src, legende } pour une image, soit "[[...]]" pour une image à ajouter.
     Ajouter format: "telephone" pour une capture de téléphone (en portrait, affichée côte à côte).
   vignette : image de la carte du projet (liste des projets) quand il n'y a pas de couverture.
     Ajouter fond: "#couleur" pour afficher l'image entière (un logo par exemple) sur ce fond, sans recadrage.
   perso : true pour un projet personnel (rubrique « Projets personnels » de la page Projets).
   statut : état d'un projet personnel { libelle, classe, detail?, texte? }.
     classe : "en-cours" ou "bloque" (couleur). Le libellé s'affiche sur la carte du projet et,
     suivi du détail, dans l'en-tête de sa page ; texte (paragraphes) ouvre la page,
     sous le titre « Où en est le projet ».
   logo : { src, nom } affiché sur la carte du projet et dans l'en-tête de sa page (facultatif) ;
     surBlanc: true pour un logo prévu sur fond blanc (il est alors posé dans un cadre blanc).
   situation : fond de la carte de situation, "france" par défaut ou "burkina".
   atlas : planches de l'atlas des ZAEnR { type, commune, src, vignette }. Sur la page, elles sont
     classées par type d'énergie, avec un bouton par type pour filtrer (voir atlasParType dans app.js).
     src est l'image ouverte au clic, vignette l'image réduite affichée dans la page. */
const PROJETS = [
  {
    id: "accessibilite",
    logo: { src: "assets/logos/idgeo.png", nom: "IDGEO", surBlanc: true },
    titreCourt: "Accessibilité PMR au standard CNIG",
    titre: "Une base de données et une application web sur l'accessibilité des cheminements piétons",
    cadre: "IDGEO, projet de certification",
    role: "Projet individuel",
    periode: "2026",
    lieu: "Agglomération de Losse-en-Gelaisse (cas d'étude)",
    ll: null,
    couverture: { src: "assets/projets/accessibilite-application.jpg", legende: "L'application en ligne : tronçons colorés selon leur score d'accessibilité" },
    resume: "Une base PostGIS conforme au standard CNIG Accessibilité et une application web en ligne pour consulter l'état des cheminements autour des arrêts de transport.",
    liens: [
      { texte: "Ouvrir l'application", url: "https://hermes-bit.github.io/Accessibilite_cnig_dieppe/?config=apps/cnig_accessibilite.xml", note: "Une fenêtre de connexion s'ouvre d'abord : la fermer (×) pour consulter la carte en invité." },
      { texte: "Voir le code sur GitHub", url: "https://github.com/Hermes-bit/Accessibilite_cnig_dieppe" },
    ],
    contexte: [
      "La loi d'orientation des mobilités (LOM) demande aux autorités organisatrices de la mobilité de décrire l'accessibilité de la voirie dans un rayon de 200 m autour des arrêts prioritaires, et de publier ces données au format du standard CNIG Accessibilité.",
      "Pour ma certification de chef de projet à l'IDGEO, j'ai construit la base de données et l'outil de consultation pour une agglomération servant de cas d'étude.",
      "Le projet s'appuie sur des données existantes : un relevé de terrain déjà réalisé à Dieppe. Pour l'étude de cas, le territoire a été rebaptisé « agglomération de Losse-en-Gelaisse », un nom fictif.",
    ],
    actions: [
      "J'ai traduit le standard CNIG en modèle de données : nœuds, tronçons de cheminement, obstacles, ERP et leurs entrées, places de stationnement PMR. Une partie des règles est vérifiée par la base elle-même : un tronçon relie toujours deux nœuds existants, une pente reste comprise entre 0 et 100 %, une largeur utile est forcément positive.",
      "Un script Python charge les données avec ogr2ogr, les reprojette en Lambert-93 et crée les index spatiaux. Quatre rôles PostgreSQL séparent l'administration, la saisie, les livraisons des prestataires et la simple consultation.",
      "Une vue SQL donne à chaque tronçon un score d'accessibilité calculé à partir de la pente, du dévers, de la largeur utile, du revêtement et du nombre d'obstacles. Sur la carte, il apparaît en vert, orange ou rouge.",
      "Les 13 couches sont servies en GeoJSON par une API Flask avec authentification, puis affichées dans mviewer. L'ensemble tourne dans des conteneurs Docker derrière Nginx, et GitHub Actions déploie chaque nouvelle version.",
    ],
    visuels: [
      { src: "assets/projets/accessibilite-demo.webp", legende: "L'application en fonctionnement : vue d'ensemble, zoom sur le centre-ville, puis la fiche d'un tronçon (type, largeur utile, pente, dévers, revêtement, niveau d'accès et nombre d'obstacles)." },
      { src: "assets/projets/accessibilite-mcd.png", legende: "Le modèle conceptuel de données, en formalisme Merise : nœuds, tronçons de cheminement, obstacles, ERP et places de stationnement PMR. Les entrées et ascenseurs sont des cas particuliers de nœuds ; les traversées, escaliers et rampes, des cas particuliers de tronçons." },
    ],
    resultat: [
      "La base contient 712 tronçons, 765 nœuds et 3 017 obstacles. L'application est en ligne : on y consulte les couches et le score de chaque tronçon, et les utilisateurs connectés peuvent calculer un itinéraire ou signaler un problème sur le terrain.",
    ],
    difficulte: [
      "Le point le plus délicat a été l'import des relevés de terrain. Les couches n'étaient pas homogènes : un même champ était booléen dans une couche et entier dans une autre, les valeurs des listes CNIG étaient saisies en toutes lettres avec des variantes (accent manquant, libellé tronqué), et certains noms de colonnes contenaient des « œ ». Les obstacles étaient répartis sur cinq couches, parfois sans identifiant. Surtout, des tronçons pointaient vers des nœuds inexistants, et les clés étrangères strictes faisaient échouer tout le chargement.",
      "J'ai écrit des fonctions de conversion en SQL (entier vers booléen, libellé vers code CNIG) et gardé les clés étrangères strictes. Seuls les tronçons dont les deux nœuds existent sont chargés ; les autres sont consignés dans une table d'erreurs, avec la valeur fautive. Les obstacles des cinq couches sont fusionnés et reçoivent un identifiant s'ils n'en ont pas, puis chacun est rattaché au tronçon le plus proche, dans un rayon de 2 m.",
    ],
    outils: ["PostgreSQL 15 / PostGIS 3.4", "Python", "Flask", "GDAL / ogr2ogr", "mviewer", "OpenLayers", "Docker", "Nginx", "GitHub Actions"],
  },
  {
    id: "hub-pnr",
    logo: { src: "assets/logos/region-nouvelle-aquitaine.png", nom: "Région Nouvelle-Aquitaine", surBlanc: true },
    titreCourt: "Hub de données des Parcs naturels régionaux",
    titre: "Un hub de données commun aux Parcs naturels régionaux de Nouvelle-Aquitaine",
    cadre: "Région Nouvelle-Aquitaine",
    role: "Chef de projet géomatique (alternance)",
    periode: "Sept. 2025 – oct. 2026",
    lieu: "Poitiers (86)",
    ll: [46.58, 0.34],
    couverture: null,
    vignette: { src: "assets/projets/hub-pnr-vignette.jpg" },
    resume: "J'ai piloté la création d'une base de données commune aux Parcs naturels régionaux de la région, mise à jour automatiquement et diffusée sous forme de cartes.",
    contexte: [
      "La Région voulait disposer en interne d'indicateurs sur ses Parcs naturels régionaux, calculés et représentés selon sa propre politique. Le projet visait à les réunir dans une base commune, tenue à jour et consultable par ses agents.",
      "Le hub couvre les huit parcs de la région : les cinq parcs labellisés et les trois projets de parc.",
      "Les indicateurs sont répartis en trois groupes : démographie (population en 2023, évolution de la population entre 2008 et 2023, densité en 2023), économie (nombre de lits touristiques) et environnement (pollution lumineuse, espaces protégés).",
    ],
    actions: [
      "J'ai recueilli les besoins et rédigé les cahiers des charges technique et fonctionnel.",
      "J'ai conçu le modèle de la base commune sous PostgreSQL / PostGIS. Il s'articule autour d'une donnée centrale des PNR (contours des parcs et grille communale) ; chaque indicateur y est rattaché par un champ commun qui identifie le parc.",
      "Les indicateurs ne viennent pas des parcs : nous les avons calculés nous-mêmes, avec des traitements FME dans Data Interoperability, l'extension ETL d'ArcGIS Pro.",
      "La mise à jour est automatique. Les données démographiques arrivent directement par l'API Melodi de l'INSEE ; les autres sont récupérées dans le référentiel interne de la Région, stocké dans une géodatabase d'entreprise (SDE).",
      "Les données sont diffusées sur le portail ArcGIS Enterprise de la Région, réservé aux agents. Un site Enterprise Sites présente l'ensemble des parcs, et chaque parc a son application Experience Builder, organisée en quatre pages : fiche d'identité, démographie, environnement et économie.",
      "J'ai produit des cartes thématiques et des cartes interactives à partir de la base.",
    ],
    visuels: [
      { src: "assets/projets/hub-pnr-accueil.jpg", legende: "La page d'accueil de la plateforme des PNR de Nouvelle-Aquitaine : les cinq parcs labellisés, chacun avec sa date de création et un lien vers sa page." },
      { src: "assets/projets/hub-pnr-projets-de-parcs.jpg", legende: "Les trois projets de parc en cours (Gâtine poitevine, Marais du Littoral charentais, Montagne basque), signalés par une étiquette « projet »." },
      { src: "assets/projets/hub-pnr-page-millevaches.jpg", legende: "La page du PNR de Millevaches en Limousin : l'accès à la cartographie des indicateurs du parc et les chiffres clés (création en 2004, 124 communes, 38 746 habitants en 2023)." },
      { src: "assets/projets/hub-pnr-application-demographie.jpg", legende: "L'application du PNR de Millevaches, rubrique Démographie : nombre d'habitants par commune en 2023. Les onglets mènent à l'évolution de la population 2008-2023, à la densité et à la grille communale de densité." },
      { src: "assets/projets/hub-pnr-experience-builder.jpg", legende: "La même application en construction dans Experience Builder : quatre pages (fiche d'identité, démographie, environnement, économie) et les chiffres clés à côté de la carte." },
      { src: "assets/projets/hub-pnr-code-html.jpg", legende: "La mise en page des tuiles de la page d'accueil, écrite en HTML et CSS dans l'éditeur de code du site." },
      { src: "assets/projets/hub-pnr-marais-poitevin.jpg", legende: "PNR du Marais poitevin : 88 communes et 8 intercommunalités au 1er janvier 2026, à cheval sur la Nouvelle-Aquitaine et les Pays de la Loire." },
      { src: "assets/projets/hub-pnr-medoc.jpg", legende: "PNR Médoc : 51 communes et 4 intercommunalités au 1er janvier 2026." },
      { src: "assets/projets/hub-pnr-millevaches.jpg", legende: "PNR de Millevaches en Limousin : 124 communes et 9 intercommunalités au 1er janvier 2026." },
      { src: "assets/projets/hub-pnr-landes-de-gascogne.jpg", legende: "PNR des Landes de Gascogne : 94 communes et 7 intercommunalités au 1er janvier 2026." },
    ],
    resultat: [
      "Les agents des services de la transition écologique et des territoires disposent désormais des données sur les PNR en interne : ils ont la main dessus, travaillent directement à partir d'elles et retrouvent au même endroit les informations sur les parcs de Nouvelle-Aquitaine.",
    ],
    difficulte: [
      "Chaque application ne devait afficher qu'un seul parc, sans multiplier les cartes web.",
      "J'ai appliqué dans la carte web un filtre sur le champ qui identifie le parc, couche par couche. Ce filtre permet aussi aux agents de cibler directement les données dont ils ont besoin, et ils gagnent du temps dans leurs recherches.",
    ],
    outils: ["ArcGIS Pro", "Data Interoperability (FME)", "PostgreSQL / PostGIS", "Géodatabase d'entreprise (SDE)", "API Melodi (INSEE)", "ArcGIS Enterprise (Sites)", "Experience Builder", "HTML / CSS"],
  },
  {
    id: "zaenr",
    logo: { src: "assets/logos/cc-ouest-vosgien.png", nom: "Communauté de communes de l'Ouest Vosgien", surBlanc: true },
    titreCourt: "Zones d'accélération des énergies renouvelables",
    titre: "Repérer les zones d'accélération des énergies renouvelables",
    cadre: "Communauté de communes de l'Ouest Vosgien",
    role: "Technicien géomatique (alternance)",
    periode: "Sept. 2023 – oct. 2024",
    lieu: "Neufchâteau (88)",
    ll: [48.36, 5.70],
    couverture: null,
    vignette: { src: "assets/projets/zaenr-vignette.jpg" }, // carte de Chermisey (atlas), recadrée sur le village
    resume: "Une analyse spatiale pour aider les communes à délimiter leurs zones d'accélération des énergies renouvelables, et la mise en place d'un SIG partagé par l'intercommunalité.",
    contexte: [
      "La loi d'accélération de la production d'énergies renouvelables de mars 2023 demande aux communes de définir des zones d'accélération (ZAEnR). La communauté de communes voulait leur fournir une analyse spatiale pour appuyer ce travail.",
      "En parallèle, l'intercommunalité mettait en place un SIG mutualisé pour ses communes.",
      "La communauté de communes regroupe 70 communes autour de Neufchâteau, soit 24 512 habitants sur 729 km².",
    ],
    actions: [
      "J'ai rassemblé les couches nécessaires à l'analyse, puis je les ai croisées pour faire ressortir les zones favorables : le plan de prévention du risque inondation (PPRi), les zonages du PLUi et les sites Natura 2000.",
      "J'ai produit un atlas de cartes des ZAEnR destiné aux élus et aux communes.",
      "J'ai participé à la mise en place du SIG mutualisé sur QGIS Cloud, et j'y ai intégré des flux WMTS : le cadastre de la collectivité, le PLUi et les fonds de l'IGN.",
      "J'ai aussi travaillé sur les cartes de randonnée pédestre de l'office du tourisme.",
    ],
    visuels: [
      { src: "assets/projets/zaenr-qgis-potentiel-eolien.jpg", legende: "Dans QGIS, les zones favorables au développement de l'éolien sur le territoire de la communauté de communes." },
      { src: "assets/projets/zaenr-qgis-secteurs.jpg", legende: "Le projet QGIS de l'analyse : le territoire découpé en cinq secteurs, et les groupes de couches utilisés (enjeux rédhibitoires, contraintes, infrastructures, besoins de chaleur)." },
      { src: "assets/projets/zaenr-qgis-types-enr.jpg", legende: "Une couche par type d'énergie, nommée comme la table correspondante de la base (type_pv, type_geothermie, methanisation…)." },
      { src: "assets/projets/zaenr-qgis-couche-finale.jpg", legende: "La couche finale des zones d'accélération : 4 355 entités classées selon 12 types d'énergie renouvelable." },
      { src: "assets/projets/zaenr-mcd.jpg", legende: "Le modèle conceptuel de la base : chaque type d'énergie est relié aux communes. À droite, le script SQL de création des tables." },
      { src: "assets/projets/zaenr-geo-generateur.jpg", legende: "La carte des zones d'accélération montée dans GEO Générateur, avec ses couches classées par type d'énergie." },
      { src: "assets/projets/zaenr-portail-enr.jpg", legende: "Le Portail EnR de la CCOV ouvre sur deux applications : la consultation des ZAEnR et la saisie des nouvelles énergies renouvelables." },
      { src: "assets/projets/zaenr-application-accueil.jpg", legende: "L'application de consultation : le panneau d'accueil explique comment parcourir les zones d'accélération. Au survol d'une zone, une infobulle indique le type d'énergie." },
      { src: "assets/projets/zaenr-application-fiche-commune.jpg", legende: "Recherche d'une commune : sa fiche (code postal, code INSEE, secteur) s'ouvre à gauche et la commune est mise en évidence sur la carte." },
      { src: "assets/projets/zaenr-application-saisie.jpg", legende: "L'application de saisie, destinée aux gestionnaires du portail EnR." },
      { src: "assets/projets/zaenr-application-requeteur.jpg", legende: "Le requêteur de l'application de saisie : on combine des critères ET / OU sur les champs de la table des communes." },
    ],
    atlas: [
      { type: "Méthanisation", commune: "Punerot", src: "assets/projets/zaenr-atlas-punerot-methanisation.jpg", vignette: "assets/projets/zaenr-atlas-punerot-methanisation-vignette.jpg" },
      { type: "Réseaux de chaleur", commune: "Coussey", src: "assets/projets/zaenr-atlas-coussey-reseaux-de-chaleur.jpg", vignette: "assets/projets/zaenr-atlas-coussey-reseaux-de-chaleur-vignette.jpg" },
      { type: "Solaire thermique", commune: "Chermisey", src: "assets/projets/zaenr-atlas-chermisey-solaire-thermique.jpg", vignette: "assets/projets/zaenr-atlas-chermisey-solaire-thermique-vignette.jpg" },
    ],
    resultat: [
      "Les 70 communes de l'intercommunalité ont reçu leurs données.",
    ],
    difficulte: [
      "La principale difficulté est venue de la mise en place du SIG de la collectivité : les besoins exprimés étaient difficiles à traduire en solution technique.",
      "Pour avancer, je faisais valider chaque étape par ma tutrice lors de réunions planifiées à l'avance, avant de passer à la suivante. J'ai aussi échangé directement avec les maires qui voulaient parler des zones d'accélération. Enfin, toutes les données ont été centralisées sur QGIS Cloud, pour que les agents travaillent à partir des mêmes données de référence.",
    ],
    outils: ["QGIS", "QGIS Cloud", "ArcGIS Pro", "PostGIS", "GEO (Business Geografic)", "WMS / WFS / WMTS"],
  },
  {
    id: "sncf",
    logo: { src: "assets/logos/sncf-reseau.png", nom: "SNCF Réseau", surBlanc: true },
    titreCourt: "Données et cartographie pour le développement durable",
    titre: "Données et cartographie pour le Pôle Développement Durable",
    cadre: "SNCF Réseau (direction territoriale Occitanie)",
    role: "Assistant d'études géomatique et data (alternance)",
    periode: "Janv. – juin 2025",
    lieu: "Montpellier (34)",
    ll: [43.61, 3.88],
    couverture: null,
    resume: "Pour le Pôle Développement Durable de SNCF Réseau en Occitanie, j'ai modélisé les données de collisions faune-flore du réseau et créé le référentiel géographique des OLD, puis mis en page les cartes du projet.",
    contexte: [
      "J'étais en alternance au Pôle Prospective et Émergences de la direction territoriale Occitanie de SNCF Réseau, sur un poste d'assistant d'études géomatique et data.",
      "Le Pôle Développement Durable, en maîtrise d'ouvrage, avait besoin de données géographiques exploitables. J'étais côté maîtrise d'œuvre, chargé de concevoir et de livrer la partie géomatique.",
      "Le projet portait sur deux sujets, à l'échelle de tout le réseau d'Occitanie : les collisions faune-flore et les OLD.",
    ],
    actions: [
      "J'ai précisé le besoin avec le Pôle Développement Durable, puis modélisé les données de collisions faune-flore sur l'ensemble du réseau occitan. Je les ai intégrées dans ArcGIS Enterprise avec ArcMap, sous forme de couches que les équipes de terrain peuvent exploiter.",
      "J'ai conçu et déployé le référentiel géographique des OLD sur tout le territoire occitan. C'était la première fois que ces données étaient structurées dans le SIG de l'entreprise.",
      "[[Les OLD : que recouvre le sigle (obligations légales de débroussaillement ?) et que contient le référentiel ?]]",
      "J'ai mis en page les cartes dans ArcGIS Pro et fait leur finition graphique dans Illustrator ou Inkscape.",
      "J'ai publié des cartes web d'études sur ArcGIS Portal.",
      "Je suivais l'avancement du projet et j'en faisais le reporting sur SharePoint. Je versionnais aussi les scripts de traitement.",
      "Je répondais aussi aux autres services de la direction territoriale qui avaient besoin d'une carte ou d'un traitement de données, et j'accompagnais les agents dans l'utilisation du SIG.",
    ],
    outils: ["ArcMap", "ArcGIS Pro", "ArcGIS Enterprise / Portal", "SharePoint", "Adobe Illustrator", "Inkscape"],
  },
  {
    id: "web",
    logo: { src: "assets/logos/mca-consulting.png", nom: "MCA Consulting", surBlanc: true },
    vignette: { src: "assets/projets/web-vignette.png", fond: "#FFFFFF", legende: "Logo de MCA Consulting" },
    titreCourt: "Développement web",
    titre: "Maintenance de sites et développement d'applications mobiles",
    cadre: "MCA Consulting",
    role: "Développeur web fullstack (alternance)",
    periode: "Janv. 2022 – janv. 2023",
    lieu: "Paris (75)",
    ll: [48.86, 2.35],
    couverture: null,
    resume: "Avant la géomatique, j'ai passé un an à maintenir des sites clients et à développer des applications mobiles.",
    contexte: [
      "Avant de me former à la géomatique, j'ai travaillé un an comme développeur web en alternance chez MCA Consulting.",
    ],
    actions: [
      "Je corrigeais et faisais évoluer les sites des clients, dont la boutique en ligne d'un client qui vend des produits cosmétiques, sous PrestaShop.",
      "J'ai développé des applications mobiles.",
    ],
    resultat: [
      "C'est là que j'ai appris HTML, CSS, JavaScript et PHP. Je m'en sers aujourd'hui pour les applications cartographiques web, comme celle de mon projet sur l'accessibilité.",
    ],
    outils: ["HTML / CSS", "JavaScript", "PHP", "PrestaShop", "Git"],
  },

  /* ---------- Projets personnels ---------- */
  {
    id: "geoburkina",
    perso: true,
    statut: { libelle: "En cours", classe: "en-cours" },
    logo: { src: "assets/logos/geomessen.png", nom: "Géomessen" },
    vignette: { src: "assets/logos/geomessen-burkina-faso.png", fond: "#14343b", legende: "Logo Géomessen Burkina Faso" },
    titreCourt: "GéoBurkina, portail de données géographiques",
    titre: "Un portail open data géographique pour le Burkina Faso",
    cadre: "Projet personnel",
    role: "Conception et développement",
    periode: "2026",
    lieu: "Burkina Faso",
    ll: null,
    situation: "burkina",
    couverture: null,
    resume: "Une infrastructure de données spatiales sur le modèle de cartes.gouv.fr : les limites administratives du pays sont moissonnées automatiquement, puis diffusées en WMS, WMTS et WFS et proposées en téléchargement.",
    contexte: [
      "Je suis burkinabè, et au Burkina Faso, les données géographiques sont difficiles d'accès. C'est ce qui m'a donné l'idée de ce projet.",
      "GéoBurkina est une infrastructure de données spatiales (IDS) pour le Burkina Faso, construite sur le modèle de cartes.gouv.fr et de geOrchestra. Le public y consulte et télécharge des données géographiques publiques, diffusées selon les standards de l'OGC.",
      "C'est pour l'instant une version de démonstration, qui tourne en local sous Docker.",
    ],
    actions: [
      "J'ai conçu le modèle de données du catalogue. Le jeu de données en est le centre : sa source, ses thèmes, son état de synchronisation, ses objets géographiques et sa fiche ISO s'y rattachent. Chaque cardinalité du schéma découle d'une règle de gestion, appliquée ensuite dans le code SQL.",
      "J'ai assemblé la pile avec Docker Compose : PostgreSQL / PostGIS pour la base, GeoServer pour la diffusion WMS, WMTS et WFS, GeoNetwork pour le catalogue de métadonnées, et une passerelle Nginx devant l'ensemble.",
      "Un service de synchronisation moissonne les limites administratives sur HDX et geoBoundaries. Il revérifie les sources toutes les 24 heures et ne réimporte une couche que si la source a changé, en comparant une empreinte SHA-256 avec celle de la moisson précédente. À chaque import, il publie la couche dans GeoServer, génère sa fiche de métadonnées ISO 19139 et l'envoie à GeoNetwork par CSW-T.",
      "Les données sont stockées en WGS84 ; le WFS les reprojette à la demande en UTM 30N ou 31N. On les télécharge en GeoJSON, en Shapefile ou en GeoPackage. Le GeoPackage est préparé à l'avance, ce qui évite un traitement à la volée sur les connexions lentes. Des extraits de données mondiales (WorldCover, Copernicus DEM, WorldPop, CHIRPS…) sont aussi découpés sur l'emprise du pays.",
      "Un back-office permet de gérer le portail sans écrire de code : thèmes, fiches de métadonnées, ajout d'une source WFS, style des couches (le SLD est généré pour GeoServer), import de fichiers. Un tableau CSV ou Excel qui contient une colonne de territoire devient une carte choroplèthe, par jointure avec les limites administratives.",
    ],
    visuels: [
      { src: "assets/projets/geoburkina-accueil.jpg", legende: "L'accueil du portail : la carte en fond, et une fenêtre qui présente ce qu'on peut y faire (parcourir les données, créer des cartes, télécharger en GeoJSON, Shapefile ou GeoPackage)." },
      { src: "assets/projets/geoburkina-catalogue.jpg", legende: "Le catalogue : chaque jeu de données a son aperçu cartographique, son résumé et sa source." },
      { src: "assets/projets/geoburkina-mcd-catalogue.png", legende: "Le modèle conceptuel du catalogue et de la moisson : le jeu de données est relié à sa source, à ses thèmes (principal et secondaires), à son état de synchronisation, à son journal, à ses objets géographiques et à la surcharge de sa fiche ISO." },
      { src: "assets/projets/geoburkina-mcd-administration.png", legende: "Les entités du back-office (utilisateurs, actions, territoires, paramètres, jeton SIG, inscriptions), indépendantes du catalogue." },
      { src: "assets/projets/geoburkina-regles-de-gestion.png", legende: "Les onze règles de gestion dont découlent les cardinalités du schéma." },
    ],
    resultat: [
      "Le portail fonctionne entièrement en local. Le catalogue compte 48 jeux de données, classés en 14 thèmes.",
      "27 couches sont publiées dans GeoServer, chacune avec sa fiche ISO dans GeoNetwork, soit près de 54 000 objets. On y trouve les limites administratives à quatre niveaux (pays, régions, provinces, communes), en version officielle (COD-AB) et en version geoBoundaries, 18 jeux thématiques tirés d'OpenStreetMap, dont les écoles (11 655), les hôpitaux (697) et les cours d'eau (29 729), et une couche de l'Institut géographique du Burkina (IGB) sur les zones de suivi des ODD.",
      "Les 21 autres jeux sont des données de référence mondiales (imagerie, relief, population, climat, forêts…). Certains s'affichent directement sur la carte, d'autres se téléchargent sous forme d'extrait limité au Burkina Faso.",
    ],
    difficulte: [
      "Le portail est public et anonyme. Pourtant, le navigateur affichait par moments sa fenêtre de connexion, qui demande un identifiant et un mot de passe : un visiteur pouvait en conclure que les données étaient réservées.",
      "La cause tenait à l'architecture. La passerelle Nginx sert tout depuis une seule adresse : le portail, GeoServer, GeoNetwork et le back-office. Après une connexion à l'administration, le navigateur gardait l'identifiant et le renvoyait avec chaque requête de carte adressée à GeoServer. GeoServer refusait cet identifiant périmé et répondait par une erreur 401 avec l'en-tête WWW-Authenticate : c'est cet en-tête qui ouvre la fenêtre.",
      "Je l'ai corrigé dans la passerelle. Nginx retire l'en-tête Authorization des requêtes envoyées à GeoServer et à GeoNetwork, et masque l'en-tête WWW-Authenticate dans leurs réponses. Les consoles d'administration de ces deux outils ne passent plus par la passerelle : on les ouvre uniquement par leurs ports dédiés. Enfin, le back-office a abandonné l'authentification HTTP Basic pour un formulaire de connexion et un cookie de session signé.",
      "Ce que j'en retiens : derrière une passerelle unique, l'authentification d'un service peut gêner tous les autres. Il faut décider dès l'entrée ce qui est public et ce qui ne l'est pas.",
    ],
    outils: ["Docker Compose", "PostgreSQL 16 / PostGIS 3.4", "GeoServer 2.26", "GeoNetwork 3.12", "Nginx", "GDAL / ogr2ogr", "Bash", "Node.js", "Vite", "MapLibre GL JS", "Turf.js", "proj4js", "GeoStyler", "WMS, WMTS, WFS, CSW-T", "ISO 19139", "SLD"],
  },
  {
    id: "vision-ar",
    perso: true,
    statut: { libelle: "En cours", classe: "en-cours" },
    logo: { src: "assets/logos/geomessen.png", nom: "Géomessen" },
    vignette: { src: "assets/logos/geomessen-burkina-faso.png", fond: "#14343b", legende: "Logo Géomessen Burkina Faso" },
    titreCourt: "Vision AR, guidage piéton accessible",
    titre: "Un guidage piéton pour les personnes à mobilité réduite, dans le téléphone ou dans des lunettes connectées",
    cadre: "Projet personnel",
    role: "Conception et développement",
    periode: "2026",
    lieu: "Gennevilliers (92)",
    ll: [48.933, 2.293],
    couverture: null,
    resume: "Une application qui calcule l'itinéraire selon l'effort réel (pentes, marches, bordures de trottoir) et guide la personne dans l'image de la caméra, à la voix ou en vibrations.",
    liens: [
      { texte: "Ouvrir la démo", url: "https://hermes-bit.github.io/vision-ar-demo/", note: "La démo est faite pour un téléphone. Le guidage suit le GPS : il ne fonctionne vraiment que sur place, à Gennevilliers." },
    ],
    contexte: [
      "Vision AR s'adresse aux personnes en fauteuil roulant, malvoyantes ou malentendantes. L'itinéraire tient compte de ce qui rend un trajet difficile : pentes, dévers, marches, bordures de trottoir, revêtement. Les consignes s'affichent à l'écran ou dans des lunettes connectées (INMO Air 3, Rokid), et passent aussi par la voix et les vibrations.",
      "L'idée vient d'une étude de cas faite en cours avec des camarades de promotion. Je mène aujourd'hui le projet de mon côté.",
    ],
    actions: [
      "Le serveur d'itinéraires est écrit en Python (FastAPI), sur une base PostgreSQL / PostGIS avec pgRouting. Chaque tronçon reçoit un coût d'effort qui dépend du profil de la personne, et l'application compare l'itinéraire accessible au plus court.",
      "Le schéma de la base est construit par des migrations numérotées : réseau piéton, signalements d'obstacles, équipements (ascenseurs, entrées et toilettes accessibles, places PMR), calcul d'itinéraire.",
      "Pour la démonstration, j'ai exporté le réseau piéton de Gennevilliers depuis OpenStreetMap : 8 798 tronçons, dont les pentes sont calculées avec le RGE ALTI de l'IGN. La démo web reprend en JavaScript le moteur d'itinéraire du serveur Python, et un test automatique vérifie que les deux donnent les mêmes résultats sur ce réseau.",
      "Dans la démo, le guidage s'affiche dans l'image de la caméra : l'itinéraire est dessiné au sol, et les obstacles, marches et ascenseurs sont signalés. Si l'on s'écarte du trajet, un nouvel itinéraire est calculé. Les applications Android du téléphone et des lunettes sont écrites en Kotlin.",
    ],
    visuels: [
      { src: "assets/projets/vision-ar-demo.webp", format: "telephone", legende: "La démo en ligne, avec une position simulée à Gennevilliers : choix du profil fauteuil roulant, recherche d'une destination, puis l'itinéraire le plus accessible (1,2 km, aucune marche, pente maximale de 2,8 %)." },
      { src: "assets/projets/vision-ar-itineraire.jpg", format: "telephone", legende: "Le choix de l'itinéraire avec un profil fauteuil roulant : 380 m, aucune marche, pente maximale de 2,8 %. L'application signale aussi 50 m sur la chaussée et trois traversées sans feu sonore connu." },
      { src: "assets/projets/vision-ar-parametres.jpg", format: "telephone", legende: "Les paramètres : profil de mobilité, consignes à la voix (deux voix Piper ou celle du téléphone) et vibrations de direction." },
      { src: "assets/projets/vision-ar-demarrage.jpg", format: "telephone", legende: "L'écran de démarrage, pendant la préparation du plan." },
      "[[Le guidage dans l'image de la caméra : assets/projets/vision-ar-guidage.jpg]]",
    ],
    resultat: [
      "J'ai testé l'application sur le terrain, à Gennevilliers. Les essais ont fait apparaître des bugs, qui restent à corriger.",
    ],
    difficulte: [
      "La difficulté qui me résiste encore : faire coïncider exactement le ruban dessiné dans l'image de la caméra avec le sol réel. Le dessin est calculé à partir de la position GPS, de la boussole, de l'inclinaison du téléphone et de sa hauteur (debout ou en fauteuil) ; la moindre imprécision de l'un de ces éléments décale le ruban, et le GPS n'est précis qu'à quelques mètres.",
      "Je n'ai pas encore trouvé la solution. Je regarde pour l'instant comment d'autres projets de réalité augmentée, confrontés au même problème, l'ont traité.",
    ],
    outils: ["Python (FastAPI)", "PostgreSQL / PostGIS / pgRouting", "Kotlin / Jetpack Compose", "JavaScript", "Leaflet", "OpenStreetMap", "RGE ALTI (IGN)", "GitHub Actions"],
  },
  {
    id: "ideomes",
    perso: true,
    statut: {
      libelle: "Bloqué",
      detail: "en attente d'une autorisation",
      classe: "bloque",
      texte: [
        "Le projet est bloqué. Pour recueillir ces réponses et en tirer des statistiques, il faut l'autorisation de la structure chargée des calculs statistiques. Tant que nous n'avons pas ces droits, le projet ne peut pas avancer.",
        "[[Nom de la structure, et date de la demande d'autorisation si elle est déposée]]",
      ],
    },
    logo: { src: "assets/logos/geomessen.png", nom: "Géomessen" },
    vignette: { src: "assets/projets/ideomes-vignette.png", fond: "#14343b", legende: "Logo d'Idéomès" },
    titreCourt: "Idéomès, les besoins du quotidien localisés à la commune",
    titre: "Une application pour recueillir les besoins du quotidien au Burkina Faso et les localiser à la commune",
    cadre: "Projet personnel",
    role: "Conception et développement",
    periode: "2026",
    lieu: "Burkina Faso",
    ll: null,
    situation: "burkina",
    couverture: null,
    resume: "Un questionnaire en ligne où chacun raconte un problème de son quotidien et indique sa commune. Les réponses sont placées sur une carte des 351 communes et s'exportent en GeoJSON pour QGIS.",
    liens: [
      { texte: "Voir le code sur GitHub", url: "https://github.com/Hermes-bit/ideomes" },
    ],
    contexte: [
      "Avec Géomessen, je veux développer des applications utiles au Burkina Faso. Avant de les concevoir, il faut savoir quels problèmes les gens rencontrent au quotidien, et dans quelles communes. Idéomès sert à le leur demander.",
      "On peut répondre sans créer de compte. Le participant choisit un domaine (santé, transport, papiers, eau et électricité…), raconte la dernière difficulté qu'il a rencontrée, dit à quelle fréquence elle revient, lui donne une note de gravité et explique comment il se débrouille aujourd'hui. Il indique aussi sa région, sa province et sa commune.",
    ],
    actions: [
      "J'ai construit le référentiel territorial à partir des contours geoBoundaries (domaine public) : 13 régions, 45 provinces et 351 communes. Chaque unité garde ses codes de jointure (HASC, GID de GADM, identifiant geoBoundaries, code ISO des régions), ce qui permet de relier les réponses aux couches GADM ou geoBoundaries dans un SIG. Les contours sont compressés (coordonnées entières, codées par écarts successifs) dans un fichier de 230 Ko.",
      "Aucune position GPS n'est collectée. Une réponse est placée au point intérieur du polygone de la commune choisie (son pôle d'inaccessibilité), ou de la province si la commune manque. Ce point tombe toujours dans le polygone, ce que ne garantit pas le centroïde d'une commune de forme irrégulière : une jointure spatiale dans QGIS retrouve donc la bonne commune.",
      "Sur la carte du tableau de bord, les réponses d'une même commune sont dispersées à l'intérieur de ses limites sans les toucher, ou disposées en spirale autour du centre quand la place manque. La taille des étiquettes dépend de l'échelle affichée (pays, région ou province). Une étiquette qui en chevaucherait une autre est d'abord déplacée, puis réduite, et n'est pas dessinée si elle ne trouve toujours pas de place.",
      "Les exports sont pensés pour QGIS : les réponses en GeoJSON (un point par réponse) ou en CSV avec latitude, longitude et WKT en WGS 84, les limites administratives en GeoJSON avec le nombre de réponses par unité, et le référentiel des 409 unités avec leurs codes. Un classeur Excel réunit le tout, avec une feuille qui précise le système de coordonnées et les clés de jointure.",
      "L'application est une page statique, publiée sur GitHub Pages par GitHub Actions. Les réponses sont stockées dans PostgreSQL, via Supabase, et protégées par des règles de sécurité au niveau des lignes (Row Level Security). Le consentement est demandé avant chaque envoi, et laisser son prénom ou son numéro reste facultatif.",
      "Un second volet, écrit en Python, doit ensuite analyser les réponses avec une chaîne d'agents d'IA (LangGraph et l'API Claude) : modération, regroupement des idées proches, rattachement à la commune, priorisation. Aux étapes clés, rien n'avance sans une décision humaine. Ce volet est testé sur des réponses simulées, mais il n'est pas encore relié à la base.",
    ],
    visuels: [
      { src: "assets/projets/ideomes-accueil.jpg", format: "telephone", legende: "L'accueil de l'application sur téléphone. Répondre prend environ cinq minutes, et on peut rester anonyme." },
      { src: "assets/projets/ideomes-localisation.jpg", format: "telephone", legende: "Le participant indique où il habite : la liste des provinces dépend de la région choisie, celle des communes dépend de la province." },
    ],
    resultat: [
      "Le questionnaire, la carte et les exports sont développés, et l'application a été publiée sur GitHub Pages. La chaîne d'analyse est écrite mais pas encore branchée sur la base.",
    ],
    difficulte: [
      "Les réponses envoyées sans compte étaient refusées par la base, alors que la règle de sécurité autorisait bien un visiteur anonyme à ajouter une ligne. PostgreSQL répondait par l'erreur 42501 (droits insuffisants).",
      "L'application enregistrait chaque réponse par un « upsert », qui ajoute la ligne ou la met à jour si elle existe déjà. Sous Row Level Security, PostgreSQL exige pour cette opération une règle de mise à jour en plus de la règle d'ajout, et un visiteur anonyme n'en a pas.",
      "Je l'ai vérifié sur la base de production : la même réponse est acceptée en ajout simple et refusée en upsert. L'envoi anonyme passe désormais par un ajout simple. Un visiteur anonyme peut seulement ajouter une réponse : il ne peut ni la relire ni la modifier.",
    ],
    outils: ["JavaScript", "PostgreSQL (Supabase)", "Row Level Security", "geoBoundaries", "GeoJSON / WKT", "Python", "LangGraph", "GitHub Actions", "GitHub Pages"],
  },
];

/* Couleur de chaque type d'énergie dans l'atlas des ZAEnR, relevée sur la légende des cartes.
   Elle sert de pastille devant le nom du type. Un type absent de la liste aura une pastille grise. */
const COULEURS_ENR = {
  "Méthanisation": "#A4B4F1",
  "Réseaux de chaleur": "#EAA7A0",
  "Solaire thermique": "#E97DA6",
};

/* Compétences (page d'accueil). Chaque ligne : [catégorie, outils]. */
const COMPETENCES = [
  {
    titre: "SIG et bases de données",
    lignes: [
      ["SIG", "QGIS, ArcGIS Pro, ArcMap"],
      ["Bases de données", "PostgreSQL / PostGIS, SQL, Oracle"],
      ["Administration", "pgAdmin, DBeaver"],
      ["ETL", "FME, KNIME, Data Interoperability, GDAL / ogr2ogr"],
      ["Mise en page", "Inkscape, Photoshop"],
    ],
  },
  {
    titre: "Web SIG et développement",
    lignes: [
      ["Serveurs cartographiques", "GeoServer, QGIS Server, MapServer"],
      ["Catalogues", "GeoNetwork, ArcGIS Portal"],
      ["Applications web", "OpenLayers, Leaflet, mviewer, Lizmap, MapStore, ArcGIS Hub, Experience Builder"],
      ["Langages", "Python (Flask), SQL, JavaScript, HTML / CSS, PHP"],
      ["Déploiement", "Docker, Nginx, Git, GitHub Actions"],
    ],
  },
  {
    titre: "Conduite de projet",
    lignes: [
      ["Méthode", "Recueil des besoins, cahiers des charges, maîtrise d'œuvre, suivi des livrables"],
      ["Bureautique", "Word, Excel, PowerPoint, SharePoint"],
    ],
  },
];

/* Recommandations de mes tuteurs d'alternance (page d'accueil et page du projet concerné).
   Extraits recopiés mot pour mot des lettres ; […] marque un passage coupé.
   lettre : PDF original (lien « Lire » et « Télécharger ») ; apercu : image de sa première page. */
const RECOMMANDATIONS = [
  {
    auteur: "Dominique Louis",
    fonction: "Responsable de l'Unité Données – Information Géographique",
    structure: "Région Nouvelle-Aquitaine",
    date: "21 juillet 2026",
    projet: "hub-pnr",
    lettre: "assets/documents/recommandation-region-nouvelle-aquitaine.pdf",
    apercu: "assets/documents/recommandation-region-nouvelle-aquitaine-apercu.jpg",
    extrait: "Il dispose par ailleurs de compétences en développement qui lui ont permis d'être force de proposition sur le projet dont il a eu la charge durant son alternance, à savoir la conception et la réalisation d'un hub sur les Parcs Naturels Régionaux en Nouvelle-Aquitaine. […] Il est désormais opérationnel sur la plupart des outils de la suite ESRI utilisés par notre service. […] Je recommande donc Hermès BARRY pour toute fonction en lien avec la géomatique.",
  },
  {
    auteur: "Driss Zeroili",
    fonction: "Chargé d'études géomatique, tuteur d'alternance",
    structure: "SNCF Réseau, Montpellier",
    date: "30 juin 2025",
    projet: "sncf",
    lettre: "assets/documents/recommandation-sncf-reseau.pdf",
    apercu: "assets/documents/recommandation-sncf-reseau-apercu.jpg",
    extrait: "Durant cette période, Hermès a fait preuve d'un excellent niveau technique, démontrant rapidement une bonne maîtrise des outils SIG et des méthodes propres à notre métier. Sa capacité à assimiler les procédures et à appliquer les consignes avec rigueur a été un véritable atout pour l'équipe.",
  },
];

/* Formations (page Parcours, sous la carte), de la plus récente à la plus ancienne.
   Sources : programmes IDGEO (CPGEOM 2026-2028, TGEO 2026-2027), fiches RNCP de France Compétences,
   fiche de compétences de la licence (Paris 8, 2017).
   contenu : [intitulé, détail] ; projet : identifiant d'un projet du portfolio cité dans la validation. */
const FORMATIONS = [
  {
    titre: "Chef de projet géomatique",
    niveau: "Bac+5",
    organisme: "IDGEO, Colomiers",
    periode: "2024 – 2026",
    certification: "Titre à finalité professionnelle de niveau 7, inscrit au RNCP (n° 39877) et certifié par l'OPCO Atlas.",
    alternance: "Préparé en alternance, chez SNCF Réseau puis à la Région Nouvelle-Aquitaine.",
    obtenu: "Les quatre blocs de compétences sont validés : certificats délivrés le 15 octobre 2026.",
    intro: "La formation est découpée en quatre blocs de compétences, chacun validé séparément :",
    // Intitulés repris des certificats de compétences ; 3e valeur : le certificat en PDF
    contenu: [
      ["Piloter des projets de géomatique", "Note de cadrage et plan d'assurance qualité, planification, budget et risques, relation entre maîtrise d'ouvrage et maîtrise d'œuvre, animation de comités de pilotage, management d'équipe, veille technique et réglementaire.", "assets/documents/certificat-bloc-piloter-des-projets.pdf"],
      ["Mettre en place des bases de données à dominante géographique", "Modélisation (MCD, MLD, MPD), SQL et requêtes spatiales, qualité des données (ISO 19157, directive INSPIRE), métadonnées, catalogage et moissonnage, administration d'une base.", "assets/documents/certificat-bloc-bases-de-donnees.pdf"],
      ["Exploiter des données à dominante géographique", "Analyse spatiale (vecteur, raster, télédétection, 3D), chaînes de traitement automatisées avec un ETL ou en Python, cartographie thématique, diffusion sur le web et en tableaux de bord.", "assets/documents/certificat-bloc-exploiter-des-donnees.pdf"],
      ["Concevoir des applications et interfaces géomatiques", "Recueil des besoins et cahier des charges fonctionnel, prototypage, développement (JavaScript, Python, SQL, API), sécurité, tests et mise en production, maintenance, formation des utilisateurs.", "assets/documents/certificat-bloc-applications.pdf"],
    ],
    validation: "Chaque bloc se valide devant un jury de professionnels, à partir d'une étude de cas : un rapport, puis une soutenance orale. Pour le bloc sur les bases de données, j'ai présenté mon projet sur l'accessibilité PMR.",
    projet: "accessibilite",
    liens: [
      { texte: "Fiche RNCP 39877", url: "https://www.francecompetences.fr/recherche/rncp/39877/" },
      { texte: "Page de la formation (IDGEO)", url: "https://www.idgeo.fr/formations-certifiantes/cp-geom" },
    ],
  },
  {
    titre: "Technicien en géomatique",
    niveau: "Bac+2",
    organisme: "IDGEO, Colomiers",
    periode: "2023 – 2024",
    certification: "Titre professionnel du ministère du Travail, de niveau 5, inscrit au RNCP (n° 37103).",
    alternance: "Préparé en alternance à la Communauté de communes de l'Ouest Vosgien.",
    intro: "Le programme se déroule en modules, chacun suivi d'une période en entreprise :",
    contenu: [
      ["Les fondamentaux du SIG", "QGIS et ArcGIS Pro, systèmes de coordonnées, cartographie et sémiologie, acquisition de données (GNSS, télédétection, photogrammétrie), open data et OpenStreetMap, métadonnées (INSPIRE, GeoNetwork)."],
      ["Structurer et intégrer les données", "Modélisation (MCD, MLD, MPD), PostgreSQL / PostGIS, géodatabases ESRI, GDAL / OGR et GeoPackage, ETL avec FME, données 3D."],
      ["Diffuser les données", "Serveur cartographique GeoServer, applications web (Lizmap, solutions ArcGIS), collecte de terrain sur mobile (QField, Field Maps)."],
    ],
    validation: "Le titre se valide devant un jury de professionnels : un questionnaire professionnel, la présentation d'un projet avec la démonstration d'un SIG web, puis un entretien technique.",
    validationDetail: "[[Le projet présenté au jury du titre de technicien : lequel ?]]",
    liens: [
      { texte: "Fiche RNCP 37103", url: "https://www.francecompetences.fr/recherche/rncp/37103/" },
      { texte: "Page de la formation (IDGEO)", url: "https://www.idgeo.fr/formations-certifiantes/malt" },
    ],
  },
  {
    titre: "Licence Géographie et aménagement",
    niveau: "Bac+3",
    organisme: "Université Paris 8, Saint-Denis",
    periode: "2019 – 2023",
    intro: "Une formation universitaire à l'analyse des territoires :",
    contenu: [
      ["Géographie et aménagement", "Organisation des territoires et inégalités spatiales, enjeux environnementaux, acteurs et étapes d'une opération d'aménagement."],
      ["Méthodes", "Statistiques, cartographie et premiers pas en SIG, enquêtes de terrain (entretiens, questionnaires) pour établir un diagnostic territorial, stages de terrain dès la première année."],
    ],
    validationDetail: "[[La spécialisation suivie en fin de licence : Aménagement-Environnement ou Géographie sociale ?]]",
    liens: [
      { texte: "Fiche de compétences de la licence (PDF)", url: "https://www.univ-paris8.fr/IMG/pdf/fiche_comp_lic_ge_ographie_2017.pdf" },
    ],
  },
];

/* Lieux du parcours (carte de la page Parcours)
   kind : "pro" = entreprise (rond vert), "edu" = formation (carré orangé)
   ll : [latitude, longitude]   off : décalage du symbole en pixels (pour éviter les chevauchements)
   project : identifiant du projet lié (facultatif) */

// Logos des structures (liste des lieux et fiche de la carte). null : le numéro du lieu s'affiche à la place.
// Sources : Wikimedia Commons (Paris 8, SNCF Réseau), site de la CC de l'Ouest Vosgien, fichiers IDGEO et Région,
// site de MCA Consulting (logo passé entièrement en noir pour rester lisible sur fond blanc).
const LOGOS = {
  p8: "assets/logos/universite-paris-8.svg",
  mca: "assets/logos/mca-consulting.png",
  idgeo: "assets/logos/idgeo.png",
  ccov: "assets/logos/cc-ouest-vosgien.png",
  sncf: "assets/logos/sncf-reseau.png",
  rna: "assets/logos/region-nouvelle-aquitaine.png",
};

const PLACES = [
  {
    id: "p8", kind: "edu", org: "Université Paris 8", city: "Saint-Denis (93)",
    ll: [48.9449, 2.3627], off: [-40, -36], region: "Île-de-France", dates: "2019 – 2023",
    role: "Licence Géographie et aménagement",
    missions: ["Fondamentaux de la géographie", "Bases de l'aménagement du territoire"],
  },
  {
    id: "mca", kind: "pro", org: "MCA Consulting", city: "Paris (75)",
    ll: [48.8566, 2.3522], off: [-34, 34], region: "Île-de-France", dates: "Janv. 2022 – janv. 2023",
    role: "Développeur web fullstack (alternance)",
    missions: ["Maintenance corrective et évolutive des sites clients", "Développement d'applications mobiles"],
    project: "web",
  },
  {
    id: "idgeo", kind: "edu", org: "IDGEO", city: "Colomiers (31)",
    ll: [43.611, 1.3366], off: [0, 0], region: "Occitanie", dates: "2023 – 2026",
    role: "Technicien puis chef de projet en géomatique",
    missions: ["Titre professionnel Technicien en géomatique, Bac+2 (2023-2024)", "Titre Chef de projet géomatique, Bac+5 (2024-2026)", "Projet de certification : accessibilité PMR au standard CNIG"],
    project: "accessibilite",
  },
  {
    id: "ccov", kind: "pro", org: "Communauté de communes de l'Ouest Vosgien", city: "Neufchâteau (88)",
    ll: [48.3556, 5.6966], off: [0, 0], region: "Grand Est", dates: "Sept. 2023 – oct. 2024",
    role: "Technicien géomatique (alternance)",
    missions: ["Analyse spatiale pour les zones d'accélération des EnR", "Atlas cartographique des ZAEnR", "Base de données SIG mutualisée", "Intégration de flux WMS, WFS et WMTS", "Cartes de randonnée pour l'office du tourisme"],
    project: "zaenr",
  },
  {
    id: "sncf", kind: "pro", org: "SNCF Réseau", city: "Montpellier (34)",
    ll: [43.6108, 3.8767], off: [0, 0], region: "Occitanie", dates: "Janv. – juin 2025",
    role: "Assistant d'études géomatique et data (alternance)",
    missions: ["Pôle Prospective et Émergences, pour le Pôle Développement Durable", "Modélisation et intégration de données ferroviaires", "Cartes et cartes web d'études", "Appui cartographique aux services de la direction territoriale"],
    project: "sncf",
  },
  {
    id: "rna", kind: "pro", org: "Région Nouvelle-Aquitaine", city: "Poitiers (86)",
    ll: [46.5802, 0.3404], off: [0, 0], region: "Nouvelle-Aquitaine", dates: "Sept. 2025 – oct. 2026",
    role: "Chef de projet géomatique (alternance)",
    missions: ["Pilotage du hub de données des Parcs naturels régionaux", "Cahiers des charges technique et fonctionnel", "Modèle de données et alimentation de la base", "Mise à jour automatique des données", "Cartes thématiques et interactives"],
    project: "hub-pnr",
  },
];
