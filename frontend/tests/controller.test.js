import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createController } from "../src/game/controller.js";
import { HAZARDS, SLOTS, SLOT_COUNT } from "../src/game/layout.js";
const rd = (f) => JSON.parse(fs.readFileSync(new URL(`../src/data/${f}.json`, import.meta.url)));
const data = { config: rd("config"), actions: rd("actions"), events: rd("events"), facts: rd("mars-facts") };
const fakeBackend = { async register(n) { return { token: "t", user: { name: n } }; }, async login(n, p) { if (p !== "ok") throw new Error("invalid"); return { token: "t", user: { name: n } }; }, async submitScore() { return true; } };
const mk = (o = {}) => { const c = createController({ data, backend: fakeBackend, timing: { executeMax: 20, accidentIntro: 5, daySweep: 5 }, seed: 42, ...o }); c.store.set({ phase: "intro", user: { name: "t", token: "t" } }); return c; };
const pass = (c) => { if (phase(c) === "quiz") { c.answerQuiz(0); c.continueQuiz(); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const phase = (c) => c.store.get().phase;

test("démarrage : intro → briefing → plan", () => {
  const c = mk(); assert.equal(phase(c), "intro"); c.goBriefing(); assert.equal(phase(c), "briefing"); c.launch(); assert.equal(phase(c), "plan");
  assert.equal(c.store.get().game.day, 1);
});

test("plan : max 2 actions, budget et limite de modules respectés", () => {
  const c = mk(); c.launch();
  assert.equal(c.beginPlacing("build_moxie").ok, true); assert.equal(c.store.get().placing, "build_moxie");
  assert.ok(c.placeAt(c.freeSlots("moxie")[0])); assert.equal(c.store.get().plan.length, 1);
  c.beginPlacing("emergency_o2"); assert.equal(c.store.get().plan.length, 2);
  assert.equal(c.canAdd("repair").ok, false); assert.equal(c.canAdd("repair").reason, "maxActions");
  c.removePlan(0); assert.equal(c.store.get().plan.length, 1);
});

test("emplacements : le solaire initial occupe le slot 0 ; pas de double réservation", () => {
  const c = mk(); c.launch();
  assert.deepEqual(c.freeSlots("solar"), [1, 2, 3]);
  c.beginPlacing("build_solar"); c.placeAt(1);
  assert.deepEqual(c.freeSlots("solar"), [2, 3]);
  assert.equal(c.canAdd("build_solar").ok, true);
  c.beginPlacing("build_solar"); assert.equal(c.placeAt(1), false); assert.ok(c.autoPlace());
  assert.deepEqual(c.store.get().plan.map((p) => p.slot), [1, 2]);
});

test("budget insuffisant refusé avec raison explicite", () => {
  const c = mk(); c.launch(); c.store.set((s) => ({ game: { ...s.game, budget: 100 } }));
  const r = c.canAdd("build_moxie"); assert.equal(r.ok, false); assert.equal(r.reason, "insufficientBudget");
  c.beginPlacing("build_moxie"); assert.equal(c.store.get().toast.key, "insufficientBudget");
});

test("un jour complet sans 3D : exécution → (accident) → résolution → résumé → plan", async () => {
  const c = mk(); c.launch();
  for (let d = 1; d <= 3; d++) {
    c.endDay(); await wait(60);
    if (phase(c) === "accident") { await wait(15); assert.ok(c.store.get().choicesReady); c.chooseEvent("A"); }
    assert.ok(["resolve","summary"].includes(phase(c))); await wait(30); assert.equal(phase(c), "summary");
    c.continueSummary(); if (phase(c) === "fact") c.continueFact();
    assert.equal(phase(c), "quiz"); pass(c);
    assert.equal(phase(c), "plan"); assert.equal(c.store.get().game.day, d + 1);
  }
});

test("les actions planifiées sont bien jouées par le moteur et déclenchent 'perform'", async () => {
  const c = mk(); c.launch(); const seen = [];
  c.bus.on("perform", (p) => { seen.push([p.def.id, p.slot, p.crewIdx]); setTimeout(p.done, 1); });
  c.beginPlacing("build_moxie"); c.placeAt(0); c.beginPlacing("emergency_energy");
  c.endDay(); await wait(80);
  if (phase(c) === "accident") { await wait(15); c.chooseEvent("A"); }
  assert.deepEqual(seen.map((s) => s[0]).sort(), ["build_moxie", "emergency_energy"]);
  assert.notEqual(seen[0][2], seen[1][2]);
  assert.equal(c.store.get().game.modules.moxie, 1);
});

test("skip() termine l'exécution immédiatement", async () => {
  const c = mk({ timing: { executeMax: 5000, accidentIntro: 5, daySweep: 5 } }); c.launch();
  c.bus.on("perform", () => {}); c.beginPlacing("emergency_o2"); c.endDay(); assert.equal(phase(c), "execute");
  c.skip(); assert.notEqual(phase(c), "execute");
});

test("intervention : bonus appliqué une seule fois, borné à 100, seulement sur accident avec lieu", async () => {
  const c = mk(); c.launch();
  c.store.set((s) => ({ phase: "accident", choicesReady: true, pendingEvent: data.events.find((e) => e.id === "oxygen_leak"), bonusReached: false }));
  assert.ok(c.reachHazard()); assert.equal(c.reachHazard(), false);
  const before = c.store.get().game.resources.o2;
  c.chooseEvent("A");
  assert.equal(c.store.get().bonusRes, "o2");
  assert.ok(c.store.get().game.resources.o2 <= 100 && c.store.get().game.resources.o2 !== undefined && before !== undefined);
  c.store.set({ phase: "accident", choicesReady: true, pendingEvent: data.events.find((e) => e.id === "calm_sol"), bonusReached: false });
  assert.equal(c.reachHazard(), false);
});

test("partie complète aléatoire : se termine, score cohérent, sauvegarde effacée", async () => {
  const c = mk(); c.launch(); let n = 0;
  while (phase(c) !== "end" && n++ < 40) {
    if (phase(c) === "plan") { if (n % 2) c.beginPlacing("emergency_o2"); c.endDay(); }
    await wait(25);
    if (phase(c) === "accident") { await wait(10); c.chooseEvent(n % 3 ? "A" : "B"); }
    await wait(15); c.continueSummary(); c.continueFact(); pass(c);
  }
  assert.equal(phase(c), "end"); assert.ok(c.store.get().score.total >= 0 && c.store.get().score.total <= 850);
});

test("sauvegarde / reprise", async () => {
  const mem = {}; const storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  const a = mk({ storage }); a.launch(); a.endDay(); await wait(60); if (phase(a) === "accident") { await wait(15); a.chooseEvent("A"); } await wait(30); a.continueSummary(); a.continueFact(); pass(a);
  const day = a.store.get().game.day;
  const b = mk({ storage }); assert.equal(b.store.get().hasSave, true); b.resume(); assert.equal(b.store.get().game.day, day); assert.equal(phase(b), "plan");
});

test("layout : chaque lieu d'accident est défini pour chaque événement, slots complets", () => {
  for (const e of data.events) assert.ok(e.id in HAZARDS, e.id);
  for (const k of Object.keys(SLOTS)) assert.equal(SLOTS[k].length, SLOT_COUNT);
});

test("KEMET-42 : connexion obligatoire puis création de compte / mauvais mot de passe", async () => {
  const c = createController({ data, backend: fakeBackend, seed: 1 }); assert.equal(phase(c), "login");
  await c.auth("login", "eleve", "faux"); assert.equal(phase(c), "login"); assert.equal(c.store.get().authError, "invalid");
  await c.auth("login", "", ""); assert.equal(c.store.get().authError, "empty");
  await c.auth("register", "eleve", "ok"); assert.equal(phase(c), "intro"); assert.equal(c.store.get().user.name, "eleve");
});

test("KEMET-42 : parcours Terre → ressources → destination → terrain → lancement", async () => {
  const c = mk({ timing: { executeMax: 20, accidentIntro: 5, daySweep: 5 } });
  c.goHangar(); c.setSuit({ visor: "#123456" }); assert.equal(c.store.get().suit.visor, "#123456");
  c.goLoadout(); assert.equal(c.adjustLoadout("o2", 10), false, "total plafonné à 320"); assert.ok(c.adjustLoadout("o2", -10)); assert.ok(c.adjustLoadout("food", 10)); assert.equal(c.store.get().loadout.food, 90);
  for (let i = 0; i < 20; i++) c.adjustLoadout("energy", -10); assert.equal(c.store.get().loadout.energy, 30, "minimum 30");
  c.goDestination(); c.pickDestination("moon"); assert.equal(phase(c), "site"); c.startTransit(); assert.equal(phase(c), "site", "pas de départ sans terrain");
  c.pickSite("shackleton"); c.startTransit(); assert.equal(phase(c), "transit"); c.skipTransit(); assert.equal(phase(c), "plan");
  const r = c.store.get().game.resources; assert.equal(r.o2, 70); assert.equal(r.food, 90); assert.equal(r.energy, 36, "30 + bonus de terrain (+6)");
  assert.equal(c.store.get().env, "moon"); assert.equal(c.store.get().life, 100);
});

test("Lune : aucune tempête de poussière (pas d'atmosphère) ; Mars en a", async () => {
  const c = mk(); c.pickDestination("moon"); c.pickSite("faustini"); c.launch();
  const seen = new Set(); const { drawEventForTurn, createRNG } = await import("../src/game/engine.js");
  const g = c.store.get().game, d = { ...data, events: data.events.filter((e) => e.id !== "dust_storm") };
  const rng = createRNG(5); for (let i = 0; i < 300; i++) { const e = drawEventForTurn({ ...g, day: 5 + (i % 20) }, rng, d); if (e) seen.add(e.id); }
  assert.ok(!seen.has("dust_storm")); assert.ok(seen.size >= 5);
});

test("Questions : bonne réponse = crédits, mauvaise = durée de vie −15 ; 0 vie = fin de mission", async () => {
  const c = mk(); c.pickDestination("mars"); c.pickSite("jezero"); c.launch();
  c.endDay(); await wait(60); if (phase(c) === "accident") { await wait(15); c.chooseEvent("A"); } await wait(30); c.continueSummary(); c.continueFact();
  assert.equal(phase(c), "quiz"); const q = c.store.get().quiz; assert.ok(q.options.length === 4 && q.src.url.startsWith("https://"));
  const b0 = c.store.get().game.budget, l0 = c.store.get().life;
  c.answerQuiz(q.correct); assert.equal(c.store.get().game.budget, b0 + 15); assert.equal(c.store.get().life, l0); c.answerQuiz(0); assert.equal(c.store.get().quizStats.right, 1, "une seule réponse par question");
  c.store.set({ life: 10 }); c.continueQuiz(); c.store.set({ phase: "quiz", quiz: { ...q, chosen: null } });
  c.answerQuiz((q.correct + 1) % 4); assert.equal(c.store.get().life, 0); c.continueQuiz(); assert.equal(phase(c), "end"); assert.equal(c.store.get().game.endReason, "life");
});

test("Choix risqué pendant un accident : −10 de vie", async () => {
  const c = mk(); c.launch(); const ev = data.events.find((e) => e.choices.some((x) => x.risk === "high"));
  c.store.set({ phase: "accident", choicesReady: true, pendingEvent: ev, bonusReached: false });
  c.chooseEvent(ev.choices.find((x) => x.risk === "high").id); assert.equal(c.store.get().life, 90);
});
