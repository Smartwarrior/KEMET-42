// Partie en mode serveur : lancer d'abord `PORT=3917 node scripts/mock-backend.js`, builder avec VITE_API_URL=http://localhost:3917
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await (await b.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: "block", locale: "fr-FR" })).newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  const S = (n) => page.screenshot({ path: `${out}/s_${n}.png` }); const W = (ms) => page.waitForTimeout(ms);
  await page.goto("file://" + path.resolve("dist/index.html")); await W(2500);
  await page.click("text=Pas encore de compte"); await page.fill("input >> nth=0", "Amina"); await page.fill("input[type=password]", "motdepasse"); await page.click("button.primary"); await W(1500);
  await page.click("text=Nouvelle mission"); await W(500); await page.click("text=Suivant"); await W(1200); await S("1_cargo");
  await page.click(".lo-row >> nth=0"); await page.click(".lo-row >> nth=1"); await page.click("text=Suivant"); await W(1800);
  await page.click("text=Aller sur Mars"); await W(500); await page.click(".site >> nth=0"); await page.click("text=Décoller"); await W(1000);
  await page.evaluate(() => window.__ctrl.skipTransit()); await W(3000); await page.evaluate(() => window.__ctrl.endTutorial()); await W(800); await S("2_plan");
  for (let i = 0; i < 6; i++) { await page.click("text=Sol suivant"); for (let k = 0; k < 40; k++) { await W(300); const ph = await page.evaluate(() => window.__ctrl.store.get().phase); if (ph === "accident") { await W(2800); await S("3_alert"); await page.evaluate(() => window.__ctrl.ackAlert()); } if (ph === "quiz" || ph === "plan" || ph === "end") break; }
    if (await page.evaluate(() => window.__ctrl.store.get().phase) === "quiz") { if (i === 1) await S("4_quiz"); await page.evaluate(() => { const c = window.__ctrl; c.answerQuiz(c.store.get().quiz.correct); }); await W(300); await page.evaluate(() => window.__ctrl.continueQuiz()); await W(500); } }
  await S("5_after"); console.log(await page.evaluate(() => { const s = window.__ctrl.store.get(); return JSON.stringify({ phase: s.phase, life: s.life, day: s.game.day, srv: s.srv }); })); console.log(JSON.stringify(errs)); await b.close();
})().catch((e) => { console.error("SCRIPT", e.message.split("\n")[0]); process.exit(1); });
