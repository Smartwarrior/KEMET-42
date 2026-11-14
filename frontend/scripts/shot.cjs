// Usage: node shot.cjs <outDir> [w] [h]
const { chromium } = require("playwright"); const path = require("path");
const out = process.argv[2], W = +process.argv[3] || 1280, H = +process.argv[4] || 720;
(async () => {
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message)); page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errs.push(m.type() + ": " + m.text().slice(0, 240)); });
  await page.goto("file://" + path.resolve("dist/index.html")); await page.waitForTimeout(4000);
  await page.screenshot({ path: out + "/01_intro.png" });
  await page.click("text=Nouvelle mission"); await page.waitForTimeout(2500); await page.screenshot({ path: out + "/02_briefing.png" });
  await page.click("text=Lancer la mission"); await page.waitForTimeout(3500); await page.screenshot({ path: out + "/03_play.png" });
  console.log(JSON.stringify(errs.slice(0, 12), null, 1)); await browser.close();
})().catch((e) => { console.error("SCRIPT", e.message.split("\n")[0]); process.exit(1); });
