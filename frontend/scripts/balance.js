// Simulation d'équilibrage : node scripts/balance.js [parties]
import fs from "node:fs";
import { createRNG, createInitialState, validateActions, playTurn, drawEventForTurn, calculateScore } from "../src/game/engine.js";
const rd = (f) => JSON.parse(fs.readFileSync(new URL(`../src/data/${f}.json`, import.meta.url)));
const data = { config: { ...rd("config"), ...JSON.parse(process.env.CFG || "{}") }, actions: rd("actions"), events: rd("events") };
const N = +process.argv[2] || 2000;

function pick(arr, r) { return arr[Math.floor(r() * arr.length)]; }
const policies = {
  aleatoire(state, r) {
    const acts = [];
    for (let k = 0; k < 2; k++) {
      if (r() < 0.7) {
        const cand = data.actions.filter((a) => validateActions(state, [...acts, { id: a.id }], data.actions).valid && !acts.find((x) => x.id === a.id));
        if (cand.length) acts.push({ id: pick(cand, r).id });
      }
    }
    return acts;
  },
  prudent(state, r) {
    const acts = [];
    const tryAdd = (id) => { if (acts.length < 2 && !acts.find((x) => x.id === id) && validateActions(state, [...acts, { id }], data.actions).valid) acts.push({ id }); };
    const m = state.modules, res = state.resources;
    if (res.o2 < 30) tryAdd("emergency_o2");
    if (res.food < 30) tryAdd("emergency_food");
    if (res.energy < 30) tryAdd("emergency_energy");
    if (res.protection < 30) tryAdd("emergency_protection");
    if (m.moxie < 1) tryAdd("build_moxie");
    if (m.greenhouse < 1) tryAdd("build_greenhouse");
    if (m.shield < 1) tryAdd("build_shield");
    if (m.solar < 2) tryAdd("build_solar");
    if (m.moxie < 2) tryAdd("build_moxie");
    if (m.greenhouse < 2) tryAdd("build_greenhouse");
    return acts;
  },
};
function run(policy, seed) {
  const r = createRNG(seed * 7919 + 13), rng = createRNG(seed);
  let s = createInitialState(data.config);
  let guard = 0;
  while (!s.gameOver && guard++ < 60) {
    const acts = policies[policy](s, r);
    const ev = drawEventForTurn(s, rng, data);
    let choice = null;
    if (ev) choice = { choiceId: policy === "prudent" ? "A" : pick(ev.choices, r).id };
    s = playTurn(s, { actions: acts, forcedEvent: ev, eventChoice: choice }, rng, data);
  }
  return { win: s.success, score: calculateScore(s).total, crew: s.crew };
}
for (const p of Object.keys(policies)) {
  let w = 0, sc = 0; for (let i = 1; i <= N; i++) { const o = run(p, i); w += o.win ? 1 : 0; sc += o.score; }
  console.log(p.padEnd(10), "victoires", ((100 * w) / N).toFixed(1) + "%", "score moyen", Math.round(sc / N));
}
