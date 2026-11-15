// Simulation temps réel du monde (hors React) : état partagé `rt`, entités mobiles, particules.
import { groundY } from "./terrain.js";
import { CREW_HOME, START_POS, HABITAT } from "../game/layout.js";

export const rt = {
  cmd: { x: 0, y: 0, run: false },       // entrée de déplacement (clavier / joystick)
  cam: { az: 0.55, pol: 1.02, dist: 19, fx: 0, fy: 0, fz: 8, follow: true, cine: null, intro: true },
  w: { dust: 0, flare: 0, dark: 0, alert: 0, blight: 0, static: 0, shake: 0, aurora: 0, calm: 0 },
  wT: { dust: 0, dark: 0, alert: 0, blight: 0, static: 0, aurora: 0, calm: 0 },
  tod: 0.14, todTarget: null, env: "mars",
  ents: [], hazard: null, shelter: false, placing: null, ripple: null, ice: 0, antennaSpin: 0,
  labels: { crew: [], cmd: null }, project: null, time: 0, quality: "high", hover: null,
};

const angleLerp = (a, b, t) => { let d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * Math.min(1, t); };

export function makeEnt(kind, idx, pos) {
  return { kind, idx, x: pos[0], z: pos[1], y: groundY(pos[0], pos[1]), yaw: Math.PI, vx: 0, vz: 0, speed: 0, mode: "idle", pose: "idle", target: null, run: false, onArrive: null, t: 0, wander: 2 + Math.random() * 4, alive: true, hidden: false, fade: 1, busy: false, sel: false, poseUntil: 0, phase: Math.random() * 6, home: pos, say: null, sayT: 0 };
}
export function resetEnts() {
  const fresh = CREW_HOME.map((p, i) => makeEnt("crew", i, p)); fresh.push(makeEnt("cmd", 4, START_POS)); fresh[4].yaw = Math.PI * 0.8;
  if (!rt.ents.length) rt.ents = fresh; else fresh.forEach((f, i) => Object.assign(rt.ents[i], f)); // mêmes objets : le rendu garde ses références
  rt.hazard = null; rt.placing = null; rt.ice = 0; Object.keys(rt.wT).forEach((k) => (rt.wT[k] = 0));
}
resetEnts();

export function goTo(e, x, z, { run = false, then = null } = {}) { e.target = [x, z]; e.run = run; e.onArrive = then; if (e.mode !== "dead") e.mode = "walk"; }
export const setPose = (e, pose, secs = 0) => { e.pose = pose; e.poseUntil = secs ? rt.time + secs : 0; };

