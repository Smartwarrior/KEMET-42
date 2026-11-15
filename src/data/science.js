/**
 * KEMET-42 — données scientifiques réelles et vérifiables.
 * Chaque entrée porte : valeur, unité, source, URL, date d'accès, statut (live|archive|fallback).
 * Les règles de jeu sont étiquetées séparément (« règle de jeu » / « simplification pédagogique »).
 * Rien n'est inventé ici.
 */

const ACCESS = '2026-11-14';

const SRC = {
  marsFact: {
    name: 'NASA NSSDC — Mars Fact Sheet',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
    updated: '2025-05-19',
  },
  moonFact: {
    name: 'NASA NSSDC — Moon Fact Sheet',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
    updated: '2024-01-11',
  },
  donki: {
    name: 'NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)',
    url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    updated: null,
  },
  veggie: {
    name: 'NASA — Veggie plant growth system',
    url: 'https://www.nasa.gov/mission/veggie-plant-growth-system/',
    updated: null,
  },
  aph: {
    name: 'NASA — Advanced Plant Habitat',
    url: 'https://www.nasa.gov/missions/station/iss-research/advanced-plant-habitat/',
    updated: null,
  },
  radiation: {
    name: 'NASA — Space Radiation',
    url: 'https://www.nasa.gov/feature/space-radiation',
    updated: null,
  },
  hrp: {
    name: 'NASA Human Research Program',
    url: 'https://www.nasa.gov/hrp',
    updated: null,
  },
  artemis: {
    name: 'NASA Artemis Program',
    url: 'https://www.nasa.gov/artemis/',
    updated: null,
  },
  marsExpl: {
    name: 'NASA Mars Exploration Program',
    url: 'https://mars.nasa.gov/',
    updated: null,
  },
  moxie: {
    name: 'NASA — MOXIE (Mars Oxygen In-Situ Resource Utilization Experiment)',
    url: 'https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/',
    updated: null,
  },
  horizons: {
    name: 'NASA/JPL Horizons',
    url: 'https://ssd.jpl.nasa.gov/horizons/',
    updated: null,
  },
};

function datum(name, value, unit, sourceKey, extra = {}) {
  const src = SRC[sourceKey];
  return {
    name,
    value,
    unit,
    source: src.name,
    url: src.url,
    accessed: ACCESS,
    updated: src.updated,
    status: extra.status || 'archive',
    note: extra.note || null,
    tag: extra.tag || 'scientific', // scientific | game_rule | pedagogical_simplify
  };
}

const BODIES = {
  MOON: {
    id: 'MOON',
    name: { fr: 'Lune', en: 'Moon' },
    gravity: datum('Gravité de surface', 1.62, 'm/s²', 'moonFact'),
    atmosphere: datum('Atmosphère', 'extrêmement ténue (~3e-15 bar)', '', 'moonFact'),
    dayLength: datum('Jour lunaire (période synodique)', 29.53, 'jours terrestres', 'moonFact', {
      note: 'Une nuit lunaire dure ~14 jours terrestres sans lumière solaire.',
    }),
    tempDay: datum('Température diurne (équateur)', 127, '°C', 'moonFact'),
    tempNight: datum('Température nocturne', -173, '°C', 'moonFact'),
    distance: datum('Distance moyenne Terre–Lune', 384400, 'km', 'moonFact'),
    lightTime: datum('Délai de communication (aller simple)', 1.3, 's', 'moonFact', {
      note: 'Valeur moyenne. Le jeu utilise ~2 min comme contrainte pédagogique.',
      tag: 'pedagogical_simplify',
    }),
    mainRisks: [
      'Nuit de 14 jours sans énergie solaire',
      'Régolithe abrasif',
      'Radiations (pas d’atmosphère ni de champ magnétique global)',
      'Températures extrêmes',
    ],
    icePotential: 'Glace d’eau confirmée dans les régions polaires ombragées en permanence (Artemis).',
    sources: [SRC.moonFact, SRC.artemis],
  },
  MARS: {
    id: 'MARS',
    name: { fr: 'Mars', en: 'Mars' },
    gravity: datum('Gravité de surface', 3.71, 'm/s²', 'marsFact'),
    atmosphere: datum('Atmosphère', '95 % CO₂, pression ~0,6 % de la Terre', '', 'marsFact'),
    dayLength: datum('Sol martien', 24.66, 'heures', 'marsFact'),
    tempDay: datum('Température diurne typique', 20, '°C', 'marsFact', {
      note: 'Varie fortement selon latitude et saison.',
    }),
    tempNight: datum('Température nocturne typique', -90, '°C', 'marsFact'),
    distance: datum('Distance moyenne Terre–Mars', 225e6, 'km', 'marsFact', {
      note: 'Varie de ~55 à ~400 millions de km selon les positions orbitales.',
    }),
    lightTime: datum('Délai de communication (aller simple)', 12.5, 'min', 'marsFact', {
      note: 'Ordre de grandeur moyen. Peut atteindre ~22 min. Le jeu utilise 14 min.',
      tag: 'pedagogical_simplify',
    }),
    mainRisks: [
      'Tempêtes de poussière globales (peuvent durer des mois)',
      'Radiations cosmiques et solaires',
      'Pression trop faible pour l’eau liquide en surface',
      'Perchlorates dans le sol (toxiques pour les cultures non protégées)',
    ],
    icePotential: 'Glace d’eau abondante aux pôles et en sous-sol (données MRO, Phoenix, etc.).',
    sources: [SRC.marsFact, SRC.marsExpl],
  },
};

/** Consommations ISS / NASA HRP — ordres de grandeur documentés */
const CREW_RATES = {
  o2KgPerPersonDay: datum('O₂ consommé', 0.84, 'kg/pers/jour', 'hrp', {
    note: 'Valeur typique ECLSS / études HRP. Le jeu utilise 0,8 kg.',
  }),
  waterLPerPersonDay: datum('Eau (besoin brut)', 2.5, 'L/pers/jour', 'hrp', {
    note: 'Avec recyclage ~98 % sur ISS, la consommation nette est bien plus faible.',
  }),
  foodKgPerPersonDay: datum('Nourriture', 1.8, 'kg/pers/jour', 'hrp', {
    note: 'Masse typique de rations (eau comprise selon les formats).',
  }),
};

const PLANTS = [
  {
    id: 'lettuce',
    name: { fr: 'Laitue rouge romaine', en: 'Red romaine lettuce' },
    nasaSystem: 'Veggie',
    note: 'Première culture consommée dans l’espace (Veggie, ISS).',
    source: SRC.veggie,
    cycleDaysGame: 4, // simplification pédagogique
    cycleNote: 'Règle de jeu : cycle raccourci pour rester jouable en 30 Sols.',
  },
  {
    id: 'mizuna',
    name: { fr: 'Mizuna', en: 'Mizuna' },
    nasaSystem: 'Veggie / APH',
    note: 'Brassicacée testée dans Veggie et Advanced Plant Habitat.',
    source: SRC.aph,
    cycleDaysGame: 5,
    cycleNote: 'Règle de jeu : cycle raccourci.',
  },
  {
    id: 'zinnia',
    name: { fr: 'Zinnia', en: 'Zinnia' },
    nasaSystem: 'Veggie',
    note: 'Première fleur cultivée dans Veggie (2016). Sensible à l’humidité.',
    source: SRC.veggie,
    cycleDaysGame: 6,
    cycleNote: 'Règle de jeu : cycle raccourci.',
  },
];

module.exports = {
  SRC,
  BODIES,
  CREW_RATES,
  PLANTS,
  ACCESS,
};
