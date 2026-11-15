// Backend KEMET-42 — NASA Space Apps Challenge 2026
// Aligned with the front-end contract (auth + /api/mission + scores)
// + incidents pédagogiques, assistant NOVA, abri, serre, sources science
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { getDonkiSnapshot, donkiToAlert } = require('./donki');
const { INCIDENTS, pickIncident } = require('./data/incidents');
const { BODIES, CREW_RATES, PLANTS, SRC, ACCESS } = require('./data/science');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ---------------------------------------------------------------------------
// In-memory store (demo / hackathon). Replace with DB later if needed.
// ---------------------------------------------------------------------------
const users = new Map(); // key: lowercase name → { name, hash, salt }
const scores = [];
const tokens = new Map(); // token → name

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
}

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

function authUser(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return tokens.get(m[1]) || null;
}

// ---------------------------------------------------------------------------
// Scientific reference data (NASA-aligned)
// ---------------------------------------------------------------------------
const DESTINATIONS = {
  MOON: {
    id: 'MOON',
    name: 'Avant-Poste Lunaire Artemis (Pôle Sud)',
    travelDurationDays: 3,
    distanceKm: 384400,
    lightTimeMin: 1.3,
    nightDurationHours: 354,
    nightTempC: -173,
    dayTempC: 127,
    atmosphere: 'Aucune (vide spatial)',
    mainThreat: 'Nuit de 14 jours sans soleil + régolithe abrasif.',
    recommendedPower: 'Mini-réacteur Kilopower pour survivre à la nuit.',
  },
  MARS: {
    id: 'MARS',
    name: 'Avant-Poste Martien KEMET-42 (Cratère Jezero)',
    travelDurationDays: 210,
    distanceKm: 225000000,
    lightTimeMin: 12.5,
    dayNightCycleHours: 24.6,
    nightTempC: -90,
    dayTempC: 20,
    atmosphere: '95% CO₂ — pressurisation + MOXIE indispensables',
    mainThreat: 'Tempêtes de poussière + radiations cosmiques.',
    recommendedPower: 'Mix solaire + batteries haute capacité.',
  },
};

function freshMission() {
  return {
    phase: 'EMBARKATION',
    crewCount: 4,
    destination: null,
    destinationId: null,
    solDay: 0,
    oxygenKg: 100.0,
    waterLiters: 100.0,
    foodKg: 100.0,
    powerKwh: 85.0,
    radiationShield: 95,
    cargoConfig: [],
    activeAlert: null,
    alerts: [],
    gameOver: false,
    success: false,
    // --- pedagogical extensions ---
    incident: null, // active multi-step incident
    incidentHistory: [],
    shelter: { inside: false, crewInside: 0, enteredAt: null },
    greenhouse: null, // active crop activity
    assistant: {
      level: 0, // 0=none, 1=hint, 2=explain, 3=full
      failsInRow: 0,
      lastKind: 'welcome',
      messages: [],
    },
    pedagogyLog: [],
  };
}

// Une mission par joueur (jeton) ou par invité (en-tête X-Guest-Id, sinon adresse IP).
// AsyncLocalStorage garde le bon contexte même dans les handlers asynchrones (next-day attend DONKI).
const { AsyncLocalStorage } = require('async_hooks');
const missionCtx = new AsyncLocalStorage();
const missions = new Map();
const MAX_MISSIONS = 500;
function missionKey(req) {
  const who = authUser(req);
  if (who) return 'u:' + who.toLowerCase();
  const g = String(req.headers['x-guest-id'] || '').slice(0, 64);
  return 'g:' + (g || req.ip || 'anon');
}
app.use('/api/mission', (req, _res, next) => {
  const key = missionKey(req);
  if (!missions.has(key)) {
    if (missions.size >= MAX_MISSIONS) missions.delete(missions.keys().next().value);
    missions.set(key, freshMission());
  }
  missionCtx.run({ key }, next);
});
const mine = () => missions.get(missionCtx.getStore().key);
const currentMission = new Proxy({}, {
  get: (_t, k) => mine()[k],
  set: (_t, k, v) => { mine()[k] = v; return true; },
  has: (_t, k) => k in mine(),
  ownKeys: () => Reflect.ownKeys(mine()),
  getOwnPropertyDescriptor: (_t, k) => { const d = Object.getOwnPropertyDescriptor(mine(), k); return d && { ...d, configurable: true }; },
});
function resetMission() { Object.keys(mine()).forEach((k) => delete mine()[k]); Object.assign(mine(), freshMission()); }

