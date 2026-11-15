/**
 * Mission Mars 30 - Core Game Engine
 * Strictly headless, zero DOM access, deterministic with seeded PRNG.
 */

export function createRNG(seed = 12345, savedState = null) {
  let s = (savedState >>> 0) || (seed >>> 0) || 1;
  const rng = function() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.getState = () => s >>> 0;
  return rng;
}

export function createInitialState(config = null) {
  return {
    day: 1,
    budget: config?.initialState?.budget ?? 1000,
    crew: config?.initialState?.crew ?? 4,
    resources: {
      o2: config?.initialState?.resources?.o2 ?? 80,
      energy: config?.initialState?.resources?.energy ?? 80,
      food: config?.initialState?.resources?.food ?? 80,
      protection: config?.initialState?.resources?.protection ?? 70
    },
    modules: {
      solar: config?.initialState?.modules?.solar ?? 1,
      moxie: config?.initialState?.modules?.moxie ?? 0,
      greenhouse: config?.initialState?.modules?.greenhouse ?? 0,
      shield: config?.initialState?.modules?.shield ?? 0
    },
    damagedModules: [],
    status: {
      dust: 0
    },
    lastEventId: null,
    gameOver: false,
    success: false,
    history: []
  };
}

export function validateActions(state, actions, actionsConfig) {
  if (!Array.isArray(actions)) return { valid: false, error: "actions must be an array" };
  if (actions.length > 2) return { valid: false, error: "maximum 2 actions per day" };

  let totalCost = 0;
  const moduleCounts = { ...state.modules };

  for (const act of actions) {
    const def = actionsConfig.find(a => a.id === act.id);
    if (!def) return { valid: false, error: `unknown action ${act.id}` };
    totalCost += def.cost;

    if (def.type === "build") {
      const current = moduleCounts[def.moduleType] || 0;
      if (current >= 4) {
        return { valid: false, error: `module limit reached for ${def.moduleType}` };
      }
      moduleCounts[def.moduleType] = current + 1;
    }
  }

  if (state.budget - totalCost < 0) {
    return { valid: false, error: "insufficient budget" };
  }

  return { valid: true, totalCost };
}

export function drawEventForTurn(state, rng, data) {
  // Un phénomène est tiré à chaque Sol dès le premier jour par défaut.
  const startDay = data?.config?.eventStartDay ?? 1;
  const prob = data?.config?.eventProbability ?? 1;
  if (state.day >= startDay && rng() < prob) {
    const eventsList = data?.events || [];
    const eligible = eventsList.filter(e => e.id !== state.lastEventId);
    if (eligible.length > 0) {
      const idx = Math.floor(rng() * eligible.length);
      return eligible[idx];
    }
  }
  return null;
}

