import test from "node:test"; import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createController } from "../src/game/controller.js";
import { createMissionClient, alertsFrom, kindOf, normalizeStatus, toResources } from "../src/kemet/mission.js";
import fs from "node:fs";
const rd = (f) => JSON.parse(fs.readFileSync(new URL(`../src/data/${f}.json`, import.meta.url)));
const data = { config: rd("config"), actions: rd("actions"), events: rd("events"), facts: rd("mars-facts") };

test("normalisation tolérante", () => {
  assert.equal(kindOf("Martian dust storm"), "dust_storm"); assert.equal(kindOf("lunar_night"), "power_failure");
  assert.deepEqual(alertsFrom({ alerts: [] }), []); assert.equal(alertsFrom({ alert: "Tempête" })[0].kind, "dust_storm");
  const st = normalizeStatus({ oxygenKg: 10, waterLiters: 5, foodKg: 2, powerKwh: 80, radiationShield: 90 });
  const r = toResources(st, { oxygenKg: 20, waterLiters: 10, foodKg: 4 }); assert.equal(r.o2, 50); assert.equal(r.energy, 80);
});
test("parcours serveur complet contre le faux backend", async () => {
  const srv = spawn("node", ["scripts/mock-backend.js"], { env: { ...process.env, PORT: "3917" } });
  await new Promise((r) => setTimeout(r, 600));
  try {
    const mission = createMissionClient("http://localhost:3917");
    const c = createController({ data, mission, timing: { accidentIntro: 5 } });
    c.store.set({ phase: "loadout", user: { name: "t" } }); c.goLoadout(); assert.equal(c.store.get().phase, "cargo");
    await c.loadBriefing(); assert.ok(c.store.get().srvBriefing.cargo.length >= 2);
    c.toggleCargo("cargo_extra_o2"); c.store.set({ dest: "mars", site: "jezero" });
    await c.launchServer(); assert.equal(c.store.get().phase, "plan"); assert.ok(c.store.get().srv.oxygenKg > 0);
    for (let i = 0; i < 40 && c.store.get().phase !== "end"; i++) {
      await c.nextDayServer(); let s = c.store.get();
      if (s.phase === "accident") { await new Promise((r) => setTimeout(r, 30)); c.ackAlert(); s = c.store.get(); }
      if (s.phase === "quiz") { c.answerQuiz(s.quiz.correct); c.continueQuiz(); }
    }
    const e = c.store.get(); assert.equal(e.phase, "end"); assert.ok(e.score.total > 0);
  } finally { srv.kill(); }
});