function applyResourceDelta(effects = {}) {
  if (effects.o2 != null) currentMission.oxygenKg = Math.max(0, +(currentMission.oxygenKg + effects.o2).toFixed(2));
  if (effects.energy != null) currentMission.powerKwh = Math.max(0, Math.min(100, +(currentMission.powerKwh + effects.energy).toFixed(1)));
  if (effects.food != null) currentMission.foodKg = Math.max(0, +(currentMission.foodKg + effects.food).toFixed(2));
  if (effects.protection != null) currentMission.radiationShield = Math.max(0, Math.min(100, currentMission.radiationShield + effects.protection));
}

function pushPedagogy(entry) {
  currentMission.pedagogyLog.push({ ...entry, at: Date.now(), sol: currentMission.solDay });
  if (currentMission.pedagogyLog.length > 50) currentMission.pedagogyLog.shift();
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
app.post('/auth/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');
  if (!name || !password) return res.status(400).json({ error: 'empty' });
  const key = name.toLowerCase();
  if (users.has(key)) return res.status(409).json({ error: 'exists' });
  const salt = crypto.randomBytes(16).toString('hex');
  users.set(key, { name, salt, hash: hashPassword(password, salt) });
  const token = makeToken();
  tokens.set(token, name);
  res.json({ token, user: { name } });
});

app.post('/auth/login', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');
  const u = users.get(name.toLowerCase());
  if (!u || u.hash !== hashPassword(password, u.salt)) {
    return res.status(401).json({ error: 'invalid' });
  }
  const token = makeToken();
  tokens.set(token, u.name);
  res.json({ token, user: { name: u.name } });
});

// ---------------------------------------------------------------------------
// SCORES
// ---------------------------------------------------------------------------
app.post('/scores', (req, res) => {
  const who = authUser(req);
  if (!who) return res.status(401).json({ error: 'unauthorized' });
  const { score, success, dest, site, sol } = req.body || {};
  scores.push({
    name: who,
    score: Number(score) || 0,
    success: !!success,
    dest: dest || null,
    site: site || null,
    sol: sol || null,
    at: Date.now(),
  });
  if (scores.length > 200) scores.shift();
  res.status(204).end();
});

app.get('/scores', (req, res) => {
  const top = [...scores].sort((a, b) => b.score - a.score).slice(0, 20);
  res.json(top);
});

// ---------------------------------------------------------------------------
// MISSION API (shapes compatible with front normalize* helpers)
// ---------------------------------------------------------------------------
app.get('/api/mission/briefing', (req, res) => {
  res.json({
    success: true,
    title: 'Centre Spatial — Préparation KEMET-42',
    instructions: 'Configure la cargaison et choisis la destination.',
    crewCapacity: 4,
    destinations: [
      { id: 'MOON', name: 'Lune — Pôle Sud (Artemis)', description: DESTINATIONS.MOON.mainThreat },
      { id: 'MARS', name: 'Mars — Cratère Jezero', description: DESTINATIONS.MARS.mainThreat },
    ],
    destinationsAvailable: [
      { id: 'MOON', label: 'Lune - Pôle Sud (Programme Artemis)', data: DESTINATIONS.MOON },
      { id: 'MARS', label: 'Mars - Cratère Jezero (Mission Kemet-42)', data: DESTINATIONS.MARS },
    ],
    cargo: [
      { id: 'cargo_kilopower', name: 'Mini-Réacteur Kilopower', massKg: 1500, description: 'Énergie continue sans soleil' },
      { id: 'cargo_greenhouse', name: 'Serre hydroponique (Veggie)', massKg: 800, description: '+8 kg nourriture / jour' },
      { id: 'cargo_extra_o2', name: 'Réserves O₂ cryogénique', massKg: 500, description: '+150 kg O₂ de sécurité' },
      { id: 'cargo_shield', name: 'Blindage anti-radiations renforcé', massKg: 900, description: '+20 % intégrité bouclier' },
    ],
    cargoOptions: [
      { id: 'cargo_kilopower', name: 'Mini-Réacteur Nucléaire Kilopower', massKg: 1500, benefit: 'Énergie continue sans soleil' },
      { id: 'cargo_greenhouse', name: 'Dôme Serre Hydroponique (Veggie)', massKg: 800, benefit: '+8 kg de nourriture fraîche par jour' },
      { id: 'cargo_extra_o2', name: "Réserves d'Oxygène Cryogénique", massKg: 500, benefit: "+150 kg d'O2 de sécurité" },
      { id: 'cargo_shield', name: 'Blindage anti-radiations renforcé', massKg: 900, benefit: '+20 % intégrité bouclier' },
    ],
  });
});

