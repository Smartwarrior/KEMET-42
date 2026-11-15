// src/engine/outpostEngine.js - Cerveau logique et mathématique de KEMET-42
// Basé sur les ratios officiels du NASA Human Research Program

import outpostData from '../data/outpostData.json';

export class OutpostEngine {
  constructor(crewCount = 4) {
    this.crew = crewCount;
    this.sol = 1;
    
    // Réserves initiales calculées pour environ 30 à 60 jours
    this.state = {
      crew: crewCount,
      sol: 1,
      // 1. MAINTIEN EN VIE (Life Support)
      oxygenKg: 120.0,            // Consommation : 0.8 kg / pers / jour
      waterLiters: 400.0,         // Consommation : 2.5 L / pers / jour (recyclé à 98%)
      // 2. PRODUCTION ALIMENTAIRE (Food)
      foodKg: 250.0,              // Consommation : 1.8 kg / pers / jour
      greenhouseActive: true,     // Produit 8 kg / jour si alimentée
      // 3. ÉNERGIE (Power)
      powerKwh: 100.0,            // 0 à 100%
      kilopowerActive: false,     // Réacteur de secours NASA
      // 4. PROTECTION RADIATIONS (Shielding)
      shieldIntegrity: 100,       // 0 à 100% (règle de jeu)
      radiationDoseMsv: 0.8,      // Dose quotidienne reçue
      
      status: 'OPERATIONAL',      // 'OPERATIONAL', 'CRITICAL', 'MISSION_FAILED'
      history: []
    };
  }

  // 1. Simuler le passage d'un Sol martien (1 journée de 24h39m)
  simulateSol() {
    const std = outpostData.standardsNASA;
    
    // Calculs de consommation humaine NASA
    const dailyO2 = this.crew * std.oxygenPerAstronautKgDay;
    const dailyWater = this.crew * std.waterPerAstronautLitersDay * (1 - std.eclssWaterRecyclingEfficiency); // Recyclage 98%
    const dailyFood = this.crew * std.foodPerAstronautKgDay;

    // Déduction des consommations
    this.state.oxygenKg = Math.max(0, +(this.state.oxygenKg - dailyO2).toFixed(2));
    this.state.waterLiters = Math.max(0, +(this.state.waterLiters - dailyWater).toFixed(2));
    this.state.foodKg = Math.max(0, +(this.state.foodKg - dailyFood).toFixed(2));

    // Production de la serre hydroponique si elle est alimentée
    if (this.state.greenhouseActive && this.state.powerKwh > 20) {
      this.state.foodKg += 8.0; // Production quotidienne de légumes
    }

    // Gestion de l'énergie (consommation de base)
    let powerDrain = 15;
    if (this.state.greenhouseActive) powerDrain += 10;
    if (this.state.kilopowerActive) {
      this.state.powerKwh = Math.min(100, this.state.powerKwh + 20); // Recharge continue
    } else {
      this.state.powerKwh = Math.max(0, this.state.powerKwh - powerDrain);
    }

    // Vérification des conditions critiques de maintien en vie
    if (this.state.oxygenKg <= 0 || this.state.waterLiters <= 0 || this.state.powerKwh <= 0) {
      this.state.status = 'CRITICAL';
    }
    if (this.state.oxygenKg === 0 && this.state.shieldIntegrity <= 20) {
      this.state.status = 'MISSION_FAILED';
    }

    this.sol += 1;
    this.state.sol = this.sol;

    return {
      sol: this.sol,
      consumed: { o2: dailyO2, water: dailyWater, food: dailyFood },
      currentState: { ...this.state }
    };
  }

  // 2. Résoudre un dilemme contradictoire choisi par l'élève
  applyChoice(choice) {
    if (choice.effects.radiationDamage) {
      this.state.shieldIntegrity = Math.max(0, this.state.shieldIntegrity - choice.effects.radiationDamage);
    }
    if (choice.effects.powerDelta) {
      this.state.powerKwh = Math.max(0, Math.min(100, this.state.powerKwh + choice.effects.powerDelta));
    }
    if (choice.effects.foodLossKg) {
      this.state.foodKg = Math.max(0, this.state.foodKg - choice.effects.foodLossKg);
    }
    if (choice.effects.waterReserveDelta) {
      this.state.waterLiters = Math.max(0, this.state.waterLiters + choice.effects.waterReserveDelta);
    }
    return { ...this.state };
  }

  // 3. Calcul du score final sur 100 points pour le jury
  calculateScore() {
    let score = 0;
    // Survie de l'équipage (40 points)
    if (this.state.oxygenKg > 20) score += 20;
    if (this.state.waterLiters > 50) score += 20;
    
    // Gestion énergétique et nourriture (30 points)
    if (this.state.powerKwh > 30) score += 15;
    if (this.state.foodKg > 50) score += 15;
    
    // Protection anti-radiations (règle de jeu) (30 points)
    score += Math.round((this.state.shieldIntegrity / 100) * 30);

    return Math.min(100, score);
  }
}
