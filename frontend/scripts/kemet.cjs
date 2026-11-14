// Simulation de bout en bout du parcours KEMET-42 : node scripts/kemet.cjs <outDir> [moon|mars] [w] [h]
const { chromium } = require("playwright"); const path = require("path");
const out = process.argv[2], dest = process.argv[3] || "moon", W = +process.argv[4] || 1280, H = +process.argv[5] || 720;
(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: "block", locale: "fr-FR" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 200)); });
  const S = async (n) => page.screenshot({ path: `${out}/k_${dest}_${n}.png` });
  await page.goto("file://" + path.resolve("dist/index.html")); await page.waitForTimeout(2500);
  await S("01_login");
  await page.click("text=Pas encore de compte"); await page.fill("input >> nth=0", "Amina"); await page.fill("input[type=password]", "motdepasse"); await page.click("button.primary"); await page.waitForTimeout(1500); await S("02_intro");
  await page.click("text=Nouvelle mission"); await page.waitForTimeout(600);
  await page.click(".chip >> text=Comète"); await page.click(".swatches >> nth=0 >> button >> nth=1"); await page.click(".patches button >> nth=1"); await page.fill(".lbl input", "Amina"); await S("03_hangar");
  await page.click("text=Suivant"); await page.waitForTimeout(400);
  await page.click(".lo-row >> nth=2 >> button >> nth=0"); await page.click(".lo-row >> nth=1 >> button >> nth=1"); await S("04_loadout");
  await page.click("text=Suivant"); await page.waitForTimeout(1800); await S("05_destination");
  await page.click(dest === "moon" ? "text=Aller sur La Lune" : "text=Aller sur Mars"); await page.waitForTimeout(500);
  await page.click(".site >> nth=0"); await page.waitForTimeout(300); await S("06_site");
  await page.click("text=Décoller"); await page.waitForTimeout(2500); await S("07_transit");
  await page.evaluate(() => window.__ctrl.skipTransit()); await page.waitForTimeout(2500);
  await page.evaluate(() => window.__ctrl.endTutorial()); await page.waitForTimeout(1500); await S("08_surface"); await page.evaluate(() => { window.__rt.cam.dist = 42; window.__rt.cam.pol = 1.2; window.__rt.cam.az = 2.6; }); await page.waitForTimeout(2500); await S("08b_wide"); await page.evaluate(() => { window.__rt.cam.dist = 19; window.__rt.cam.pol = 1.02; window.__rt.cam.az = 0.55; });
  // un jour : action + fin de journée, puis accident, puis question
  await page.click(".card >> text=Réserve"); await page.click(".go");
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(500); const ph = await page.evaluate(() => window.__ctrl.store.get().phase); if (ph === "accident") break; if (ph === "quiz") break; if (ph === "summary") await page.evaluate(() => window.__ctrl.continueSummary()); if (ph === "fact") await page.evaluate(() => window.__ctrl.continueFact()); }
  await page.waitForTimeout(2800); await S("09_accident");
  await page.evaluate(() => { const c = window.__ctrl; if (c.store.get().phase === "accident") { const ev = c.store.get().pendingEvent; c.chooseEvent((ev.choices.find((x) => x.risk === "high") || ev.choices[0]).id); } });
  for (let i = 0; i < 30; i++) { await page.waitForTimeout(400); const ph = await page.evaluate(() => window.__ctrl.store.get().phase); if (ph === "quiz") break; if (ph === "summary") { await S("10_summary"); await page.evaluate(() => window.__ctrl.continueSummary()); } if (ph === "fact") await page.evaluate(() => window.__ctrl.continueFact()); }
  await page.waitForTimeout(600); await S("11_quiz");
  await page.evaluate(() => { const c = window.__ctrl, q = c.store.get().quiz; c.answerQuiz((q.correct + 1) % 4); }); await page.waitForTimeout(500); await S("12_quiz_wrong");
  console.log(await page.evaluate(() => { const s = window.__ctrl.store.get(); return JSON.stringify({ phase: s.phase, life: s.life, env: s.env, dest: s.dest, res: s.game.resources, quiz: s.quizStats }); }));
  console.log(JSON.stringify(errs.slice(0, 8))); await browser.close();
})().catch((e) => { console.error("SCRIPT", e.message.split("\n")[0]); process.exit(1); });
