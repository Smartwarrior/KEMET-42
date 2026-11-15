/**
 * Catalogue d’incidents pédagogiques (miroir front du backend).
 * timeLimitSec = RÈGLE DE JEU, pas une durée scientifique réelle.
 * Les sources NASA sont affichées quand elles existent.
 * Texte adapté aux 7–12 ans : phrases courtes, cause → phénomène → danger → action.
 */

export const INCIDENT_CATALOG = [
  {
    id: 'power_failure',
    art: 'power_failure',
    title: { fr: 'Panne électrique', en: 'Power failure' },
    cause: {
      fr: "Un fil ou une pièce du réseau électrique a cassé.",
      en: 'A wire or a part of the power network broke.',
    },
    phenomenon: {
      fr: "L’électricité ne circule plus correctement dans la base.",
      en: 'Electricity no longer flows properly through the base.',
    },
    danger: {
      fr: 'Sans énergie, le chauffage, l’air et la radio peuvent s’arrêter.',
      en: 'Without power, heating, air and radio can stop.',
    },
    whatToDo: {
      fr: "Isoler la partie cassée ou remplacer la pièce. Puis vérifier que l’énergie revient.",
      en: 'Isolate the broken part or replace it. Then check that power returns.',
    },
    explain: {
      fr: "Une panne électrique est arrivée. Un fil a grillé. Sans électricité, le support de vie et le chauffage s’arrêtent. Coupe le mauvais circuit ou change la pièce, puis vérifie les jauges d’énergie.",
      en: "A power failure happened. A wire burned out. Without electricity, life support and heating stop. Cut off the bad circuit or change the part, then check the energy gauges.",
    },
    timeLimitSec: 45,
    urgency: 'high',
    resources: ['energy'],
    source: null,
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { energy: -20, protection: -5 },
    successEffects: { energy: 0 },
    repairCost: { energy: -5 },
    weight: 2,
    moveTarget: 'solar',
  },
  {
    id: 'oxygen_leak',
    art: 'oxygen_leak',
    title: { fr: 'Fuite d’oxygène', en: 'Oxygen leak' },
    cause: {
      fr: "Une petite fente s’est ouverte près d’une porte (sas).",
      en: 'A small crack opened near a door (airlock).',
    },
    phenomenon: {
      fr: "L’oxygène s’échappe doucement de la base.",
      en: 'Oxygen is slowly leaking out of the base.',
    },
    danger: {
      fr: "Si on ne bouche pas la fente, l’équipage risque de manquer d’air.",
      en: 'If we do not seal the crack, the crew may run out of air.',
    },
    whatToDo: {
      fr: "Trouver la fente, fermer le sas et la boucher avec du mastic.",
      en: 'Find the crack, close the airlock and seal it with sealant.',
    },
    explain: {
      fr: "Il y a une fuite d’oxygène. Une petite fente laisse s’échapper l’air. L’équipage risque de manquer d’oxygène. Trouve la fente, ferme le sas et bouche-la. Puis vérifie que la jauge d’oxygène se stabilise.",
      en: "There is an oxygen leak. A small crack lets air escape. The crew may run out of oxygen. Find the crack, close the airlock and seal it. Then check that the oxygen gauge stabilizes.",
    },
    timeLimitSec: 40,
    urgency: 'critical',
    resources: ['o2'],
    source: null,
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { o2: -18 },
    successEffects: { o2: -3 },
    repairCost: { o2: -2 },
    weight: 2,
    moveTarget: 'moxie',
  },
  {
    id: 'comm_blackout',
    art: 'comm_blackout',
    title: { fr: 'Panne de communication', en: 'Communications blackout' },
    cause: {
      fr: "Le signal radio avec la Terre est trop faible ou coupé.",
      en: 'The radio signal with Earth is too weak or cut.',
    },
    phenomenon: {
      fr: "On n’entend plus bien la Terre. Les messages n’arrivent pas.",
      en: 'We cannot hear Earth well. Messages do not arrive.',
    },
    danger: {
      fr: "Sans conseils de la Terre, l’équipage doit décider seul pendant un moment.",
      en: 'Without advice from Earth, the crew must decide alone for a while.',
    },
    whatToDo: {
      fr: "Relancer l’antenne ou passer en mode autonome (décider localement).",
      en: 'Restart the antenna or switch to autonomous mode (decide locally).',
    },
    explain: {
      fr: "Les communications avec la Terre sont coupées. Le signal est trop faible. Pendant un moment, on doit décider seuls. Relance l’antenne ou continue en mode autonome, puis vérifie que le signal revient.",
      en: "Communications with Earth are cut. The signal is too weak. For a while we must decide alone. Restart the antenna or continue in autonomous mode, then check that the signal returns.",
    },
    timeLimitSec: 50,
    urgency: 'medium',
    resources: ['energy', 'comm'],
    source: { name: 'NASA/JPL Horizons', url: 'https://ssd.jpl.nasa.gov/horizons/' },
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { energy: -5, protection: -4 },
    successEffects: { energy: -8 },
    repairCost: { energy: -8 },
    weight: 2,
    moveTarget: 'solar',
  },
  {
    id: 'dust_storm',
    art: 'dust_storm',
    title: { fr: 'Tempête de poussière martienne', en: 'Martian dust storm' },
    cause: {
      fr: "Des vents forts soulèvent la poussière du sol de Mars.",
      en: 'Strong winds lift dust from the surface of Mars.',
    },
    phenomenon: {
      fr: "La poussière cache une partie de la lumière du Soleil. Les panneaux solaires produisent moins d’énergie.",
      en: 'Dust hides some of the sunlight. Solar panels produce less energy.',
    },
    danger: {
      fr: "Moins d’énergie : risque pour le chauffage, l’air et les systèmes de la base.",
      en: 'Less energy: risk for heating, air and base systems.',
    },
    whatToDo: {
      fr: "Réduire la consommation d’énergie et protéger l’équipage dans l’abri si besoin.",
      en: 'Reduce energy use and protect the crew in the shelter if needed.',
    },
    explain: {
      fr: "Une tempête de poussière arrive sur Mars. De forts vents soulèvent la poussière. La poussière cache une partie de la lumière du Soleil. Les panneaux solaires produisent moins d’énergie. Tu peux réduire la consommation d’énergie et protéger l’équipage dans l’abri. (Source NASA : les tempêtes de poussière réduisent vraiment la lumière qui arrive aux panneaux solaires.)",
      en: "A dust storm is arriving on Mars. Strong winds lift the dust. The dust hides some sunlight. Solar panels produce less energy. You can reduce energy use and protect the crew in the shelter. (NASA source: dust storms really reduce the light that reaches solar panels.)",
    },
    timeLimitSec: 55,
    urgency: 'high',
    resources: ['energy'],
    source: {
      name: 'NASA — Martian dust storms & solar power',
      url: 'https://www.nasa.gov/solar-system/the-fact-and-fiction-of-martian-dust-storms/',
    },
    destinations: ['MARS'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { energy: -22, food: -5 },
    successEffects: { energy: -8, food: -2 },
    repairCost: { energy: -3 },
    weight: 3,
    shelterRecommended: true,
    moveTarget: 'solar',
  },
  {
    id: 'solar_flare',
    art: 'solar_flare',
    title: { fr: 'Éruption solaire et radiation', en: 'Solar flare and radiation' },
    cause: {
      fr: "Le Soleil a envoyé une bouffée de particules énergétiques.",
      en: 'The Sun sent a burst of energetic particles.',
    },
    phenomenon: {
      fr: "Des radiations plus fortes arrivent vers la base.",
      en: 'Stronger radiation is arriving toward the base.',
    },
    danger: {
      fr: "Les radiations peuvent endommager les tissus et l’électronique si on reste exposé.",
      en: 'Radiation can harm people and electronics if we stay exposed.',
    },
    whatToDo: {
      fr: "Rejoindre rapidement l’abri blindé et y rester jusqu’à la fin de l’alerte.",
      en: 'Go quickly to the shielded shelter and stay until the alert ends.',
    },
    explain: {
      fr: "Une éruption solaire a eu lieu. Le Soleil envoie des rayons dangereux. Les radiations arrivent vers la base. L’équipage doit se protéger. Va dans l’abri blindé tout de suite. C’est la meilleure protection contre les radiations solaires.",
      en: "A solar flare happened. The Sun is sending dangerous rays. Radiation is arriving at the base. The crew must protect itself. Go into the shielded shelter right away. That is the best protection against solar radiation.",
    },
    timeLimitSec: 35,
    urgency: 'critical',
    resources: ['protection'],
    source: { name: 'NASA DONKI / Space Radiation', url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { protection: -25 },
    successEffects: { protection: -5, energy: -4 },
    repairCost: { energy: -4 },
    weight: 2,
    shelterRequired: true,
    moveTarget: 'shield',
  },
  {
    id: 'greenhouse_contam',
    art: 'food_shortage',
    title: { fr: 'Contamination de la serre', en: 'Greenhouse contamination' },
    cause: {
      fr: "Un champignon ou une contamination est apparu dans un bac de plantes.",
      en: 'A fungus or contamination appeared in a plant tray.',
    },
    phenomenon: {
      fr: "Des plantes de la serre sont malades.",
      en: 'Some plants in the greenhouse are sick.',
    },
    danger: {
      fr: "On peut perdre une partie de la récolte. La contamination peut s’étendre.",
      en: 'We may lose part of the harvest. The contamination can spread.',
    },
    whatToDo: {
      fr: "Isoler les plantes malades, nettoyer la zone, puis vérifier le reste de la récolte.",
      en: 'Isolate the sick plants, clean the area, then check the rest of the harvest.',
    },
    explain: {
      fr: "La serre a un problème. Des plantes sont malades (champignon ou contamination). Si on ne fait rien, on risque de perdre de la nourriture. Isole les bacs malades, nettoie, et vérifie que le reste de la serre va bien. La NASA cultive aussi des plantes dans des boîtes fermées dans l’espace.",
      en: "The greenhouse has a problem. Some plants are sick (fungus or contamination). If we do nothing, we may lose food. Isolate the sick trays, clean, and check that the rest of the greenhouse is fine. NASA also grows plants in closed boxes in space.",
    },
    timeLimitSec: 50,
    urgency: 'medium',
    resources: ['food'],
    source: {
      name: 'NASA Veggie / Advanced Plant Habitat',
      url: 'https://www.nasa.gov/mission/veggie-plant-growth-system/',
    },
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { food: -15 },
    successEffects: { food: -3, energy: -3 },
    repairCost: { energy: -3 },
    weight: 2,
    moveTarget: 'greenhouse',
  },
  {
    id: 'food_shortage',
    art: 'food_shortage',
    title: { fr: 'Manque de nourriture', en: 'Food shortage' },
    cause: {
      fr: "Il reste moins de nourriture que prévu pour l’équipage.",
      en: 'There is less food left than planned for the crew.',
    },
    phenomenon: {
      fr: "Les stocks de nourriture baissent trop vite.",
      en: 'Food stocks are dropping too fast.',
    },
    danger: {
      fr: "Si on n’agit pas, l’équipage aura faim et sera plus faible.",
      en: 'If we do nothing, the crew will be hungry and weaker.',
    },
    whatToDo: {
      fr: "Rationner un peu ou traiter la serre pour récupérer de la production.",
      en: 'Ration a little or treat the greenhouse to recover production.',
    },
    explain: {
      fr: "Il y a un manque de nourriture. Les stocks baissent trop vite. L’équipage risque d’avoir faim. Tu peux rationner un peu pour tenir, ou soigner la serre pour produire plus. Sur Mars et la Lune, on ne peut pas cultiver dehors : il faut une serre fermée.",
      en: "There is a food shortage. Stocks are dropping too fast. The crew may go hungry. You can ration a little to hold on, or care for the greenhouse to produce more. On Mars and the Moon, you cannot grow plants outside: you need a closed greenhouse.",
    },
    timeLimitSec: 50,
    urgency: 'medium',
    resources: ['food'],
    source: {
      name: 'NASA Veggie / Advanced Plant Habitat',
      url: 'https://www.nasa.gov/mission/veggie-plant-growth-system/',
    },
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { food: -12, protection: -3 },
    successEffects: { food: -4 },
    repairCost: { energy: -2 },
    weight: 2,
    moveTarget: 'greenhouse',
  },
  {
    id: 'ice_discovery',
    art: 'ice_discovery',
    title: { fr: 'Découverte de glace', en: 'Ice discovery' },
    cause: {
      fr: "Les capteurs ont détecté de la glace d’eau dans le sol ou un cratère.",
      en: 'Sensors detected water ice in the ground or a crater.',
    },
    phenomenon: {
      fr: "On a trouvé de la glace d’eau utile pour la mission.",
      en: 'We found water ice that is useful for the mission.',
    },
    danger: {
      fr: "Ce n’est pas un danger, mais un choix : comment utiliser cette ressource.",
      en: 'This is not a danger, but a choice: how to use this resource.',
    },
    whatToDo: {
      fr: "Choisir : utiliser l’eau pour la serre, ou pour de la protection / du support de vie.",
      en: 'Choose: use the water for the greenhouse, or for protection / life support.',
    },
    explain: {
      fr: "Bonne nouvelle : on a trouvé de la glace d’eau. Sur Mars et la Lune, la glace peut servir à faire de l’oxygène, de l’hydrogène ou de l’eau pour les plantes. Choisis comment l’utiliser : serre ou protection. La NASA s’intéresse beaucoup à la glace lunaire et martienne.",
      en: "Good news: we found water ice. On Mars and the Moon, ice can be used to make oxygen, hydrogen or water for plants. Choose how to use it: greenhouse or protection. NASA is very interested in lunar and Martian ice.",
    },
    timeLimitSec: 60,
    urgency: 'low',
    resources: ['food', 'protection'],
    source: {
      name: 'NASA Mars Exploration / Artemis',
      url: 'https://mars.nasa.gov/',
    },
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: {},
    successEffects: { food: 6, protection: 4 },
    repairCost: { energy: -2 },
    weight: 2,
    moveTarget: 'greenhouse',
  },
  {
    id: 'life_support_fail',
    art: 'oxygen_leak',
    title: { fr: 'Alarme support de vie', en: 'Life support alarm' },
    cause: {
      fr: "Un filtre ou un système de contrôle de l’air a un problème.",
      en: 'A filter or an air control system has a problem.',
    },
    phenomenon: {
      fr: "La qualité de l’air dans la base se dégrade (CO₂ trop haut ou O₂ trop bas).",
      en: 'Air quality in the base is getting worse (CO₂ too high or O₂ too low).',
    },
    danger: {
      fr: "L’équipage risque de mal respirer si on ne corrige pas vite.",
      en: 'The crew may have trouble breathing if we do not fix it quickly.',
    },
    whatToDo: {
      fr: "Remplacer le filtre ou relancer le système, puis vérifier la qualité de l’air.",
      en: 'Replace the filter or restart the system, then check air quality.',
    },
    explain: {
      fr: "L’alarme du support de vie s’est déclenchée. L’air de la base n’est plus assez bon. L’équipage risque de mal respirer. Change le filtre ou relance le système, puis regarde les jauges d’oxygène.",
      en: "The life support alarm went off. The air in the base is no longer good enough. The crew may have trouble breathing. Change the filter or restart the system, then check the oxygen gauges.",
    },
    timeLimitSec: 40,
    urgency: 'critical',
    resources: ['o2'],
    source: null,
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: { o2: -15, protection: -4 },
    successEffects: { o2: -2 },
    repairCost: { energy: -3 },
    weight: 2,
    moveTarget: 'moxie',
  },
  {
    id: 'calm_sol',
    art: 'calm_sol',
    title: { fr: 'Sol calme', en: 'Calm Sol' },
    cause: {
      fr: "Les capteurs n’ont détecté aucun gros phénomène aujourd’hui.",
      en: 'Sensors detected no major phenomenon today.',
    },
    phenomenon: {
      fr: "La journée est calme. C’est une bonne fenêtre pour travailler.",
      en: 'The day is calm. It is a good window to work.',
    },
    danger: {
      fr: "Aucun danger immédiat. Profite-en pour renforcer la base.",
      en: 'No immediate danger. Use it to strengthen the base.',
    },
    whatToDo: {
      fr: "Charger les batteries, soigner la serre, ou construire un module utile.",
      en: 'Charge batteries, tend the greenhouse, or build a useful module.',
    },
    explain: {
      fr: "Aujourd’hui le Sol est calme. Aucun gros phénomène n’est détecté. C’est le bon moment pour charger l’énergie, s’occuper de la serre ou construire. Les jours calmes existent aussi dans les vraies missions NASA.",
      en: "Today the Sol is calm. No major phenomenon is detected. It is a good time to charge energy, tend the greenhouse or build. Calm days also exist in real NASA missions.",
    },
    timeLimitSec: 60,
    urgency: 'low',
    resources: [],
    source: null,
    destinations: ['BOTH'],
    stages: ['diagnose', 'instruct', 'move', 'repair', 'result'],
    failEffects: {},
    successEffects: { energy: 4 },
    repairCost: {},
    weight: 1,
    moveTarget: 'solar',
  },
];

export function catalogFor(id) {
  return INCIDENT_CATALOG.find((i) => i.id === id) || null;
}

export function pickIncident(dest, rng, excludeId) {
  const d = (dest || 'mars').toLowerCase() === 'moon' ? 'MOON' : 'MARS';
  const pool = INCIDENT_CATALOG.filter(
    (i) => (i.destinations.includes('BOTH') || i.destinations.includes(d)) && i.id !== excludeId
  );
  if (!pool.length) return null;
  const total = pool.reduce((s, i) => s + (i.weight || 1), 0);
  let r = rng() * total;
  for (const inc of pool) {
    r -= inc.weight || 1;
    if (r <= 0) return { ...inc };
  }
  return { ...pool[pool.length - 1] };
}

export const DID_YOU_KNOW = [
  {
    fr: "Le savais-tu ? La NASA fait pousser des salades dans l'espace dans une boîte appelée Veggie.",
    en: "Did you know? NASA grows salad in space in a box called Veggie.",
    url: "https://www.nasa.gov/mission/veggie-plant-growth-system/",
  },
  {
    fr: "Le savais-tu ? Un message vers Mars met beaucoup de minutes à arriver. Ce n'est pas instantané !",
    en: "Did you know? A message to Mars takes many minutes to arrive. It is not instant!",
    url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
  },
  {
    fr: "Le savais-tu ? Sur la Lune, la nuit dure environ 14 jours sur Terre, sans soleil.",
    en: "Did you know? On the Moon, night lasts about 14 Earth days, with no sun.",
    url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  },
  {
    fr: "Le savais-tu ? Un robot sur Mars a fabriqué un peu d'oxygène avec l'air de Mars.",
    en: "Did you know? A robot on Mars made a little oxygen from Mars air.",
    url: "https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/",
  },
];