export function playTurn(state, turnInput, rng, data) {
  if (state.gameOver) return { ...state };

  const actions = turnInput.actions || [];
  const eventChoice = turnInput.eventChoice || null; // { choiceId: "A" | "B" }
  const actionsConfig = data.actions || [];

  // Clone state immutably
  const next = {
    ...state,
    resources: { ...state.resources },
    modules: { ...state.modules },
    damagedModules: [...state.damagedModules],
    status: { ...state.status },
    history: [...state.history]
  };

  // Record day start snapshot
  const startEnergy = next.resources.energy;
  const lowEnergyMode = startEnergy < 20;

  // 1. Validate & Apply actions
  const validation = validateActions(next, actions, actionsConfig);
  if (!validation.valid) {
    throw new Error(`Invalid turn actions: ${validation.error}`);
  }

  const appliedActionsLog = [];
  for (const act of actions) {
    const def = actionsConfig.find(a => a.id === act.id);
    next.budget -= def.cost;

    if (def.type === "build") {
      next.modules[def.moduleType] = (next.modules[def.moduleType] || 0) + 1;
      appliedActionsLog.push({ id: def.id, type: "build", name: def.name });
    } else if (def.type === "emergency") {
      next.resources[def.target] = Math.min(100, next.resources[def.target] + 20);
      appliedActionsLog.push({ id: def.id, type: "emergency", target: def.target });
    } else if (def.type === "repair") {
      next.damagedModules = [];
      next.resources.energy = Math.min(100, next.resources.energy + 5);
      appliedActionsLog.push({ id: def.id, type: "repair" });
    } else if (def.type === "science") {
      next.budget += 30;
      appliedActionsLog.push({ id: def.id, type: "science" });
    }
  }

  // 2. Calculate Energy
  const tension = (data?.config?.lateGameTensionCoefficient && next.day >= (data?.config?.lateGameStartDay ?? 20))
    ? data.config.lateGameTensionCoefficient
    : 1.0;

  const isDustStorm = (next.status.dust || 0) > 0;
  const solarCoeff = isDustStorm ? 0.5 : 1.0;
  const energyProduction = 5 * (next.modules.solar || 0) * solarCoeff;
  const energyBaseConsumption = (data?.config?.consumptions?.energy ?? 4) * tension;
  const energyModuleConsumption = 2 * (next.modules.moxie || 0) + 1 * (next.modules.greenhouse || 0);
  const deltaEnergy = energyProduction - energyBaseConsumption - energyModuleConsumption;
  next.resources.energy += deltaEnergy;

  // 3 & 4. Calculate O2, Food, Protection
  const prodEfficiency = lowEnergyMode ? 0.5 : 1.0;
  const crewRatio = next.crew / 4;

  const o2Prod = 5 * (next.modules.moxie || 0) * prodEfficiency;
  const o2Cons = (data?.config?.consumptions?.o2 ?? 7) * crewRatio * tension;
  const deltaO2 = o2Prod - o2Cons;
  next.resources.o2 += deltaO2;

  const foodProd = 4 * (next.modules.greenhouse || 0) * prodEfficiency;
  const foodCons = (data?.config?.consumptions?.food ?? 5) * crewRatio * tension;
  const deltaFood = foodProd - foodCons;
  next.resources.food += deltaFood;

  const protProd = 3 * (next.modules.shield || 0);
  const protCons = (data?.config?.consumptions?.protection ?? 2) * tension;
  const deltaProt = protProd - protCons;
  next.resources.protection += deltaProt;

  // 5. Draw and apply event from day 3
  let triggeredEvent = null;
  let appliedChoice = null;

  if (turnInput.forcedEvent !== undefined) {
    triggeredEvent = turnInput.forcedEvent;
  } else {
    triggeredEvent = drawEventForTurn(next, rng, data);
  }

  if (triggeredEvent) {
    next.lastEventId = triggeredEvent.id;
    // Determine choice (A or B)
    const choiceId = eventChoice?.choiceId || (eventChoice?.choiceIndex === 1 ? "B" : "A");
    appliedChoice = triggeredEvent.choices.find(c => c.id === choiceId) || triggeredEvent.choices[0];

    // Deduct choice cost if any (with safety check if budget insufficient)
    if (appliedChoice.cost) {
      if (next.budget < appliedChoice.cost) {
        const freeChoice = triggeredEvent.choices.find(c => !c.cost || c.cost === 0);
        if (freeChoice) {
          appliedChoice = freeChoice;
        } else {
          next.budget = Math.max(0, next.budget - appliedChoice.cost);
        }
      } else {
        next.budget -= appliedChoice.cost;
      }
    }

    // Apply choice effects
    if (appliedChoice.effects) {
      let protEffect = appliedChoice.effects.protection || 0;
      if (triggeredEvent.id === "solar_flare" && protEffect < 0) {
        // Shield reduces damage by 25% per shield
        const reduction = Math.min(1.0, 0.25 * (next.modules.shield || 0));
        protEffect = Math.round(protEffect * (1 - reduction));
      }

      next.resources.energy += appliedChoice.effects.energy || 0;
      next.resources.o2 += appliedChoice.effects.o2 || 0;
      next.resources.food += appliedChoice.effects.food || 0;
      next.resources.protection += protEffect;
    }

    // Apply status (e.g. dust for 3 days)
    if (appliedChoice.status && appliedChoice.status.name === "dust") {
      next.status.dust = Math.max(next.status.dust || 0, appliedChoice.status.days);
    }
  }

  // Existing storms affect this Sol; a storm chosen above starts counting next Sol.
  if (!triggeredEvent && next.status.dust > 0) {
    next.status.dust -= 1;
  } else if (triggeredEvent && !(appliedChoice?.status?.name === "dust")) {
    if (next.status.dust > 0) next.status.dust -= 1;
  }

  // 7. Clamp gauges to [0, 100]
  next.resources.o2 = Math.max(0, Math.min(100, Math.round(next.resources.o2)));
  next.resources.energy = Math.max(0, Math.min(100, Math.round(next.resources.energy)));
  next.resources.food = Math.max(0, Math.min(100, Math.round(next.resources.food)));
  next.resources.protection = Math.max(0, Math.min(100, Math.round(next.resources.protection)));

  // 8. Crew loss check
  const hasDepleted = next.resources.o2 <= 0 || next.resources.energy <= 0 || next.resources.food <= 0 || next.resources.protection <= 0;
  if (hasDepleted) {
    next.crew = Math.max(0, next.crew - 1);
  }

  // Record history
  next.history.push({
    day: next.day,
    resources: { ...next.resources },
    budget: next.budget,
    crew: next.crew,
    actions: appliedActionsLog,
    event: triggeredEvent ? { id: triggeredEvent.id, choice: appliedChoice?.id } : null,
    delta: {
      energy: Math.round(deltaEnergy),
      o2: Math.round(deltaO2),
      food: Math.round(deltaFood),
      protection: Math.round(deltaProt)
    }
  });

  // Check Game Over
  if (next.crew <= 0) {
    next.gameOver = true;
    next.success = false;
    return next;
  }

  // 9. Add daily budget & advance day
  next.budget += data?.config?.dailyBudgetAdd ?? 40;
  next.day += 1;

  if (next.day > (data?.config?.initialState?.maxSols ?? 30)) {
    next.gameOver = true;
    next.success = true;
  }

  return next;
}

export function calculateScore(state) {
  // Score formula from Section 17 (max 850)
  // Crew: 100 * members (max 400)
  // Days: 5 * days survived (max 150)
  // Resources: 2 * average of 4 gauges on the last day (max 200)
  // Budget: remaining credits / 10, capped at 100
  const daysSurvived = state.success ? 30 : Math.max(0, state.day - 1);
  const crewScore = 100 * Math.max(0, state.crew);
  const daysScore = 5 * daysSurvived;

  const avgResources = (state.resources.o2 + state.resources.energy + state.resources.food + state.resources.protection) / 4;
  const resScore = Math.round(2 * avgResources);
  const budgetScore = Math.min(100, Math.floor(Math.max(0, state.budget) / 10));

  const total = Math.min(850, crewScore + daysScore + resScore + budgetScore);

  let rank = "cadet";
  if (!state.success && state.crew <= 0) {
    rank = "rescue";
  } else if (total >= 700) {
    rank = "commander";
  } else if (total >= 500) {
    rank = "pilot";
  } else if (total >= 300) {
    rank = "explorer";
  }

  return {
    crewScore,
    daysScore,
    resScore,
    budgetScore,
    total,
    rank,
    daysSurvived
  };
}