app.post('/api/mission/launch', (req, res) => {
  const { destinationId, crewCount = 4, selectedCargo = [] } = req.body || {};
  const destKey = String(destinationId || '').toUpperCase();
  if (!DESTINATIONS[destKey]) {
    return res.status(400).json({ success: false, error: "Destination inconnue. Choisis 'MOON' ou 'MARS'." });
  }

  resetMission();
  currentMission.destination = DESTINATIONS[destKey];
  currentMission.destinationId = destKey;
  currentMission.crewCount = Math.max(1, Math.min(6, Number(crewCount) || 4));
  currentMission.cargoConfig = Array.isArray(selectedCargo) ? selectedCargo : [];
  currentMission.phase = 'SURFACE_SURVIVAL';
  currentMission.solDay = 1;

  if (currentMission.cargoConfig.includes('cargo_extra_o2')) currentMission.oxygenKg += 150;
  if (currentMission.cargoConfig.includes('cargo_kilopower')) currentMission.powerKwh = 100;
  if (currentMission.cargoConfig.includes('cargo_shield')) currentMission.radiationShield = Math.min(100, currentMission.radiationShield + 20);
  if (currentMission.cargoConfig.includes('cargo_greenhouse')) currentMission.foodKg += 40;

  res.json({
    success: true,
    message: `Décollage réussi. Atterrissage : ${currentMission.destination.name}`,
    mission: currentMission,
  });
});

app.get('/api/mission/status', (req, res) => {
  // Shape that normalizeStatus() accepts (flat or nested under status)
  res.json({
    success: true,
    day: currentMission.solDay,
    sol: currentMission.solDay,
    oxygenKg: currentMission.oxygenKg,
    waterLiters: currentMission.waterLiters,
    foodKg: currentMission.foodKg,
    powerKwh: currentMission.powerKwh,
    radiationShield: currentMission.radiationShield,
    gameOver: currentMission.gameOver || currentMission.phase === 'FAILED',
    success: currentMission.success || currentMission.phase === 'MISSION_COMPLETE',
    status: {
      oxygenKg: currentMission.oxygenKg,
      waterLiters: currentMission.waterLiters,
      foodKg: currentMission.foodKg,
      powerKwh: currentMission.powerKwh,
      radiationShield: currentMission.radiationShield,
      day: currentMission.solDay,
      sol: currentMission.solDay,
      gameOver: currentMission.gameOver || currentMission.phase === 'FAILED',
      success: currentMission.success || currentMission.phase === 'MISSION_COMPLETE',
    },
    data: currentMission,
    // Taux de jeu du cahier des charges KEMET-42 : NON vérifiés auprès d'une publication NASA.
    game_rates: {
      o2_daily_rate: '0.8 kg/pers/jour',
      water_daily_rate: '2.5 L/pers/jour (recyclé à 98%)',
      food_daily_rate: '1.8 kg/pers/jour',
      note: 'Règles de jeu simplifiées (cahier des charges KEMET-42), pas des données NASA vérifiées.',
      real_nasa_data: ['NASA DONKI (météo spatiale, en direct) via /api/donki', 'Fiches NSSDC via /api/mission/science-sources'],
    },
  });
});

