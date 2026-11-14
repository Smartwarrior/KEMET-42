// Faux backend KEMET-42 pour tester le front sans le vrai serveur. Respecte le contrat /api/mission.
// ⚠ Les formules viennent du cahier des charges, NON vérifiées : ne pas les présenter comme « données NASA ».
import http from "node:http";
const PORT = process.env.PORT || 3000;
const CARGO = [
  { id: "cargo_kilopower", name: "Réacteur Kilopower", description: "Énergie nucléaire compacte (cahier des charges)" },
  { id: "cargo_extra_o2", name: "Réserve d'O₂ supplémentaire", description: "Bouteilles d'oxygène additionnelles" },
  { id: "cargo_greenhouse", name: "Serre hydroponique", description: "Production de nourriture" },
  { id: "cargo_radlab", name: "Blindage RadLab", description: "Protection contre les radiations" },
];
const DEST = [{ id: "MOON", name: "Lune" }, { id: "MARS", name: "Mars" }];
let m; const fresh = () => (m = { dest: null, day: 0, o2: 0, water: 0, food: 0, power: 100, shield: 100, cargo: [] }); fresh();
const users = new Map(); const scores = [];
const send = (res, code, body) => { res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }); res.end(body === undefined ? "" : JSON.stringify(body)); };
const status = () => ({ oxygenKg: +m.o2.toFixed(1), waterLiters: +m.water.toFixed(1), foodKg: +m.food.toFixed(1), powerKwh: Math.round(m.power), radiationShield: Math.round(m.shield), day: m.day });
http.createServer((req, res) => {
  if (req.method === "OPTIONS") return send(res, 204);
  let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
    const body = b ? JSON.parse(b) : {}; const u = req.url.split("?")[0];
    if (u === "/api/mission/briefing") return send(res, 200, { destinations: DEST, cargo: CARGO });
    if (u === "/api/mission/launch") { const d = DEST.find((x) => x.id === body.destinationId); if (!d) return send(res, 400, { error: "destination" }); fresh(); m.dest = d.id; m.day = 1; m.cargo = body.selectedCargo || []; const n = body.crewCount || 4; const x = m.cargo.includes("cargo_extra_o2") ? 1.5 : 1; m.o2 = 0.8 * n * 30 * x; m.water = 2.5 * n * 30; m.food = 1.8 * n * 30; m.n = n; return send(res, 200, { ok: true, status: status() }); }
    if (u === "/api/mission/status") return send(res, 200, status());
    if (u === "/api/mission/next-day") {
      m.day++; m.o2 = Math.max(0, m.o2 - 0.8 * m.n); m.water = Math.max(0, m.water - 2.5 * m.n * 0.02 * 0 - 0.5); m.food = Math.max(0, m.food - 1.8 * m.n);
      m.power = Math.max(0, m.power - (m.cargo.includes("cargo_kilopower") ? 0.5 : 2)); m.shield = Math.max(0, m.shield - (m.cargo.includes("cargo_radlab") ? 0.3 : 1));
      const alerts = []; if (m.dest === "MARS" && m.day % 5 === 0) { alerts.push({ type: "dust_storm", message: "Tempête de poussière martienne" }); m.power = Math.max(0, m.power - 8); }
      if (m.dest === "MOON" && m.day % 6 === 0) { alerts.push({ type: "lunar_night", message: "Nuit lunaire : production solaire nulle" }); m.power = Math.max(0, m.power - 8); }
      return send(res, 200, { day: m.day, alerts });
    }
    if (u === "/api/mission/reset") { fresh(); return send(res, 200, { ok: true }); }
    if (u === "/auth/register" || u === "/auth/login") { const { name, password } = body; const ex = users.get(name);
      if (u.endsWith("register")) { if (ex) return send(res, 409, {}); users.set(name, password); } else if (ex !== password) return send(res, 401, {});
      return send(res, 200, { token: "t-" + name, user: { name } }); }
    if (u === "/scores") { if (req.method === "POST") { scores.push(body); return send(res, 200, { ok: true }); } return send(res, 200, scores); }
    send(res, 404, { error: "not found" });
  });
}).listen(PORT, () => console.log("mock KEMET-42 sur http://localhost:" + PORT));
