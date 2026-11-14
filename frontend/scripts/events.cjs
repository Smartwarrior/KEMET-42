const { chromium } = require("playwright"); const path = require("path");
const out = process.argv[2], W = +process.argv[3] || 1280, H = +process.argv[4] || 720;
(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 240)); });
  await page.goto("file://" + path.resolve("dist/index.html")); await page.waitForTimeout(2000);
  await page.click("text=Nouvelle mission"); await page.waitForTimeout(500); await page.click("text=Lancer la mission"); await page.waitForTimeout(800);
  await page.evaluate(() => window.__ctrl.endTutorial());
  const ids = ["dust_storm", "solar_flare", "power_failure", "oxygen_leak", "food_shortage", "ice_discovery", "comm_blackout", "calm_sol"];
  for (const id of ids) {
    await page.evaluate((id) => { const c = window.__ctrl, ev = c.data.events.find((e) => e.id === id); c.store.set({ phase: "accident", pendingEvent: ev, choicesReady: false, bonusReached: false }); c.bus.emit("accident", { event: ev, hazard: window.__hz[id] }); setTimeout(() => c.store.set({ choicesReady: true }), 1800); }, id);
    await page.waitForTimeout(1400); await page.screenshot({ path: `${out}/e_${id}_1.png` });
    await page.waitForTimeout(2200); await page.screenshot({ path: `${out}/e_${id}_2.png` });
    await page.evaluate(() => window.__ctrl.chooseEvent("A")); await page.waitForTimeout(4000);
    await page.evaluate(() => { const c = window.__ctrl; c.continueSummary(); c.continueFact(); });
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => { const s = window.__ctrl.store.get(); return s.phase + " d" + s.game.day + " crew" + s.game.crew; }); console.log(id, st);
  }
  console.log(JSON.stringify(errs.slice(0, 10), null, 1)); await browser.close();
})().catch((e) => { console.error("SCRIPT", e.message.split("\n")[0]); process.exit(1); });