app.post('/api/mission/next-day', async (req, res) => {
  if (currentMission.phase !== 'SURFACE_SURVIVAL') {
    currentMission.phase = 'SURFACE_SURVIVAL';
    if (!currentMission.destinationId) {
      currentMission.destinationId = 'MARS';
      currentMission.destination = DESTINATIONS.MARS;
    }
  }

  const crew = currentMission.crewCount;
  // Consommation calibrée pour la simulation pédagogique (chaque jauge baisse de façon visible)
  const o2Used = +(crew * 0.65).toFixed(1);       // ~2.6 kg / Sol pour 4 personnes
  const waterUsed = +(crew * 0.75).toFixed(1);    // ~3.0 L / Sol
  const foodUsed = +(crew * 0.85).toFixed(1);     // ~3.4 kg / Sol

  currentMission.oxygenKg = Math.max(0, +(currentMission.oxygenKg - o2Used).toFixed(1));
  currentMission.waterLiters = Math.max(0, +(currentMission.waterLiters - waterUsed).toFixed(1));
  currentMission.foodKg = Math.max(0, +(currentMission.foodKg - foodUsed).toFixed(1));
  currentMission.solDay += 1;

  // Drainage de base de l'énergie (nuit martienne vs panneaux de jour)
  let powerDelta = -7.0;
  if (currentMission.cargoConfig.includes('cargo_kilopower')) powerDelta += 12;
  if (currentMission.cargoConfig.includes('cargo_greenhouse')) {
    powerDelta -= 2;
    if (currentMission.powerKwh > 20) currentMission.foodKg = +(currentMission.foodKg + 5).toFixed(1);
  }

  const alerts = [];
  let donkiMeta = null;

  // --- Real NASA DONKI space weather (cached 5 min) ---
  try {
    const donki = await getDonkiSnapshot();
    donkiMeta = {
      live: donki.live,
      source: donki.source,
      radiationRisk: donki.radiationRisk,
      summary: donki.summary,
      strongestFlare: donki.strongestFlare
        ? { classType: donki.strongestFlare.classType, beginTime: donki.strongestFlare.beginTime || donki.strongestFlare.peakTime }
        : null,
    };

    // Higher chance of in-game radiation event when DONKI shows real activity
    const riskChance = donki.radiationRisk === 'high' ? 0.55 : donki.radiationRisk === 'medium' ? 0.28 : 0.08;
    if (Math.random() < riskChance) {
      const alert = donkiToAlert(donki, {
        shielded: currentMission.cargoConfig.includes('cargo_shield'),
      });
      if (alert) {
        currentMission.radiationShield = Math.max(0, currentMission.radiationShield - alert.shieldDamage);
        alerts.push(alert);
      }
    }
  } catch (e) {
    console.warn('[next-day] DONKI error:', e.message || e);
  }

  if (currentMission.destinationId === 'MOON') {
    // Lunar night every ~14 sols (simplified)
    if (currentMission.solDay % 28 > 14) {
      powerDelta -= 20;
      alerts.push({
        type: 'power',
        kind: 'power_failure',
        message: 'Nuit lunaire : panneaux solaires à 0. Chauffage au maximum (−173 °C).',
        text: 'Nuit lunaire : panneaux solaires à 0. Chauffage au maximum (−173 °C).',
      });
    } else {
      powerDelta += 10;
    }
  } else {
    // Mars dust storms (environmental, independent of DONKI)
    if (Math.random() < 0.18) {
      powerDelta -= 25;
      alerts.push({
        type: 'dust',
        kind: 'dust_storm',
        message: 'Tempête de poussière martienne : panneaux recouverts, −30 % de puissance.',
        text: 'Tempête de poussière martienne : panneaux recouverts, −30 % de puissance.',
      });
    }
  }

  currentMission.powerKwh = Math.max(0, Math.min(100, +(currentMission.powerKwh + powerDelta).toFixed(1)));
  currentMission.radiationShield = Math.max(0, currentMission.radiationShield - 1); // slow decay
  currentMission.activeAlert = alerts[0]?.message || null;
  currentMission.alerts = alerts;

  if (currentMission.oxygenKg <= 0 || currentMission.foodKg <= 0 || currentMission.powerKwh <= 0 || currentMission.radiationShield <= 0) {
    currentMission.phase = 'FAILED';
    currentMission.gameOver = true;
    currentMission.success = false;
  } else if (currentMission.solDay >= 30) {
    currentMission.phase = 'MISSION_COMPLETE';
    currentMission.gameOver = true;
    currentMission.success = true;
  }

  res.json({
    success: true,
    sol: currentMission.solDay,
    day: currentMission.solDay,
    consumed: { o2: o2Used, water: waterUsed, food: foodUsed },
    alerts,
    alert: alerts[0]?.message || null,
    events: alerts,
    donki: donkiMeta,
    mission: currentMission,
    oxygenKg: currentMission.oxygenKg,
    waterLiters: currentMission.waterLiters,
    foodKg: currentMission.foodKg,
    powerKwh: currentMission.powerKwh,
    radiationShield: currentMission.radiationShield,
  });
});

