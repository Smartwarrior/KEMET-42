// Usage: node play.cjs <outDir> [w] [h]  — joue un début de partie et capture les moments clés
const { chromium } = require("playwright"); const path = require("path");
const out = process.argv[2], W = +process.argv[3] || 1280, H = +process.argv[4] || 720;
(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: "block", hasTouch: false });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 240)); });
  await page.goto("file://" + path.resolve("dist/index.html")); await page.waitForTimeout(2500);
  await page.click("text=Nouvelle mission"); await page.waitForTimeout(800); await page.click(".chip >> text=Boréal"); await page.waitForTimeout(1200);
  await page.screenshot({ path: out + "/b1_commander.png" });
  await page.click("text=Lancer la mission"); await page.waitForTimeout(1200);
  await page.evaluate(() => window.__ctrl.endTutorial()); await page.waitForTimeout(2500);
  await page.screenshot({ path: out + "/p1_idle.png" });
  // déplacement au clavier
  await page.keyboard.down("d"); await page.waitForTimeout(1500); await page.keyboard.up("d");
  await page.screenshot({ path: out + "/p2_moved.png" });
  // construction : générateur d'oxygène + placement
  await page.click(".card >> text=Générateur"); await page.waitForTimeout(900); await page.screenshot({ path: out + "/p3_placing.png" });
  await page.click("text=Placer automatiquement"); await page.waitForTimeout(300);
  await page.click(".card >> text=Réserve"); await page.waitForTimeout(300);
  await page.screenshot({ path: out + "/p4_plan.png" });
  await page.click(".go"); for (let i = 1; i <= 4; i++) { await page.waitForTimeout(1300); await page.screenshot({ path: out + `/p5_exec${i}.png` }); }
  console.log(await page.evaluate(() => JSON.stringify({ phase: window.__ctrl.store.get().phase, day: window.__ctrl.store.get().game.day, built: window.__ctrl.store.get().built })));
  console.log(JSON.stringify(errs.slice(0, 10), null, 1)); await browser.close();
})().catch((e) => { console.error("SCRIPT", e.message.split("\n")[0]); process.exit(1); });
