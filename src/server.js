// /home/berry/Bureau/kemet-42/src/server.js
// Backend officiel KEMET-42 - NASA Space Apps Challenge
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ====================================================================
// 1. DONNÉES SCIENTIFIQUES NASA COMPARATIVES : LUNE VS MARS
// Sources : NASA Artemis Plan, NASA Mars Exploration, Human Research Roadmap
// ====================================================================
const DESTINATIONS = {
  MOON: {
    name: "Avant-Poste Lunaire Artemis (Pôle Sud)",
    travelDurationDays: 3,
    distanceKm: 384400,
    nightDurationHours: 354, // 14 jours terrestres de nuit continue !
    nightTempC: -173,
    dayTempC: 127,
    atmosphere: "Aucune (Vide spatial)",
    mainThreat: "Nuit noire de 14 jours sans soleil et poussière abrasive coupante (régolithe lunaire).",
    recommendedPower: "Mini-réacteur Kilopower obligatoire pour survivre aux 14 jours de nuit."
  },
  MARS: {
    name: "Avant-Poste Martien KEMET-42 (Cratère Jezero)",
    travelDurationDays: 210, // ~7 mois de transit
    distanceKm: 225000000,
    dayNightCycleHours: 24.6, // Sol martien de 24h39m
    nightTempC: -90,
    dayTempC: 20,
    atmosphere: "95% CO2 (Pressurisation MOXIE indispensable)",
    mainThreat: "Tempêtes de poussière globales bloquant le soleil pendant des mois et radiations cosmiques.",
    recommendedPower: "Mix solaire et batteries à haute capacité de stockage."
  }
};

// État en mémoire de la mission en cours
let currentMission = {
  phase: "EMBARKATION", // 'EMBARKATION', 'TRANSIT', 'SURFACE_SURVIVAL', 'MISSION_COMPLETE', 'FAILED'
  crewCount: 4,
  destination: null,
  solDay: 0,
  
  // 4 Jauges contradictoires (Standards NASA)
  oxygenKg: 200.0,       // 0.8 kg / astronaute / jour
  waterLiters: 600.0,    // 2.5 L / astronaute / jour
  foodKg: 400.0,         // 1.8 kg / astronaute / jour
  powerKwh: 100.0,       // Énergie des batteries (%)
  radiationShield: 100,  // Intégrité du bouclier RadLab (%)
  
  cargoConfig: null,
  activeAlert: null
};

// ====================================================================
// 2. ROUTE : PHASE 1 - BRIEFING D'EMBARQUEMENT AU SOL
// ====================================================================
app.get('/api/mission/briefing', (req, res) => {
  res.json({
    success: true,
    title: "Centre Spatial - Préparation de l'Équipage KEMET-42",
    instructions: "Cadet, avant d'embarquer dans la navette, configurez votre cargaison et choisissez votre destination finale.",
    crewCapacity: 4,
    destinationsAvailable: [
      { id: "MOON", label: "Lune - Pôle Sud (Programme Artemis)", data: DESTINATIONS.MOON },
      { id: "MARS", label: "Mars - Cratère Jezero (Mission Kemet-42)", data: DESTINATIONS.MARS }
    ],
    cargoOptions: [
      { id: "cargo_kilopower", name: "Mini-Réacteur Nucléaire Kilopower", massKg: 1500, benefit: "Énergie continue sans soleil" },
      { id: "cargo_greenhouse", name: "Dôme Serre Hydroponique (Veggie)", massKg: 800, benefit: "+8 kg de nourriture fraîche par jour" },
      { id: "cargo_extra_o2", name: "Réserves d'Oxygène Cryogénique", massKg: 500, benefit: "+150 kg d'O2 de sécurité" }
    ]
  });
});

// ====================================================================
// 3. ROUTE : PHASE 2 - DÉCOLLAGE & CHOIX DE DESTINATION
// ====================================================================
app.post('/api/mission/launch', (req, res) => {
  const { destinationId, crewCount = 4, selectedCargo = [] } = req.body;

  if (!DESTINATIONS[destinationId]) {
    return res.status(400).json({ success: false, error: "Destination inconnue. Choisissez 'MOON' ou 'MARS'." });
  }

  currentMission.destination = DESTINATIONS[destinationId];
  currentMission.destinationId = destinationId;
  currentMission.crewCount = crewCount;
  currentMission.cargoConfig = selectedCargo;
  currentMission.phase = "SURFACE_SURVIVAL";
  currentMission.solDay = 1;

  // Bonus de cargaison
  if (selectedCargo.includes("cargo_extra_o2")) {
    currentMission.oxygenKg += 150;
  }

  res.json({
    success: true,
    message: `🚀 DÉCOLLAGE RÉUSSI ! La navette a atterri sur : ${currentMission.destination.name}`,
    mission: currentMission
  });
});