app.post('/api/mission/reset', (req, res) => {
  resetMission();
  res.json({ success: true, message: 'Mission réinitialisée.' });
});

// ---------------------------------------------------------------------------
// Science sources (for UI + judges)
// ---------------------------------------------------------------------------
app.get('/api/mission/science-sources', (_req, res) => {
  res.json({
    success: true,
    accessed: ACCESS,
    bodies: BODIES,
    crewRates: CREW_RATES,
    plants: PLANTS,
    sources: SRC,
    note: 'Les valeurs marquées tag=pedagogical_simplify ou game_rule sont des règles de jeu, pas des mesures NASA brutes.',
  });
});

// ---------------------------------------------------------------------------
// Incidents pédagogiques (multi-étapes + compte à rebours = règle de jeu)
// ---------------------------------------------------------------------------
app.post('/api/mission/incident/start', (req, res) => {
  if (currentMission.phase !== 'SURFACE_SURVIVAL') {
    currentMission.phase = 'SURFACE_SURVIVAL';
    if (!currentMission.destinationId) {
      currentMission.destinationId = 'MARS';
      currentMission.destination = DESTINATIONS.MARS;
    }
  }
  if (currentMission.incident) {
    return res.json({ success: true, incident: currentMission.incident, alreadyActive: true });
  }
  const prefer = req.body?.id || null;
  const def = prefer
    ? INCIDENTS.find((i) => i.id === prefer)
    : pickIncident(currentMission.destinationId, Math.random, currentMission.incidentHistory.slice(-1)[0]?.id);
  if (!def) return res.status(404).json({ success: false, error: 'No incident available.' });

  const incident = {
    id: def.id,
    art: def.art,
    title: def.title,
    cause: def.cause,
    danger: def.danger,
    whatToDo: def.whatToDo,
    urgency: def.urgency,
    resources: def.resources,
    source: def.source,
    stages: def.stages,
    stageIndex: 0,
    stageId: def.stages[0].id,
    timeLimitSec: def.timeLimitSec, // règle de jeu
    timeLeftSec: def.timeLimitSec,
    startedAt: Date.now(),
    shelterRequired: !!def.shelterRequired,
    shelterRecommended: !!def.shelterRecommended,
    positive: !!def.positive,
    failEffects: def.failEffects,
    successEffects: def.successEffects,
    repairCost: def.repairCost || {},
    status: 'active', // active | resolved | failed
    result: null,
  };
  currentMission.incident = incident;
  pushPedagogy({ type: 'incident_start', id: def.id });
  res.json({ success: true, incident, note: 'timeLimitSec est une règle de jeu, pas une durée scientifique réelle.' });
});