export function stepEnt(e, dt, others) {
  if (!e.alive) { e.fade = Math.max(0, e.fade - dt * 0.25); e.pose = "dead"; e.y = groundY(e.x, e.z); return; }
  if (e.poseUntil && rt.time > e.poseUntil) { e.pose = "idle"; e.poseUntil = 0; }
  let want = [0, 0], moving = false;
  if (e.kind === "cmd" && (rt.cmd.x || rt.cmd.y)) {
    // déplacement relatif à la caméra
    const az = rt.cam.az, fx = -Math.sin(az), fz = -Math.cos(az), rx = Math.cos(az), rz = -Math.sin(az);
    want = [rx * rt.cmd.x + fx * -rt.cmd.y, rz * rt.cmd.x + fz * -rt.cmd.y]; e.target = null; e.onArrive = null; moving = true;
    e.run = rt.cmd.run;
  } else if (e.target) {
    const dx = e.target[0] - e.x, dz = e.target[1] - e.z, d = Math.hypot(dx, dz);
    if (d < 0.35) { e.target = null; const cb = e.onArrive; e.onArrive = null; if (cb) cb(); }
    else { want = [dx / d, dz / d]; moving = true; if (d < 1.2) want = [want[0] * d / 1.2, want[1] * d / 1.2]; }
  }
  const top = e.run ? 5.6 : 3.1;
  const len = Math.hypot(want[0], want[1]);
  const tvx = moving ? (want[0] / Math.max(1, len)) * top * Math.min(1, len) : 0, tvz = moving ? (want[1] / Math.max(1, len)) * top * Math.min(1, len) : 0;
  const k = 1 - Math.exp(-dt * 9);
  e.vx += (tvx - e.vx) * k; e.vz += (tvz - e.vz) * k;
  // séparation douce entre astronautes
  for (const o of others) { if (o === e || !o.alive || o.hidden) continue; const dx = e.x - o.x, dz = e.z - o.z, d = Math.hypot(dx, dz); if (d < 1.1 && d > 0.001) { e.vx += (dx / d) * (1.1 - d) * 4 * dt; e.vz += (dz / d) * (1.1 - d) * 4 * dt; } }
  let nx = e.x + e.vx * dt, nz = e.z + e.vz * dt;
  // collision : habitat (cercle) – on contourne
  const hx = nx - HABITAT[0], hz = nz - HABITAT[1], hd = Math.hypot(hx, hz), R = 4.9;
  if (hd < R && !e.hidden) { nx = HABITAT[0] + (hx / hd) * R; nz = HABITAT[1] + (hz / hd) * R; }
  const lim = 60, ld = Math.hypot(nx, nz); if (ld > lim) { nx *= lim / ld; nz *= lim / ld; }
  e.x = nx; e.z = nz;
  e.speed = Math.hypot(e.vx, e.vz);
  if (e.speed > 0.15) e.yaw = angleLerp(e.yaw, Math.atan2(e.vx, e.vz), dt * 10);
  const gy = groundY(e.x, e.z); e.y += (gy - e.y) * Math.min(1, dt * 14);
  e.phase += e.speed * dt * 2.6;
  if (e.sayT > 0) { e.sayT -= dt; if (e.sayT <= 0) e.say = null; }
}

// ------------------------------------------------------------------ particules
export class Pool {
  constructor(n) {
    this.n = n; this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n);
    this.s0 = new Float32Array(n); this.s1 = new Float32Array(n); this.a0 = new Float32Array(n); this.grav = new Float32Array(n); this.drag = new Float32Array(n);
    this.head = 0; this.cap = n;
  }
  emit(o) {
    if (this.cap < this.n) { if ((this.head % Math.ceil(this.n / this.cap)) !== 0) { this.head++; return; } }
    const i = this.head++ % this.n, p = i * 3;
    this.pos[p] = o.x; this.pos[p + 1] = o.y; this.pos[p + 2] = o.z;
    this.vel[p] = o.vx || 0; this.vel[p + 1] = o.vy || 0; this.vel[p + 2] = o.vz || 0;
    this.life[i] = this.max[i] = o.life || 1; this.s0[i] = o.s0 ?? 0.5; this.s1[i] = o.s1 ?? o.s0 ?? 0.5; this.a0[i] = o.a ?? 1;
    this.grav[i] = o.grav || 0; this.drag[i] = o.drag ?? 0.5;
    const c = i * 4; this.col[c] = o.r ?? 1; this.col[c + 1] = o.g ?? 1; this.col[c + 2] = o.b ?? 1;
  }
  step(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.col[i * 4 + 3] = 0; this.size[i] = 0; continue; }
      this.life[i] -= dt; const p = i * 3, t = 1 - this.life[i] / this.max[i], dr = Math.exp(-this.drag[i] * dt);
      this.vel[p] *= dr; this.vel[p + 1] = this.vel[p + 1] * dr - this.grav[i] * dt; this.vel[p + 2] *= dr;
      this.pos[p] += this.vel[p] * dt; this.pos[p + 1] += this.vel[p + 1] * dt; this.pos[p + 2] += this.vel[p + 2] * dt;
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * t;
      this.col[i * 4 + 3] = this.a0[i] * Math.min(1, t * 8) * (1 - t) ** 1.2;
    }
  }
}
export const fxSoft = new Pool(900);   // poussière, vapeur, fumée, jet d'oxygène
export const fxGlow = new Pool(420);   // étincelles, scintillements, éclats (additif)

export const burst = (pool, x, y, z, n, f) => { for (let i = 0; i < n; i++) pool.emit(f(i)); };
