// Relief martien procédural, partagé par le rendu et la simulation (les pieds des astronautes suivent le sol).
const fract = (x) => x - Math.floor(x);
const hash = (x, z) => fract(Math.sin(x * 127.1 + z * 311.7) * 43758.5453);
const sm = (t) => t * t * (3 - 2 * t);
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = sm(x - xi), zf = sm(z - zi);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * xf + (c - a) * zf + (a - b - c + d) * xf * zf;
}
function fbm(x, z, o = 4) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * vnoise(x, z); x = x * 2.03 + 11.3; z = z * 2.03 - 7.1; a *= 0.5; } return s; }
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const CRATERS = [[-34, -22, 9, 2.4], [30, -34, 12, 3.2], [-46, 30, 7, 1.8], [40, 28, 10, 2.6], [8, -52, 14, 3.6], [-62, -5, 11, 2.8]];

export function groundY(x, z) {
  const d = Math.hypot(x, z);
  let h = (fbm(x * 0.03, z * 0.03) - 0.4) * 11 + (fbm(x * 0.11, z * 0.11, 2) - 0.5) * 0.7;
  for (const [cx, cz, r, depth] of CRATERS) {
    const q = Math.hypot(x - cx, z - cz) / r;
    h += -depth * Math.exp(-q * q * 2.2) + depth * 0.55 * Math.exp(-((q - 1.15) ** 2) * 9);
  }
  h += smoothstep(55, 105, d) * 16 * (0.6 + fbm(x * 0.02 + 5, z * 0.02, 3));
  return h * smoothstep(23, 46, d) + (fbm(x * 0.35, z * 0.35, 1) - 0.5) * 0.06;
}

export function colorAt(x, z, y, out, env = "mars") {
  const n = fbm(x * 0.05 + 3, z * 0.05, 3), m = fbm(x * 0.12, z * 0.12, 2);
  const t = Math.min(1, Math.max(0, 0.5 + y / 18 + (n - 0.5) * 0.5));
  // basalte sombre → ocre → rouille → poussière claire en altitude
  const lo = [0.42, 0.20, 0.12], mid = [0.72, 0.36, 0.18], hi = [0.86, 0.58, 0.36];
  const a = t < 0.5 ? lo : mid, b = t < 0.5 ? mid : hi, k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const v = 0.94 + m * 0.12;
  if (env === "moon") { const g = (0.34 + t * 0.34) * v; out[0] = g; out[1] = g * 0.985; out[2] = g * 0.96; return out; }
  out[0] = (a[0] + (b[0] - a[0]) * k) * v; out[1] = (a[1] + (b[1] - a[1]) * k) * v; out[2] = (a[2] + (b[2] - a[2]) * k) * v;
  return out;
}