app.post('/api/mission/incident/action', (req, res) => {
  const inc = currentMission.incident;
  if (!inc || inc.status !== 'active') {
    return res.status(400).json({ success: false, error: 'No active incident.' });
  }
  const action = String(req.body?.action || '');
  // advance stage: diagnose → instruct → move → repair → result
  if (action === 'advance' || action === 'next') {
    if (inc.stageIndex < inc.stages.length - 1) {
      inc.stageIndex += 1;
      inc.stageId = inc.stages[inc.stageIndex].id;
    }
  } else if (action === 'tick') {
    const sec = Math.max(0, Number(req.body?.elapsedSec) || 1);
    inc.timeLeftSec = Math.max(0, inc.timeLeftSec - sec);
    if (inc.timeLeftSec <= 0 && inc.status === 'active') {
      // timeout = fail
      applyResourceDelta(inc.failEffects);
      inc.status = 'failed';
      inc.result = { ok: false, reason: 'timeout', effects: inc.failEffects };
      currentMission.assistant.failsInRow += 1;
      currentMission.incidentHistory.push({ id: inc.id, result: 'failed', sol: currentMission.solDay });
      pushPedagogy({ type: 'incident_fail', id: inc.id, reason: 'timeout' });
    }
  } else if (action === 'choose') {
    // player chose a resolution path (A/B style)
    const choice = req.body?.choice || 'A';
    inc.choice = choice;
    if (inc.stageId !== 'repair' && inc.stageId !== 'result') {
      // jump toward repair
      const ri = inc.stages.findIndex((s) => s.id === 'repair');
      if (ri >= 0) {
        inc.stageIndex = ri;
        inc.stageId = 'repair';
      }
    }
  }
  currentMission.incident = inc;
  res.json({ success: true, incident: inc });
});

app.post('/api/mission/incident/resolve', (req, res) => {
  const inc = currentMission.incident;
  if (!inc || inc.status !== 'active') {
    return res.status(400).json({ success: false, error: 'No active incident.' });
  }
  const ok = req.body?.success !== false;
  if (ok) {
    applyResourceDelta(inc.repairCost);
    applyResourceDelta(inc.successEffects);
    inc.status = 'resolved';
    inc.result = { ok: true, effects: { ...inc.repairCost, ...inc.successEffects } };
    currentMission.assistant.failsInRow = 0;
    pushPedagogy({ type: 'incident_success', id: inc.id });
  } else {
    applyResourceDelta(inc.failEffects);
    inc.status = 'failed';
    inc.result = { ok: false, reason: 'player_fail', effects: inc.failEffects };
    currentMission.assistant.failsInRow += 1;
    pushPedagogy({ type: 'incident_fail', id: inc.id, reason: 'player_fail' });
  }
  currentMission.incidentHistory.push({ id: inc.id, result: inc.status, sol: currentMission.solDay });
  // keep incident visible one more response then clear on next status/next-day
  currentMission.incident = inc;
  res.json({ success: true, incident: inc, mission: snapshotMission() });
});

// ---------------------------------------------------------------------------
// Shelter (vue intérieure liée à l'état réel)
// ---------------------------------------------------------------------------
app.post('/api/mission/shelter/enter', (req, res) => {
  const crew = Math.min(currentMission.crewCount, Number(req.body?.crew) || currentMission.crewCount);
  currentMission.shelter = {
    inside: true,
    crewInside: crew,
    enteredAt: Date.now(),
    reason: req.body?.reason || currentMission.incident?.id || 'manual',
  };
  // inside shelter: slight O2/energy drain, strong radiation protection
  pushPedagogy({ type: 'shelter_enter', crew });
  res.json({
    success: true,
    shelter: currentMission.shelter,
    interior: {
      airlock: true,
      livingZone: true,
      oxygenSystem: currentMission.oxygenKg > 10,
      batteries: currentMission.powerKwh,
      shielding: currentMission.radiationShield,
      alertLights: currentMission.incident ? currentMission.incident.urgency : 'none',
      resources: {
        oxygenKg: currentMission.oxygenKg,
        powerKwh: currentMission.powerKwh,
        foodKg: currentMission.foodKg,
        radiationShield: currentMission.radiationShield,
      },
    },
  });
});

app.post('/api/mission/shelter/exit', (_req, res) => {
  currentMission.shelter = { inside: false, crewInside: 0, enteredAt: null };
  pushPedagogy({ type: 'shelter_exit' });
  res.json({ success: true, shelter: currentMission.shelter });
});

