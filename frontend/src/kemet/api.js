/**
 * Couche d'accès au backend KEMET-42.
 * :i-alert: Les routes ci-dessous sont une HYPOTHÈSE de contrat (REST + JWT) : à aligner sur le backend réel (voir README).
 *   VITE_API_URL défini  → appels HTTP réels.
 *   VITE_API_URL absent  → mode DÉMO local (comptes stockés dans le navigateur) pour pouvoir présenter l'application.
 */
const enc = new TextEncoder();
// Repli sans crypto.subtle (indisponible hors https/localhost) : empreinte FNV-1a double (démo uniquement).
function fnv(txt) { let a = 0x811c9dc5, b = 0x01000193; for (let i = 0; i < txt.length; i++) { a = Math.imul(a ^ txt.charCodeAt(i), 16777619) >>> 0; b = Math.imul(b + a, 2246822519) >>> 0; } return a.toString(16) + b.toString(16); }
async function sha(txt) { if (!globalThis.crypto?.subtle) return "f" + fnv(txt); const b = await crypto.subtle.digest("SHA-256", enc.encode(txt)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "") ?? d; } catch (_) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

export function demoApi() {
  return {
    mode: "demo",
    async register(name, password) {
      const users = jget("kemet_demo_users", {}); const key = name.trim().toLowerCase();
      if (users[key]) throw new Error("exists");
      users[key] = { name: name.trim(), hash: await sha("kemet42:" + password) }; jset("kemet_demo_users", users);
      return { token: "demo", user: { name: name.trim() } };
    },
    async login(name, password) {
      const u = jget("kemet_demo_users", {})[name.trim().toLowerCase()];
      if (!u || u.hash !== (await sha("kemet42:" + password))) throw new Error("invalid");
      return { token: "demo", user: { name: u.name } };
    },
    async submitScore(_t, s) { const all = jget("kemet_demo_scores", []); all.push({ ...s, at: Date.now() }); jset("kemet_demo_scores", all.slice(-50)); return true; },
    async leaderboard() { return jget("kemet_demo_scores", []).sort((a, b) => b.score - a.score).slice(0, 10); },
  };
}

export function httpApi(base) {
  const call = async (path, method = "GET", body, token) => {
    const r = await fetch(base.replace(/\/$/, "") + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(r.status === 409 ? "exists" : r.status === 401 ? "invalid" : r.status === 404 || r.status === 405 ? "noroute" : "network");
    return r.status === 204 ? null : r.json();
  };
  return {
    mode: "http",
    register: (name, password) => call("/auth/register", "POST", { name, password }),
    login: (name, password) => call("/auth/login", "POST", { name, password }),
    submitScore: (token, s) => call("/scores", "POST", s, token),
    leaderboard: (token) => call("/scores", "GET", null, token),
  };
}
export const createApi = () => (import.meta.env?.VITE_API_URL ? httpApi(import.meta.env.VITE_API_URL) : demoApi());

/** Distance Terre→astre et temps-lumière EN DIRECT depuis l'API JPL Horizons (aucune valeur de repli inventée). */
export async function fetchHorizons(horizonsId, now = new Date()) {
  const d0 = now.toISOString().slice(0, 10), d1 = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='${horizonsId}'&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='${d0}'&STOP_TIME='${d1}'&STEP_SIZE='1 d'&QUANTITIES='20,21'`;
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("http " + r.status);
    const txt = (await r.json()).result || ""; const m = txt.split("$$SOE")[1]?.split("$$EOE")[0]?.trim().split("\n")[0]; if (!m) throw new Error("no data");
    const nums = (m.replace(/^\s*\d{4}-\w{3}-\d{2}\s+\d{2}:\d{2}/, "").match(/-?\d+\.\d+(?:[eE][-+]?\d+)?/g) || []).map(Number);
    if (nums.length < 3) throw new Error("parse");
    const [au, kms, lt] = nums; return { ok: true, au, km: au * 149597870.7, rangeRate: kms, lightMin: lt, date: d0 };
  } catch (e) { return { ok: false }; } finally { clearTimeout(to); }
}
