/**
 * Liaison avec le backend KEMET-42 (contrat REST /api/mission) — fonctions pures + client HTTP.
 * Le contrat ne décrit que la forme de /status ; les autres réponses sont lues de façon tolérante
 * (plusieurs noms de champs acceptés). À resserrer quand les JSON réels sont connus.
 */
const first = (o, keys) => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k]; return undefined; };
const num = (o, keys) => { const v = Number(first(o, keys)); return Number.isFinite(v) ? v : undefined; };
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function createMissionClient(base, getToken = () => null) {
  const call = async (path, method = "GET", body) => {
    const tk = getToken();
    const r = await fetch(base.replace(/\/$/, "") + "/api/mission" + path, { method, headers: { "Content-Type": "application/json", ...(tk ? { Authorization: "Bearer " + tk } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error("http " + r.status);
    return r.status === 204 ? {} : r.json();
  };
  return {
    briefing: async () => normalizeBriefing(await call("/briefing")),
    launch: (p) => call("/launch", "POST", p),
    status: async () => normalizeStatus(await call("/status")),
    nextDay: async () => { const r = await call("/next-day", "POST", {}); return { alerts: alertsFrom(r), raw: r }; },
    reset: () => call("/reset", "POST", {}),
  };
}

export function normalizeBriefing(raw) {
  const arr = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? Object.entries(v).map(([id, x]) => ({ id, ...(typeof x === "object" ? x : { name: String(x) }) })) : []);
  const item = (x) => ({ id: String(first(x, ["id", "cargoId", "destinationId", "code"]) ?? ""), name: first(x, ["name", "label", "title", "nom"]) ?? String(first(x, ["id", "cargoId"]) ?? ""), description: first(x, ["description", "desc", "details"]) ?? "", mass: num(x, ["massKg", "mass", "weight"]), raw: x });
  const cargo = arr(first(raw, ["cargo", "cargos", "cargoOptions", "availableCargo", "cargaisons"])).map(item);
  const destinations = arr(first(raw, ["destinations", "destinationOptions"])).map(item);
  return { cargo, destinations, raw };
}

export function normalizeStatus(raw) {
  const s = raw?.status && typeof raw.status === "object" ? raw.status : raw || {};
  return { oxygenKg: num(s, ["oxygenKg", "oxygen"]), waterLiters: num(s, ["waterLiters", "water"]), foodKg: num(s, ["foodKg", "food"]), powerKwh: num(s, ["powerKwh", "power"]), radiationShield: num(s, ["radiationShield", "shield"]), day: num(s, ["day", "sol", "currentDay"]), over: first(s, ["gameOver", "missionOver", "over", "finished"]) === true, success: first(s, ["success", "missionSuccess"]) };
}

/** Jauges 0-100 pour la 3D et l'interface, à partir des valeurs réelles du serveur (base = 1er statut après lancement). */
export function toResources(st, base) {
  const pct = (v, b) => (v === undefined ? undefined : b > 0 ? clamp((100 * v) / b) : v > 0 ? 100 : 0);
  const o2 = pct(st.oxygenKg, base?.oxygenKg), water = pct(st.waterLiters, base?.waterLiters);
  const life = [o2, water].filter((x) => x !== undefined);
  return { o2: life.length ? Math.min(...life) : 0, energy: clamp(st.powerKwh ?? 0), food: pct(st.foodKg, base?.foodKg) ?? 0, protection: clamp(st.radiationShield ?? 0) };
}

export function alertsFrom(raw) {
  let a = first(raw, ["alerts", "alert", "events", "event", "warnings", "message"]);
  if (a === undefined || a === null || a === false || a === "") return [];
  if (!Array.isArray(a)) a = [a];
  return a.map((x) => { const text = typeof x === "string" ? x : first(x, ["message", "text", "description", "label", "type", "id"]) ?? JSON.stringify(x); const tag = typeof x === "string" ? x : String(first(x, ["type", "id", "code", "kind"]) ?? text); return { text: String(text), kind: kindOf(tag + " " + text) }; });
}
/** Associe une alerte du serveur à l'un des accidents visuels de la scène 3D. */
export function kindOf(s) {
  const t = s.toLowerCase();
  if (/dust|poussi|storm|temp[eê]te/.test(t)) return "dust_storm";
  if (/radiat|flare|donki|solar|[eé]ruption|cme/.test(t)) return "solar_flare";
  if (/night|nuit|power|panne|[eé]nergie/.test(t)) return "power_failure";
  if (/leak|fuite|oxyg/.test(t)) return "oxygen_leak";
  if (/comm|signal/.test(t)) return "comm_blackout";
  if (/food|faim|nourr|serre/.test(t)) return "food_shortage";
  return "power_failure";
}
export function evaluateEnd(st, day, maxDay = 30) {
  const dead = [st.oxygenKg, st.waterLiters, st.foodKg, st.powerKwh, st.radiationShield].some((v) => v !== undefined && v <= 0);
  if (st.over) return { over: true, success: st.success === true };
  if (dead) return { over: true, success: false, reason: "gauge" };
  if (day >= maxDay) return { over: true, success: true };
  return { over: false };
}