// ---------------------------------------------------------------------------
// Assistant NOVA
// ---------------------------------------------------------------------------
app.get('/api/mission/assistant-state', (_req, res) => {
  const a = currentMission.assistant;
  const inc = currentMission.incident;
  let suggestion = null;
  if (inc && inc.status === 'active') {
    suggestion = {
      kind: 'incident',
      level: Math.min(3, a.failsInRow + 1),
      text: {
        fr: levelTextFr(inc, Math.min(3, a.failsInRow + 1)),
        en: levelTextEn(inc, Math.min(3, a.failsInRow + 1)),
      },
    };
  } else if (a.failsInRow >= 2) {
    suggestion = {
      kind: 'encouragement',
      level: 1,
      text: {
        fr: 'Tu as eu quelques difficultés. Veux-tu un indice sur la prochaine action ?',
        en: 'You had some trouble. Want a hint for the next action?',
      },
    };
  }
  res.json({
    success: true,
    assistant: a,
    suggestion,
    didYouKnow: randomDidYouKnow(currentMission.destinationId),
  });
});

app.post('/api/mission/assistant-help', (req, res) => {
  const level = Math.min(3, Math.max(1, Number(req.body?.level) || 1));
  currentMission.assistant.level = level;
  const inc = currentMission.incident;
  const text = inc
    ? { fr: levelTextFr(inc, level), en: levelTextEn(inc, level) }
    : {
        fr: 'Observe les jauges. Si une ressource est basse, construis ou répare le module qui la produit.',
        en: 'Watch the gauges. If a resource is low, build or repair the module that produces it.',
      };
  currentMission.assistant.messages.push({ level, text, at: Date.now() });
  pushPedagogy({ type: 'assistant_help', level });
  res.json({ success: true, level, text, assistant: currentMission.assistant });
});

// ---------------------------------------------------------------------------
// Greenhouse (activité interactive type Veggie / APH)
// ---------------------------------------------------------------------------
app.post('/api/mission/greenhouse/start', (req, res) => {
  const plantId = req.body?.plantId || 'lettuce';
  const plant = PLANTS.find((p) => p.id === plantId) || PLANTS[0];
  currentMission.greenhouse = {
    plantId: plant.id,
    plant,
    stage: 'setup', // setup | growing | harvest | done
    light: false,
    water: false,
    nutrients: false,
    temperature: false,
    energyOk: currentMission.powerKwh > 15,
    contamination: false,
    progress: 0,
    startedSol: currentMission.solDay,
  };
  pushPedagogy({ type: 'greenhouse_start', plantId: plant.id });
  res.json({
    success: true,
    greenhouse: currentMission.greenhouse,
    note: 'Les cultures poussent dans une enceinte pressurisée contrôlée (Veggie / APH), jamais à l’air libre sur Mars.',
    source: plant.source,
  });
});

app.post('/api/mission/greenhouse/action', (req, res) => {
  const gh = currentMission.greenhouse;
  if (!gh) return res.status(400).json({ success: false, error: 'No greenhouse activity.' });
  const act = String(req.body?.action || '');
  if (act === 'light') gh.light = true;
  if (act === 'water') gh.water = true;
  if (act === 'nutrients') gh.nutrients = true;
  if (act === 'temperature') gh.temperature = true;
  if (act === 'grow') {
    if (gh.light && gh.water && gh.nutrients && gh.temperature && currentMission.powerKwh > 10) {
      gh.stage = 'growing';
      gh.progress = Math.min(100, gh.progress + 34);
      currentMission.powerKwh = Math.max(0, +(currentMission.powerKwh - 3).toFixed(1));
      if (gh.progress >= 100) gh.stage = 'harvest';
    } else {
      return res.json({ success: false, error: 'Conditions incomplètes (lumière, eau, nutriments, température, énergie).', greenhouse: gh });
    }
  }
  if (act === 'harvest' && gh.stage === 'harvest') {
    const bonus = gh.plant.cycleDaysGame >= 6 ? 14 : 10;
    currentMission.foodKg = +(currentMission.foodKg + bonus).toFixed(2);
    gh.stage = 'done';
    gh.progress = 100;
    pushPedagogy({ type: 'greenhouse_harvest', plantId: gh.plantId, bonus });
    res.json({ success: true, greenhouse: gh, harvestedKg: bonus, foodKg: currentMission.foodKg });
    return;
  }
  if (act === 'contaminate') {
    gh.contamination = true;
    gh.progress = Math.max(0, gh.progress - 20);
  }
  if (act === 'sterilize' && gh.contamination) {
    gh.contamination = false;
    currentMission.powerKwh = Math.max(0, +(currentMission.powerKwh - 2).toFixed(1));
  }
  currentMission.greenhouse = gh;
  res.json({ success: true, greenhouse: gh });
});

