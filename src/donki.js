/**
 * NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)
 * https://api.nasa.gov/DONKI/
 *
 * Uses NASA_API_KEY env if set, otherwise DEMO_KEY (rate-limited).
 * Results are cached a few minutes so gameplay stays responsive.
 */

const API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const BASE = 'https://api.nasa.gov/DONKI';

let cache = { at: 0, data: null };
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchJson(url, timeoutMs = 4000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error('http ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Returns a normalized space-weather snapshot for the game.
 * Never throws — always returns a usable object.
 */
async function getDonkiSnapshot() {
  const now = Date.now();
  if (cache.data && now - cache.at < CACHE_MS) return cache.data;

  const end = new Date();
  const start = new Date(now - 14 * 24 * 60 * 60 * 1000); // last 14 days
  const startDate = ymd(start);
  const endDate = ymd(end);

  const empty = {
    live: false,
    source: 'NASA DONKI (offline fallback)',
    cmes: [],
    flares: [],
    strongestFlare: null,
    latestCme: null,
    radiationRisk: 'low', // low | medium | high
    summary: null,
  };

  try {
    const [cmeRaw, flrRaw] = await Promise.all([
      fetchJson(`${BASE}/CME?startDate=${startDate}&endDate=${endDate}&api_key=${API_KEY}`).catch(() => []),
      fetchJson(`${BASE}/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${API_KEY}`).catch(() => []),
    ]);

    const cmes = Array.isArray(cmeRaw) ? cmeRaw : [];
    const flares = Array.isArray(flrRaw) ? flrRaw : [];

    // Rank flares: X > M > C > B > A
    const rank = (cls) => {
      if (!cls) return 0;
      const c = String(cls).toUpperCase();
      if (c.startsWith('X')) return 40 + parseFloat(c.slice(1) || 0);
      if (c.startsWith('M')) return 20 + parseFloat(c.slice(1) || 0);
      if (c.startsWith('C')) return 10 + parseFloat(c.slice(1) || 0);
      return 1;
    };

    const sortedFlares = [...flares].sort((a, b) => rank(b.classType) - rank(a.classType));
    const strongestFlare = sortedFlares[0] || null;
    const latestCme = cmes.length
      ? [...cmes].sort((a, b) => String(b.startTime || '').localeCompare(String(a.startTime || '')))[0]
      : null;

    let radiationRisk = 'low';
    if (strongestFlare && rank(strongestFlare.classType) >= 20) radiationRisk = 'medium';
    if (strongestFlare && rank(strongestFlare.classType) >= 40) radiationRisk = 'high';
    if (cmes.length >= 3) radiationRisk = radiationRisk === 'low' ? 'medium' : radiationRisk;

    let summary = null;
    if (strongestFlare) {
      summary = `Éruption solaire classe ${strongestFlare.classType || '?'} (DONKI ${String(strongestFlare.beginTime || strongestFlare.peakTime || '').slice(0, 10)})`;
    } else if (latestCme) {
      summary = `CME détectée (DONKI ${String(latestCme.startTime || '').slice(0, 10)})`;
    }

    const data = {
      live: true,
      source: 'NASA DONKI API (live)',
      cmes: cmes.slice(0, 5),
      flares: sortedFlares.slice(0, 5),
      strongestFlare,
      latestCme,
      radiationRisk,
      summary,
      fetchedAt: new Date().toISOString(),
    };

    cache = { at: now, data };
    return data;
  } catch (err) {
    console.warn('[DONKI] fetch failed:', err.message || err);
    // Curated real-style fallback so the game still teaches the concept
    const fallback = {
      ...empty,
      radiationRisk: 'medium',
      summary: 'Activité solaire récente (archive DONKI — mode secours)',
      strongestFlare: { classType: 'M2.1', beginTime: '2024-05-10T06:27Z' },
      source: 'NASA DONKI (archive de secours)',
    };
    cache = { at: now, data: fallback };
    return fallback;
  }
}

/**
 * Turn a DONKI snapshot into a game alert (or null if quiet).
 * @param {{ shielded: boolean }} opts
 */
function donkiToAlert(snapshot, opts = {}) {
  if (!snapshot || snapshot.radiationRisk === 'low') return null;

  const shielded = !!opts.shielded;
  const high = snapshot.radiationRisk === 'high';
  const hit = high ? (shielded ? 12 : 22) : (shielded ? 6 : 14);

  const classLabel = snapshot.strongestFlare?.classType
    ? `classe ${snapshot.strongestFlare.classType}`
    : 'CME';

  const liveTag = snapshot.live ? 'LIVE' : 'archive';

  return {
    type: 'radiation',
    kind: 'solar_flare',
    message: `Alerte DONKI (${liveTag}) : éruption ${classLabel}. Bouclier impacté.`,
    text: `Alerte DONKI (${liveTag}) : éruption ${classLabel}. Bouclier impacté.`,
    source: snapshot.source,
    details: snapshot.summary,
    shieldDamage: hit,
    radiationRisk: snapshot.radiationRisk,
  };
}

module.exports = { getDonkiSnapshot, donkiToAlert };
