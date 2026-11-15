/**
 * KEMET-42 — données scientifiques RÉELLES uniquement.
 * Chaque valeur provient d'une page officielle NASA lue le 14 nov. 2026 ; la source et sa date de mise à jour sont conservées.
 * Rien ici n'est inventé : si une page ne donne pas une information, elle n'apparaît pas.
 * Les règles de jeu (bonus, points de vie…) sont, elles, séparées dans `rules.js` et clairement étiquetées « règle de jeu ».
 */
const SRC = {
  mars: { name: "NASA NSSDC — Mars Fact Sheet", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html", updated: "2025-05-19" },
  moon: { name: "NASA NSSDC — Moon Fact Sheet", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html", updated: "2024-01-11" },
  jezero: { name: "NASA — Jezero Crater landing site (Perseverance)", url: "https://www.nasa.gov/image-article/jezero-crater-landing-site-mars-perseverance-rover", updated: "2020-07-28" },
  gale: { name: "NASA Science — Destination for Mars rover Curiosity", url: "https://science.nasa.gov/photojournal/destination-for-mars-rover-curiosity/", updated: null },
  artemis: { name: "NASA — Candidate regions for landing next Americans on Moon (Artemis III)", url: "https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/", updated: "2024-01-08" },
  horizons: { name: "NASA/JPL — Horizons API", url: "https://ssd-api.jpl.nasa.gov/doc/horizons.html", updated: null },
};
export const SOURCES = SRC;

export const BODIES = {
  moon: {
    id: "moon", horizonsId: "301", src: SRC.moon, icon: ":i-moon:", color: "#cfd3dc",
    name: { fr: "La Lune", en: "The Moon" },
    facts: [
      { k: { fr: "Rayon moyen", en: "Mean radius" }, v: "1 737,4 km" },
      { k: { fr: "Gravité à la surface", en: "Surface gravity" }, v: "1,62 m/s²" },
      { k: { fr: "Vitesse de libération", en: "Escape velocity" }, v: "2,38 km/s" },
      { k: { fr: "Température à l'équateur", en: "Equatorial temperature" }, v: "95 K à 390 K" },
      { k: { fr: "Atmosphère", en: "Atmosphere" }, v: { fr: "extrêmement ténue (≈ 3 × 10⁻¹⁵ bar la nuit)", en: "extremely tenuous (≈ 3 × 10⁻¹⁵ bar at night)" } },
      { k: { fr: "Distance moyenne à la Terre", en: "Mean distance from Earth" }, v: "384 400 km (périgée 363 300 · apogée 405 500)" },
      { k: { fr: "Période orbitale", en: "Orbital period" }, v: "27,3217 j" },
    ],
  },
  mars: {
    id: "mars", horizonsId: "499", src: SRC.mars, icon: ":i-dot-red:", color: "#e2552b",
    name: { fr: "Mars", en: "Mars" },
    facts: [
      { k: { fr: "Rayon moyen", en: "Mean radius" }, v: "3 389,5 km" },
      { k: { fr: "Gravité à la surface", en: "Surface gravity" }, v: "3,73 m/s²" },
      { k: { fr: "Vitesse de libération", en: "Escape velocity" }, v: "5,03 km/s" },
      { k: { fr: "Durée du jour solaire", en: "Solar day length" }, v: "24,6597 h" },
      { k: { fr: "Température moyenne", en: "Mean temperature" }, v: "≈ 214 K (−59 °C)" },
      { k: { fr: "Pression en surface", en: "Surface pressure" }, v: "6,36 mb (4,0 à 8,7 selon la saison)" },
      { k: { fr: "Atmosphère", en: "Atmosphere" }, v: "CO₂ 95,1 % · N₂ 2,59 % · Ar 1,94 % · O₂ 0,16 %" },
      { k: { fr: "Lunes", en: "Moons" }, v: "2 (Phobos, Déimos)" },
      { k: { fr: "Distance au Soleil", en: "Distance from the Sun" }, v: "227,956 millions km (1,52366231 UA)" },
    ],
  },
};

/** Terrains d'atterrissage. `known` = uniquement ce que la page source affirme. `gameBonus` = règle de jeu dérivée d'un fait vérifié. */
export const SITES = {
  mars: [
    {
      id: "jezero", src: SRC.jezero, name: { fr: "Cratère Jezero", en: "Jezero Crater" }, icon: ":i-landscape:",
      known: [
        { fr: "Site d'atterrissage du rover Perseverance.", en: "Landing site of the Perseverance rover." },
        { fr: "Il y a plus de 3,5 milliards d'années, des canaux fluviaux ont débordé de la paroi du cratère et créé un lac.", en: "More than 3.5 billion years ago, river channels spilled over the crater wall and created a lake." },
        { fr: "Les scientifiques y voient un ancien delta de rivière ; l'eau a charrié des minéraux argileux dans le lac.", en: "Scientists see an ancient river delta; water carried clay minerals into the crater lake." },
        { fr: "La vie microbienne aurait pu y vivre ; des traces pourraient se trouver dans les sédiments du lac ou du rivage.", en: "Microbial life could have lived there; signs might lie in lakebed or shoreline sediments." },
      ],
      risk: { fr: "Terrain exploré par un rover : relief de cratère et de delta.", en: "Terrain explored by a rover: crater and delta relief." },
      gameBonus: { res: "food", amount: 6, why: { fr: "Un ancien lac et des argiles : un site prometteur pour la science du vivant.", en: "An ancient lake and clays: a promising site for life science." } },
    },
    {
      id: "gale", src: SRC.gale, name: { fr: "Cratère Gale · Mont Sharp", en: "Gale Crater · Mount Sharp" }, icon: ":i-mountain:",
      known: [
        { fr: "Cratère creusé par un impact massif il y a plus de 3 milliards d'années.", en: "Crater excavated by a massive impact more than 3 billion years ago." },
        { fr: "Le Mont Sharp est un empilement de couches de plus de 5 km (3 miles) de haut.", en: "Mount Sharp is a stack of layers more than 5 km (3 miles) high." },
        { fr: "Ses couches racontent l'histoire de l'environnement : certaines basses couches pourraient indiquer un ancien lac ou des sédiments soufflés par le vent.", en: "Its layers record environmental history: some lower layers might indicate an ancient lake or wind-delivered sediments." },
        { fr: "Curiosity s'y est posé le 5 août 2012 (heure du Pacifique).", en: "Curiosity landed there on 5 August 2012 (Pacific time)." },
      ],
      risk: { fr: "Terrain en pente au pied d'une montagne de couches.", en: "Sloping terrain at the foot of a layered mountain." },
      gameBonus: { res: "protection", amount: 6, why: { fr: "Le pied d'une montagne de 5 km offre des parois pour s'abriter.", en: "The foot of a 5 km mountain offers walls to shelter behind." } },
    },
  ],
  moon: [
    {
      id: "shackleton", src: SRC.artemis, name: { fr: "Pic près de Shackleton", en: "Peak Near Shackleton" }, icon: ":i-mountain:",
      known: [
        { fr: "L'une des 13 régions candidates d'Artemis III, toutes à moins de 6° de latitude du pôle Sud lunaire.", en: "One of the 13 Artemis III candidate regions, all within 6° of latitude of the lunar South Pole." },
        { fr: "Chaque région mesure environ 15 × 15 km (9,3 × 9,3 miles).", en: "Each region is about 15 × 15 km (9.3 × 9.3 miles)." },
        { fr: "Les 13 régions offrent un accès continu à la lumière du Soleil pendant la mission de 6,5 jours prévue : source d'énergie et moindres écarts de température.", en: "All 13 regions offer continuous sunlight over the planned 6.5-day mission: a power source and smaller temperature swings." },
        { fr: "Les régions d'ombre permanente voisines sont riches en ressources ; la glace d'eau peut fournir oxygène et hydrogène.", en: "Nearby permanently shadowed regions are resource-rich; water ice can supply oxygen and hydrogen." },
      ],
      risk: { fr: "Terrain jamais exploré par des humains.", en: "Terrain unexplored by humans." },
      gameBonus: { res: "energy", amount: 6, why: { fr: "Lumière solaire continue : l'énergie est abondante.", en: "Continuous sunlight: plenty of power." } },
    },
    {
      id: "faustini", src: SRC.artemis, name: { fr: "Bord du cratère Faustini (A)", en: "Faustini Rim A" }, icon: ":i-crater:",
      known: [
        { fr: "L'une des 13 régions candidates d'Artemis III près du pôle Sud lunaire (moins de 6° de latitude).", en: "One of the 13 Artemis III candidate regions near the lunar South Pole (within 6° of latitude)." },
        { fr: "Région d'environ 15 × 15 km contenant plusieurs sites d'atterrissage possibles.", en: "A region of about 15 × 15 km containing several potential landing sites." },
        { fr: "Comme les 13 régions : accès continu au Soleil pendant 6,5 jours et zones d'ombre permanente à proximité, riches en glace d'eau.", en: "Like all 13 regions: continuous sunlight over 6.5 days and nearby permanently shadowed regions rich in water ice." },
      ],
      risk: { fr: "Terrain jamais exploré par des humains.", en: "Terrain unexplored by humans." },
      gameBonus: { res: "o2", amount: 6, why: { fr: "La glace d'eau voisine peut fournir de l'oxygène.", en: "Nearby water ice can supply oxygen." } },
    },
    {
      id: "malapert", src: SRC.artemis, name: { fr: "Massif Malapert", en: "Malapert Massif" }, icon: ":i-volcano:",
      known: [
        { fr: "L'une des 13 régions candidates d'Artemis III près du pôle Sud lunaire (moins de 6° de latitude).", en: "One of the 13 Artemis III candidate regions near the lunar South Pole (within 6° of latitude)." },
        { fr: "Région d'environ 15 × 15 km contenant plusieurs sites d'atterrissage possibles.", en: "A region of about 15 × 15 km containing several potential landing sites." },
        { fr: "Comme les 13 régions : accès continu au Soleil pendant 6,5 jours.", en: "Like all 13 regions: continuous sunlight over 6.5 days." },
      ],
      risk: { fr: "Terrain jamais exploré par des humains.", en: "Terrain unexplored by humans." },
      gameBonus: { res: "protection", amount: 6, why: { fr: "Un massif offre un abri naturel (règle de jeu).", en: "A massif offers natural shelter (game rule)." } },
    },
  ],
};
export const ARTEMIS_REGIONS = ["Faustini Rim A", "Peak Near Shackleton", "Connecting Ridge", "Connecting Ridge Extension", "de Gerlache Rim 1", "de Gerlache Rim 2", "de Gerlache-Kocher Massif", "Haworth", "Malapert Massif", "Leibnitz Beta Plateau", "Nobile Rim 1", "Nobile Rim 2", "Amundsen Rim"];