// DONKI snapshot (for judges / debug — shows live NASA space weather)
app.get('/api/donki', async (_req, res) => {
  try {
    const snap = await getDonkiSnapshot();
    res.json(snap);
  } catch (e) {
    res.status(502).json({ live: false, error: String(e.message || e) });
  }
});

// Health
app.get('/health', (_req, res) => res.json({ ok: true, service: 'kemet-42-backend' }));

function snapshotMission() {
  return {
    ...currentMission,
    // avoid circular dumps
  };
}

function levelTextFr(inc, level) {
  if (level <= 1) return `Petit indice : regarde surtout ${(inc.resources || []).join(', ') || 'les barres'}.`;
  if (level === 2) return `Voici pourquoi : ${inc.cause.fr} Attention : ${inc.danger.fr}`;
  return `Aide complète : ${inc.whatToDo.fr} Temps restant du jeu : ${inc.timeLeftSec}s.`;
}
function levelTextEn(inc, level) {
  if (level <= 1) return `Small hint: look mostly at ${(inc.resources || []).join(', ') || 'the bars'}.`;
  if (level === 2) return `Here is why: ${inc.cause.en} Watch out: ${inc.danger.en}`;
  return `Full help: ${inc.whatToDo.en} Game time left: ${inc.timeLeftSec}s.`;
}

function randomDidYouKnow(destId) {
  const tips = [
    {
      fr: 'Le savais-tu ? La NASA fait pousser des salades dans l’espace dans une boîte appelée Veggie.',
      en: 'Did you know? NASA grows salad in space in a box called Veggie.',
      url: 'https://www.nasa.gov/mission/veggie-plant-growth-system/',
    },
    {
      fr: 'Le savais-tu ? Un message vers Mars met beaucoup de minutes à arriver.',
      en: 'Did you know? A message to Mars takes many minutes to arrive.',
      url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
    },
    {
      fr: 'Le savais-tu ? Sur la Lune, la nuit dure environ 14 jours sans soleil.',
      en: 'Did you know? On the Moon, night lasts about 14 days with no sun.',
      url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
    },
    {
      fr: 'Le savais-tu ? Un robot sur Mars a fabriqué un peu d’oxygène avec l’air de Mars.',
      en: 'Did you know? A robot on Mars made a little oxygen from Mars air.',
      url: 'https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/',
    },
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

app.listen(PORT, () => {
  console.log(` Backend KEMET-42 sur http://localhost:${PORT}`);
  console.log(`   Auth     POST /auth/register  POST /auth/login`);
  console.log(`   Scores   POST /scores  GET /scores`);
  console.log(`   Mission  GET  /api/mission/briefing`);
  console.log(`            POST /api/mission/launch`);
  console.log(`            GET  /api/mission/status`);
  console.log(`            POST /api/mission/next-day`);
  console.log(`            POST /api/mission/reset`);
  console.log(`   Incident POST /api/mission/incident/start|action|resolve`);
  console.log(`   Shelter  POST /api/mission/shelter/enter|exit`);
  console.log(`   NOVA     GET  /api/mission/assistant-state`);
  console.log(`            POST /api/mission/assistant-help`);
  console.log(`   Serre    POST /api/mission/greenhouse/start|action`);
  console.log(`   Science  GET  /api/mission/science-sources`);
  console.log(`   DONKI    GET  /api/donki`);
  if (!process.env.NASA_API_KEY) {
    console.log(`     NASA_API_KEY non défini → DEMO_KEY (limites de débit). Demande une clé gratuite sur api.nasa.gov`);
  }
});
