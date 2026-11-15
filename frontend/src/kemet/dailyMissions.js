/**
 * Missions quotidiennes interactives de KEMET-42 — Progression pédagogique STEM (7–12 ans).
 * Chaque Sol propose une quête claire avec cible 3D, effet visuel et récompense de survie.
 */

export const DAILY_MISSIONS = {
  1: {
    id: "mission_solar",
    title: { fr: "Déployer le panneau solaire à l'Est", en: "Deploy the East solar panel" },
    desc: {
      fr: "Les batteries sont faibles. Va vers la balise jaune à l'Est pour déployer notre premier générateur solaire.",
      en: "Batteries are low. Head to the yellow beacon East to deploy our first solar generator.",
    },
    voice: {
      fr: "Commandant, va vers la balise jaune à l'Est pour allumer notre premier panneau solaire !",
      en: "Commander, head to the yellow beacon East to turn on our first solar panel!",
    },
    targetPos: [14, 0],
    targetType: "solar",
    icon: ":i-sun:",
    color: "#f6c945",
    reward: { energy: 25 },
    rewardText: { fr: "+25 % Énergie ! Panneau opérationnel.", en: "+25 % Power! Solar panel active." },
  },
  2: {
    id: "mission_ice",
    title: { fr: "Extraire de l'eau du gisement de glace", en: "Extract water from the ice field" },
    desc: {
      fr: "Le rover a repéré des cristaux de glace au Nord-Est ! Va forer l'échantillon pour remplir nos réservoirs d'eau.",
      en: "The rover spotted ice crystals North-East! Drill a sample to fill our water tanks.",
    },
    voice: {
      fr: "Va vers la balise bleue au Nord-Est pour forer le gisement de glace et faire le plein d'eau !",
      en: "Head to the blue beacon North-East to drill the ice field and replenish our water!",
    },
    targetPos: [12, 14],
    targetType: "ice",
    icon: ":i-ice:",
    color: "#5ad6ff",
    reward: { water: 30 },
    rewardText: { fr: "+30 L d'Eau pure extraite du sous-sol !", en: "+30 L of pure Water extracted!" },
  },
  3: {
    id: "mission_greenhouse",
    title: { fr: "Allumer la serre hydroponique", en: "Activate the hydroponic greenhouse" },
    desc: {
      fr: "Lena a besoin d'eau et d'électricité pour faire germer nos salades spatiales. Va activer le dôme végétal à l'Ouest !",
      en: "Lena needs water and power to sprout our space veggies. Activate the crop dome West!",
    },
    voice: {
      fr: "Rejoins le dôme vert à l'Ouest pour activer la lumière des plantes dans la serre !",
      en: "Join the green dome West to turn on plant growth lights in the greenhouse!",
    },
    targetPos: [-14, 0],
    targetType: "greenhouse",
    icon: ":i-sprout:",
    color: "#7bd389",
    reward: { food: 25 },
    rewardText: { fr: "+25 kg Nourriture ! Les pousses grandissent.", en: "+25 kg Food! Space crops are growing." },
  },
  4: {
    id: "mission_dust_shelter",
    title: { fr: "Alerte tempête ! Mettre l'équipage à l'abri", en: "Dust storm! Move crew to the shelter" },
    desc: {
      fr: "Le vent souffle et la poussière arrive. Cours vers le sas de l'habitat pour abriter l'équipage !",
      en: "Winds are picking up. Run to the base airlock to shelter the crew!",
    },
    voice: {
      fr: "Alerte tempête de poussière ! Rentre vite dans le sas pour mettre tout le monde à l'abri !",
      en: "Dust storm alert! Quick, get inside the airlock to protect everyone!",
    },
    targetPos: [0, 5.2],
    targetType: "airlock",
    icon: ":i-storm:",
    color: "#ff8585",
    reward: { protection: 20 },
    rewardText: { fr: "Équipage protégé dans le sas ! Zéro blessure.", en: "Crew safe in the airlock! Zero damage." },
  },
  5: {
    id: "mission_shield",
    title: { fr: "Éruption solaire DONKI : Activer le bouclier", en: "DONKI solar flare: Activate radiation shield" },
    desc: {
      fr: "Les capteurs de la NASA détectent une bouffée de particules solaires. Active le champ magnétique au Sud !",
      en: "NASA space sensors detect solar energetic particles. Turn on the magnetic shield South!",
    },
    voice: {
      fr: "Météo solaire NASA en direct ! Active le bouclier au Sud pour protéger la base des radiations !",
      en: "Live NASA space weather! Turn on the shield South to protect the base from radiation!",
    },
    targetPos: [0, 14],
    targetType: "shield",
    icon: ":i-shield:",
    color: "#b58cff",
    reward: { protection: 25 },
    rewardText: { fr: "+25 % Bouclier actif ! Rayons cosmiques bloqués.", en: "+25 % Shield online! Cosmic rays deflected." },
  },
  6: {
    id: "mission_rover",
    title: { fr: "Inspecter et calibrer le Rover d'exploration", en: "Inspect & calibrate the Mars Rover" },
    desc: {
      fr: "Le rover a terminé sa ronde. Rejoins-le pour télécharger ses analyses de sol et recharger ses batteries.",
      en: "The rover finished its patrol. Meet it to download soil data and recharge its battery.",
    },
    voice: {
      fr: "Va rejoindre le rover d'exploration pour récupérer ses découvertes scientifiques !",
      en: "Go meet the exploration rover to download its science data!",
    },
    targetPos: [-16, 12],
    targetType: "rover",
    icon: ":i-rover:",
    color: "#f6c945",
    reward: { energy: 15, credits: 30 },
    rewardText: { fr: "+30 Crédits scientifiques et batteries rechargées !", en: "+30 Science Credits & recharged battery!" },
  },
  7: {
    id: "mission_moxie",
    title: { fr: "Démarrer le générateur d'Oxygène MOXIE", en: "Start the MOXIE Oxygen Generator" },
    desc: {
      fr: "L'air martien contient 95% de CO₂. L'instrument MOXIE va extraire de l'oxygène pur pour nos poumons. Active-le au Nord !",
      en: "Mars air has 95% CO₂. The MOXIE unit will extract pure oxygen. Turn it on North!",
    },
    voice: {
      fr: "Amara a préparé le générateur MOXIE au Nord. Va l'allumer pour fabriquer notre oxygène !",
      en: "Amara prepared the MOXIE unit North. Turn it on to produce our oxygen!",
    },
    targetPos: [0, -13],
    targetType: "moxie",
    icon: ":i-lungs:",
    color: "#4fd1c5",
    reward: { o2: 30 },
    rewardText: { fr: "+30 kg Oxygène pur extrait du CO₂ martien !", en: "+30 kg pure Oxygen extracted from Mars air!" },
  },
};

/** Retourne la mission du Sol actuel (cycle périodique enrichi) */
export function getMissionForSol(day) {
  const d = Math.max(1, day || 1);
  if (DAILY_MISSIONS[d]) return DAILY_MISSIONS[d];

  // Cycle dynamique après le Sol 7
  const cycleIndex = ((d - 1) % 7) + 1;
  const base = DAILY_MISSIONS[cycleIndex] || DAILY_MISSIONS[1];
  return {
    ...base,
    id: `${base.id}_sol${d}`,
    title: {
      fr: `Sol ${d} : ${base.title.fr}`,
      en: `Sol ${d}: ${base.title.en}`,
    },
  };
}