// ====================================================================
// 4. ROUTE : ÉTAT EN DIRECT DES 4 JAUGES CRITIQUES
// ====================================================================
app.get('/api/mission/status', (req, res) => {
  res.json({
    success: true,
    data: currentMission,
    nasa_standards: {
      o2_daily_rate: "0.8 kg/pers/jour",
      water_daily_rate: "2.5 L/pers/jour (recyclé à 98%)",
      food_daily_rate: "1.8 kg/pers/jour"
    }
  });
});

// ====================================================================
// 5. ROUTE : AVANCER D'UN JOUR DE MISSION (Calcul réaliste des compromis)
// ====================================================================
app.post('/api/mission/next-day', (req, res) => {
  if (currentMission.phase !== "SURFACE_SURVIVAL") {
    return res.status(400).json({ success: false, error: "La mission n'a pas encore atterri." });
  }

  const crew = currentMission.crewCount;
  
  // Consommation humaine quotidienne selon les ratios NASA
  const o2Used = +(crew * 0.8).toFixed(2);
  const waterUsed = +(crew * 2.5 * 0.02).toFixed(2); // 98% recyclé par ECLSS
  const foodUsed = +(crew * 1.8).toFixed(2);

  currentMission.oxygenKg = Math.max(0, +(currentMission.oxygenKg - o2Used).toFixed(2));
  currentMission.waterLiters = Math.max(0, +(currentMission.waterLiters - waterUsed).toFixed(2));
  currentMission.foodKg = Math.max(0, +(currentMission.foodKg - foodUsed).toFixed(2));
  currentMission.solDay += 1;

  // Défi spécifique à la destination
  if (currentMission.destinationId === "MOON") {
    // Si la nuit lunaire commence, l'énergie solaire chute à 0
    if (currentMission.solDay % 28 > 14) {
      currentMission.powerKwh = Math.max(0, currentMission.powerKwh - 25);
      currentMission.activeAlert = "🌑 NUIT LUNAIRE ACTIVE (-173°C) : Les panneaux solaires ne produisent rien ! Chauffage des modules au maximum.";
    } else {
      currentMission.powerKwh = Math.min(100, currentMission.powerKwh + 15);
      currentMission.activeAlert = null;
    }
  } else {
    // Mars : tempête de poussière possible
    if (Math.random() < 0.2) {
      currentMission.powerKwh = Math.max(0, currentMission.powerKwh - 30);
      currentMission.activeAlert = "🌪️ TEMPÊTE DE POUSSIÈRE MARTIENNE : Les panneaux solaires sont recouverts d'oxyde de fer. Baisse de puissance de 30% !";
    } else {
      currentMission.activeAlert = null;
    }
  }

  // Vérification de survie
  if (currentMission.oxygenKg <= 0 || currentMission.foodKg <= 0 || currentMission.powerKwh <= 0) {
    currentMission.phase = "FAILED";
  }

  res.json({
    success: true,
    sol: currentMission.solDay,
    consumed: { o2: o2Used, water: waterUsed, food: foodUsed },
    mission: currentMission
  });
});

// ====================================================================
// 6. ROUTE : RÉINITIALISER LA MISSION
// ====================================================================
app.post('/api/mission/reset', (req, res) => {
  currentMission = {
    phase: "EMBARKATION",
    crewCount: 4,
    destination: null,
    solDay: 0,
    oxygenKg: 200.0,
    waterLiters: 600.0,
    foodKg: 400.0,
    powerKwh: 100.0,
    radiationShield: 100,
    cargoConfig: null,
    activeAlert: null
  };
  res.json({ success: true, message: "Mission réinitialisée à l'embarquement." });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend KEMET-42 démarré sur http://localhost:${PORT}`);
  console.log(`📋 Route Embarquement : http://localhost:${PORT}/api/mission/briefing`);
  console.log(`🛰️ Route Décollage : http://localhost:${PORT}/api/mission/launch`);
  console.log(`📊 Route Statut 4 Jauges : http://localhost:${PORT}/api/mission/status`);
});
