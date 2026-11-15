/**
 * Catalogue d’incidents pédagogiques KEMET-42.
 * Chaque incident décrit : type, cause, danger, action attendue, temps (règle de jeu),
 * conséquences, ressources touchées, source NASA si possible, étapes de résolution.
 *
 * Le compte à rebours est une RÈGLE DE JEU, pas une durée scientifique réelle.
 */

const { SRC } = require('./science');

const STAGES = ['diagnose', 'instruct', 'move', 'repair', 'result'];

/**
 * @typedef {Object} IncidentDef
 * @property {string} id
 * @property {string} art          — clé visuelle 3D
 * @property {object} title        — { fr, en }
 * @property {object} cause
 * @property {object} danger
 * @property {object} whatToDo
 * @property {number} timeLimitSec — règle de jeu
 * @property {'low'|'medium'|'high'|'critical'} urgency
 * @property {string[]} resources  — o2 | energy | food | protection | comm
 * @property {object|null} source
 * @property {object[]} stages     — étapes pédagogiques
 * @property {object} failEffects  — effets si échec / timeout
 * @property {object} successEffects
 * @property {string[]} destinations — MOON | MARS | BOTH
 */

const INCIDENTS = [
  {
    id: 'power_failure',
    art: 'power_failure',
    title: { fr: 'Panne électrique', en: 'Power failure' },
    cause: {
      fr: 'Court-circuit sur le réseau principal de distribution.',
      en: 'Short-circuit on the primary power distribution grid.',
    },
    danger: {
      fr: 'Sans énergie, le support de vie, le chauffage et les communications s’arrêtent.',
      en: 'Without power, life support, heating and communications stop.',
    },
    whatToDo: {
      fr: 'Isoler la branche en panne ou remplacer le composant défaillant.',
      en: 'Isolate the failed branch or replace the faulty component.',
    },
    timeLimitSec: 45,
    urgency: 'high',
    resources: ['energy'],
    source: null,
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'Les voyants du tableau électrique clignotent en rouge.', en: 'Electrical panel lights are flashing red.' },
      { id: 'instruct', fr: 'Va au tableau électrique et coupe le circuit endommagé.', en: 'Go to the power panel and isolate the damaged circuit.' },
      { id: 'move', fr: 'L’astronaute se dirige vers le module énergie.', en: 'The astronaut moves toward the power module.' },
      { id: 'repair', fr: 'Réparation en cours…', en: 'Repair in progress…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { energy: -20, protection: -5 },
    successEffects: { energy: 0 },
    repairCost: { energy: -5 },
    weight: 2,
  },
  {
    id: 'oxygen_leak',
    art: 'oxygen_leak',
    title: { fr: 'Fuite d’oxygène', en: 'Oxygen leak' },
    cause: {
      fr: 'Micro-fissure sur un joint de sas d’accès.',
      en: 'A small crack opened near the door.',
    },
    danger: {
      fr: 'L’oxygène s’échappe. L’équipage risque l’hypoxie si la fuite n’est pas colmatée.',
      en: 'Air is leaking out. We must seal the crack quickly.',
    },
    whatToDo: {
      fr: 'Trouver la fente et la boucher.',
      en: 'Find the crack and seal it.',
    },
    timeLimitSec: 40,
    urgency: 'critical',
    resources: ['o2'],
    source: null,
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'L’alarme pression cabine retentit. Le taux d’O₂ baisse.', en: 'Cabin pressure alarm sounds. O₂ level is dropping.' },
      { id: 'instruct', fr: 'Équipe-toi et va inspecter le sas.', en: 'Suit up and inspect the airlock.' },
      { id: 'move', fr: 'L’astronaute se dirige vers le sas.', en: 'The astronaut heads to the airlock.' },
      { id: 'repair', fr: 'Colmatage de la fissure…', en: 'Sealing the crack…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { o2: -18 },
    successEffects: { o2: -3 },
    repairCost: { o2: -2 },
    weight: 2,
  },
  {
    id: 'comm_blackout',
    art: 'comm_blackout',
    title: { fr: 'Panne de communication', en: 'Communications blackout' },
    cause: {
      fr: 'Alignement planétaire et vents solaires perturbent la liaison avec la Terre.',
      en: 'Planetary geometry and solar wind disrupt the link with Earth.',
    },
    danger: {
      fr: 'Plus de conseils de la Terre. Le délai de signal s’ajoute au problème.',
      en: 'No more advice from Earth. Signal delay adds to the problem.',
    },
    whatToDo: {
      fr: 'Relancer l’antenne à pleine puissance ou passer en mode autonome.',
      en: 'Reboot the antenna at full power or switch to autonomous mode.',
    },
    timeLimitSec: 50,
    urgency: 'medium',
    resources: ['energy', 'comm'],
    source: { name: SRC.horizons.name, url: SRC.horizons.url },
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'Plus de signal Terre. L’antenne affiche une erreur.', en: 'No Earth signal. Antenna shows an error.' },
      { id: 'instruct', fr: 'Va à l’antenne et tente un redémarrage.', en: 'Go to the antenna and attempt a reboot.' },
      { id: 'move', fr: 'L’astronaute se dirige vers l’antenne.', en: 'The astronaut moves to the antenna.' },
      { id: 'repair', fr: 'Redémarrage de l’antenne…', en: 'Antenna reboot…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { energy: -5, protection: -4 },
    successEffects: { energy: -8 },
    repairCost: { energy: -8 },
    weight: 2,
  },
  {
    id: 'dust_storm',
    art: 'dust_storm',
    title: { fr: 'Tempête de poussière martienne', en: 'Martian dust storm' },
    cause: {
      fr: 'Une tempête de poussière masque le Soleil. Les panneaux solaires produisent beaucoup moins.',
      en: 'A dust storm hides the Sun. Solar panels produce far less power.',
    },
    danger: {
      fr: 'Pénurie d’énergie. Risque pour le chauffage et le support de vie.',
      en: 'Power shortage. Risk to heating and life support.',
    },
    whatToDo: {
      fr: 'Passer en mode économie d’énergie et protéger les équipements sensibles.',
      en: 'Switch to power-saving mode and protect sensitive equipment.',
    },
    timeLimitSec: 55,
    urgency: 'high',
    resources: ['energy'],
    source: { name: SRC.marsFact?.name || 'NASA Mars Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html' },
    destinations: ['MARS'],
    stages: [
      { id: 'diagnose', fr: 'Le ciel s’assombrit. La production solaire chute.', en: 'The sky darkens. Solar output drops.' },
      { id: 'instruct', fr: 'Active le mode économie et rentre les équipements fragiles.', en: 'Activate power-saving and secure fragile equipment.' },
      { id: 'move', fr: 'L’équipage sécurise la base.', en: 'The crew secures the base.' },
      { id: 'repair', fr: 'Mise en sécurité…', en: 'Securing systems…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { energy: -22, food: -5 },
    successEffects: { energy: -8, food: -2 },
    repairCost: { energy: -3 },
    weight: 3,
    shelterRecommended: true,
  },
  {
    id: 'solar_flare',
    art: 'solar_flare',
    title: { fr: 'Éruption solaire et radiation', en: 'Solar flare and radiation' },
    cause: {
      fr: 'Une éruption solaire envoie un flux de particules énergétiques.',
      en: 'A solar flare sends a stream of energetic particles.',
    },
    danger: {
      fr: 'Les radiations peuvent endommager les tissus et l’électronique. Il faut se protéger.',
      en: 'Radiation can damage tissue and electronics. Shelter is required.',
    },
    whatToDo: {
      fr: 'Rejoindre immédiatement l’abri blindé et attendre la fin de l’événement.',
      en: 'Go immediately to the shielded shelter and wait out the event.',
    },
    timeLimitSec: 35,
    urgency: 'critical',
    resources: ['protection'],
    source: { name: 'NASA DONKI / Space Radiation', url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'Alerte radiation ! Les dosimètres montent rapidement.', en: 'Radiation alert! Dosimeters are rising fast.' },
      { id: 'instruct', fr: 'Rejoignez l’abri anti-radiations immédiatement.', en: 'Get to the radiation shelter immediately.' },
      { id: 'move', fr: 'L’équipage se dirige vers l’abri.', en: 'The crew moves to the shelter.' },
      { id: 'repair', fr: 'Confinement en cours…', en: 'Lockdown in progress…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { protection: -25 },
    successEffects: { protection: -5, energy: -4 },
    repairCost: { energy: -4 },
    weight: 2,
    shelterRequired: true,
  },
  {
    id: 'greenhouse_contam',
    art: 'food_shortage',
    title: { fr: 'Contamination de la serre', en: 'Greenhouse contamination' },
    cause: {
      fr: 'Un champignon ou une bactérie s’est développé dans un bac hydroponique.',
      en: 'A fungus or bacteria grew in a hydroponic tray.',
    },
    danger: {
      fr: 'Perte de récolte et risque de propagation aux autres cultures.',
      en: 'Crop loss and risk of spread to other plants.',
    },
    whatToDo: {
      fr: 'Isoler le bac contaminé et stériliser le milieu de culture.',
      en: 'Isolate the contaminated tray and sterilize the growth medium.',
    },
    timeLimitSec: 50,
    urgency: 'medium',
    resources: ['food'],
    source: { name: 'NASA Veggie / Advanced Plant Habitat', url: 'https://www.nasa.gov/mission/veggie-plant-growth-system/' },
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'Des taches apparaissent sur les feuilles de la serre.', en: 'Spots appear on the greenhouse leaves.' },
      { id: 'instruct', fr: 'Isole le bac et prépare la stérilisation.', en: 'Isolate the tray and prepare sterilization.' },
      { id: 'move', fr: 'L’astronaute entre dans la serre.', en: 'The astronaut enters the greenhouse.' },
      { id: 'repair', fr: 'Traitement en cours…', en: 'Treatment in progress…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { food: -15 },
    successEffects: { food: -3, energy: -3 },
    repairCost: { energy: -3 },
    weight: 2,
  },
  {
    id: 'food_shortage',
    art: 'food_shortage',
    title: { fr: 'Manque de nourriture', en: 'Food shortage' },
    cause: {
      fr: 'Les réserves baissent plus vite que prévu (rationnement ou perte de récolte).',
      en: 'Stores are dropping faster than planned (rationing or crop loss).',
    },
    danger: {
      fr: 'Moral et santé de l’équipage en danger si la situation dure.',
      en: 'Crew morale and health at risk if the situation lasts.',
    },
    whatToDo: {
      fr: 'Rationner temporairement ou accélérer une récolte de secours.',
      en: 'Ration temporarily or accelerate an emergency harvest.',
    },
    timeLimitSec: 60,
    urgency: 'medium',
    resources: ['food'],
    source: null,
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'L’inventaire alimentaire est sous le seuil d’alerte.', en: 'Food inventory is below the alert threshold.' },
      { id: 'instruct', fr: 'Choisis : rationner ou lancer une culture rapide.', en: 'Choose: ration or start a quick crop.' },
      { id: 'move', fr: 'L’équipage organise les réserves.', en: 'The crew organizes the stores.' },
      { id: 'repair', fr: 'Mise en place du plan…', en: 'Implementing the plan…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { food: -12, protection: -4 },
    successEffects: { food: -6 },
    repairCost: {},
    weight: 2,
  },
  {
    id: 'ice_discovery',
    art: 'ice_discovery',
    title: { fr: 'Découverte de glace', en: 'Ice discovery' },
    cause: {
      fr: 'Les capteurs de forage ont repéré une poche de glace d’eau.',
      en: 'Drilling sensors detected a pocket of water ice.',
    },
    danger: {
      fr: 'Aucun danger immédiat — opportunité scientifique et logistique.',
      en: 'No immediate danger — scientific and logistical opportunity.',
    },
    whatToDo: {
      fr: 'Décider : extraire pour la serre et l’équipage, ou utiliser l’eau comme blindage.',
      en: 'Decide: extract for greenhouse and crew, or use the water as shielding.',
    },
    timeLimitSec: 70,
    urgency: 'low',
    resources: ['food', 'protection', 'o2'],
    source: { name: 'NASA Mars Exploration / Artemis polar ice', url: 'https://mars.nasa.gov/' },
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'Signal de glace pure détecté sous la surface.', en: 'Pure ice signal detected under the surface.' },
      { id: 'instruct', fr: 'Choisis comment utiliser cette ressource.', en: 'Choose how to use this resource.' },
      { id: 'move', fr: 'L’équipe prépare le forage.', en: 'The team prepares the drill.' },
      { id: 'repair', fr: 'Extraction en cours…', en: 'Extraction in progress…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: {},
    successEffects: { food: 10, o2: 3 },
    repairCost: { energy: -5 },
    weight: 2,
    positive: true,
  },
  {
    id: 'life_support_fail',
    art: 'power_failure',
    title: { fr: 'Panne d’un module de survie', en: 'Life-support module failure' },
    cause: {
      fr: 'Un ventilateur ou un filtre du système de survie s’est arrêté.',
      en: 'A fan or filter in the life-support system has stopped.',
    },
    danger: {
      fr: 'Accumulation de CO₂ et baisse de la qualité de l’air.',
      en: 'CO₂ buildup and declining air quality.',
    },
    whatToDo: {
      fr: 'Remplacer le filtre ou redémarrer le module de ventilation.',
      en: 'Replace the filter or restart the ventilation module.',
    },
    timeLimitSec: 40,
    urgency: 'high',
    resources: ['o2', 'energy'],
    source: { name: 'NASA ECLSS / HRP', url: 'https://www.nasa.gov/hrp' },
    destinations: ['BOTH'],
    stages: [
      { id: 'diagnose', fr: 'Alarme CO₂. Le module de survie signale une panne.', en: 'CO₂ alarm. Life-support module reports a fault.' },
      { id: 'instruct', fr: 'Va au module de survie et remplace le filtre.', en: 'Go to the life-support module and replace the filter.' },
      { id: 'move', fr: 'L’astronaute se dirige vers le module de survie.', en: 'The astronaut moves to the life-support module.' },
      { id: 'repair', fr: 'Remplacement du filtre…', en: 'Filter replacement…' },
      { id: 'result', fr: 'Résultat de l’intervention.', en: 'Result of the intervention.' },
    ],
    failEffects: { o2: -14, energy: -6 },
    successEffects: { o2: -2, energy: -4 },
    repairCost: { energy: -4 },
    weight: 2,
  },
];

function pickIncident(destinationId, rng = Math.random, excludeId = null) {
  const dest = String(destinationId || 'MARS').toUpperCase();
  const pool = INCIDENTS.filter(
    (i) => (i.destinations.includes('BOTH') || i.destinations.includes(dest)) && i.id !== excludeId
  );
  if (!pool.length) return null;
  const total = pool.reduce((s, i) => s + (i.weight || 1), 0);
  let r = rng() * total;
  for (const inc of pool) {
    r -= inc.weight || 1;
    if (r <= 0) return inc;
  }
  return pool[pool.length - 1];
}

module.exports = { INCIDENTS, STAGES, pickIncident };
