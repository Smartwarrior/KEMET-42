import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Astronaut } from "./Astronaut.jsx";
import { rt, stepEnt, goTo, setPose, fxSoft, fxGlow, resetEnts } from "./sim.js";
import { CREW, CALLSIGN_COLORS, SLOTS, AIRLOCK, ANTENNA, HAZARDS, CREW_HOME, START_POS, SHELTER_IN, SHELTER_INSIDE } from "../game/layout.js";
import { groundY } from "./terrain.js";
import { focusCrew } from "./interact.js";
import { useSel } from "../game/useStore.js";

const sched = [];
export const after = (secs, fn) => sched.push({ t: rt.time + secs, fn });
const near = (p, d = 2.2) => { const a = Math.random() * 6.28; return [p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d]; };

export function Crew({ ctrl }) {
  const callsign = useSel(ctrl, (s) => s.callsign), suit = useSel(ctrl, (s) => s.suit);
  const accent = CALLSIGN_COLORS[callsign] || "#E2552B";
  const ents = rt.ents;

  useEffect(() => {
    const { bus, store } = ctrl;
    const E = () => rt.ents, crew = (i) => E()[i];
    const sparks = (x, y, z, n = 8, c = [1, 0.7, 0.3]) => { for (let i = 0; i < n; i++) fxGlow.emit({ x, y, z, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 5, life: 0.5 + Math.random() * 0.5, s0: 0.28, s1: 0.04, grav: 14, drag: 0.3, r: c[0], g: c[1], b: c[2] }); };
    const say = (e, text, secs = 2.4) => { e.say = text; e.sayT = secs; };
    const work = (e, secs, fx, then) => {
      setPose(e, "work");
      const n = Math.floor(secs / 0.12);
      for (let i = 0; i < n; i++) after(i * 0.12, () => fx && fx(i));
      after(secs, () => { setPose(e, "idle"); then && then(); });
    };

    const offPerform = bus.on("perform", ({ def, slot, crewIdx, done }) => {
      const e = crew(crewIdx); if (!e) return done();
      e.busy = true; e.hidden = false; let fin = false;
      const finish = () => { if (fin) return; fin = true; e.busy = false; setPose(e, "idle"); done(); };
      if (def.type === "build") {
        const sp = SLOTS[def.moduleType][slot], gy = groundY(sp[0], sp[1]);
        const stand = [sp[0] + (sp[0] > 0 ? -2.6 : 2.6) * 0.8, sp[1] + 2.2];
        goTo(e, stand[0], stand[1], { run: true, then: () => { e.yaw = Math.atan2(sp[0] - e.x, sp[1] - e.z); work(e, 1.5, () => sparks(sp[0], gy + 0.4, sp[1], 3), () => { bus.emit("buildDone", { type: def.moduleType, slot }); finish(); }); } });
      } else if (def.type === "repair") {
        goTo(e, 3.4, 3.4, { run: true, then: () => { e.yaw = Math.atan2(-e.x, -e.z); work(e, 1.6, () => sparks(1.6, 1.4, 2.2, 3), () => { say(e, "OK", 1.5); finish(); }); } });
      } else if (def.type === "science") {
        goTo(e, ANTENNA[0] + 2, ANTENNA[1] + 2, { run: true, then: () => { rt.antennaSpin = 3; setPose(e, "wave", 1.6); for (let i = 0; i < 18; i++) after(i * 0.09, () => fxGlow.emit({ x: ANTENNA[0], y: 3.6, z: ANTENNA[1], vx: 0, vy: 6, vz: 0, life: 1.2, s0: 0.5, s1: 0.1, r: 0.5, g: 0.9, b: 1, drag: 0 })); say(e, "+30", 2); after(1.7, finish); } });
      } else {
        const at = def.target === "energy" ? [14, 1] : def.target === "o2" ? [0, -10.5] : def.target === "food" ? [-12, 2] : [0, 8];
        goTo(e, at[0] + 1.8, at[1] + 1.8, { run: true, then: () => work(e, 1.2, () => fxGlow.emit({ x: e.x, y: 1.4, z: e.z, vx: 0, vy: 2, vz: 0, life: 0.9, s0: 0.5, s1: 0.1, r: 0.4, g: 1, b: 0.8 }), () => { say(e, "+20", 1.6); finish(); }) });
      }
      after(8.5, finish);
    });

    /** Chorée réparation pendant un incident : spécialiste → zone → pose work + étincelles → confirmation. */
    const offRepair = bus.on("repair", ({ hazard, success = true, onDone }) => {
      const hz = hazard || rt.hazard;
      if (!hz?.pos) { onDone && onDone(); return; }
      const idx = hz.crewIdx != null ? hz.crewIdx : (HAZARDS[hz.id]?.crewIdx ?? 1);
      const e = crew(idx);
      const cmd = E()[4];
      const gx = hz.pos[0], gz = hz.pos[1], gy = groundY(gx, gz);
      const stand = near([gx, gz], 1.6);
      rt.cam.cine = { x: gx, z: gz, until: rt.time + 5.5, dist: 14, pol: 1.05 };
      const runRepair = (actor) => {
        if (!actor || !actor.alive) { onDone && onDone(); return; }
        actor.busy = true; actor.hidden = false;
        goTo(actor, stand[0], stand[1], {
          run: true,
          then: () => {
            actor.yaw = Math.atan2(gx - actor.x, gz - actor.z);
            work(actor, 2.2, () => sparks(gx, gy + 0.5, gz, 4, success ? [0.4, 1, 0.6] : [1, 0.3, 0.2]), () => {
              say(actor, success ? "OK" : "…", 1.8);
              if (success) {
                for (let i = 0; i < 12; i++) fxGlow.emit({ x: gx, y: gy + 0.8, z: gz, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, life: 0.9, s0: 0.35, s1: 0.05, r: 0.5, g: 1, b: 0.7 });
              }
              actor.busy = false;
              onDone && onDone();
            });
          },
        });
      };
      // spécialiste + commandant s'il est déjà proche
      runRepair(e);
      if (cmd && Math.hypot(cmd.x - gx, cmd.z - gz) < 6) {
        goTo(cmd, near([gx, gz], 2.4)[0], near([gx, gz], 2.4)[1], { run: true });
      }
    });

    /** Entrée / sortie d'abri : équipage vers le sas puis intérieur (hidden) ; caméra sur l'habitat. */
    const offShelter = bus.on("shelter", ({ enter }) => {
      const alive = E().slice(0, 4).filter((x) => x.alive);
      const cmd = E()[4];
      if (enter) {
        rt.shelter = true;
        rt.cam.cine = { x: 0, z: 1.2, until: rt.time + 8, dist: 9, pol: 1.25 };
        alive.forEach((e, i) => {
          e.busy = true;
          goTo(e, SHELTER_IN[0] + (i - 1.5) * 0.4, SHELTER_IN[1], {
            run: true,
            then: () => { e.hidden = true; setPose(e, "crouch"); },
          });
        });
        if (cmd) {
          goTo(cmd, SHELTER_IN[0], SHELTER_IN[1] + 0.6, {
            run: true,
            then: () => { cmd.hidden = true; setPose(cmd, "crouch"); },
          });
        }
      } else {
        rt.shelter = false;
        rt.cam.cine = null;
        [...alive, cmd].filter(Boolean).forEach((e) => {
          e.hidden = false;
          e.busy = false;
          const home = e.home || START_POS;
          goTo(e, home[0], home[1]);
          setPose(e, "idle");
        });
      }
    });

    const offAcc = bus.on("accident", ({ event, hazard }) => {
      const id = event.id, E_ = E(), alive = E_.slice(0, 4).filter((e) => e.alive), W = rt.wT;
      const hzDef = hazard || HAZARDS[id] || null;
      rt.hazard = hzDef?.pos
        ? { id, pos: hzDef.pos, bonus: hzDef.bonus, reached: false, crewIdx: hzDef.crewIdx }
        : { id, pos: null, crewIdx: hzDef?.crewIdx };
      alive.forEach((e) => (e.busy = true));
      const panic = (e, s) => { setPose(e, "panic", s); };
      rt.cam.cine = { x: hzDef?.pos ? hzDef.pos[0] : 0, z: hzDef?.pos ? hzDef.pos[1] : 4, until: rt.time + 4.6, dist: 22, pol: 1.0 };
      if (id === "dust_storm") { W.dust = 1; rt.w.shake = 0.35; alive.forEach((e, i) => { goTo(e, near([0, 6], 2.5 + i * 0.5)[0], near([0, 6], 3)[1], { run: true, then: () => setPose(e, "crouch") }); }); }
      else if (id === "solar_flare") { W.aurora = 1; rt.w.flare = 1; W.alert = 1; alive.forEach((e, i) => goTo(e, AIRLOCK[0] + (i - 1.5) * 0.35, AIRLOCK[1] - 0.2, { run: true, then: () => { e.hidden = true; } })); }
      else if (id === "power_failure" || id === "life_support_fail") { W.dark = 1; W.alert = 1; rt.w.shake = 0.2; alive.forEach((e, i) => { panic(e, 3); after(0.2 * i, () => e.target || goTo(e, near(e.home, 2)[0], near(e.home, 2)[1], { run: true })); }); }
      else if (id === "oxygen_leak") { W.alert = 1; const hz = hzDef?.pos || [0, -12]; alive.forEach((e, i) => { if (i === 0) goTo(e, hz[0] + 3, hz[1] + 3, { run: true, then: () => panic(e, 4) }); else panic(e, 3); }); }
      else if (id === "food_shortage" || id === "greenhouse_contam") { W.blight = 1; alive.forEach((e) => { setPose(e, "crouch", 4); }); }
      else if (id === "comm_blackout") { W.static = 1; alive.forEach((e) => panic(e, 2.5)); rt.antennaSpin = 6; }
      else if (id === "ice_discovery") { rt.ice = 0.01; W.calm = 0.5; const p = hzDef?.pos || [12, 14]; alive.forEach((e, i) => goTo(e, p[0] + (i - 1.5) * 1.1, p[1] - 2.2, { run: true, then: () => setPose(e, "cheer", 6) })); }
      else if (id === "calm_sol") { W.calm = 1; alive.forEach((e) => setPose(e, "wave", 5)); }
    });

    const offRes = bus.on("resolve", ({ after: nx, crewLost, event }) => {
      const W = rt.wT; const dust = nx.status?.dust > 0;
      W.dust = dust ? 0.7 : 0; W.dark = 0; W.alert = 0; W.blight = (event?.id === "food_shortage" || event?.id === "greenhouse_contam") ? 0.5 : 0; W.static = 0; W.aurora = 0; W.calm = 0;
      rt.hazard = null; rt.shelter = false; rt.cam.cine = null; rt.todSpeed = (0.985 - rt.tod) / 3.2;
      rt.ents.forEach((e) => { if (e) { e.hidden = false; } });
      rt.ents.slice(0, 4).forEach((e, i) => { if (i >= nx.crew) { if (e.alive) { e.alive = false; e.busy = true; e.hidden = false; sparks(e.x, 1.2, e.z, 14, [0.8, 0.8, 1]); } } });
    });
    const offReset = bus.on("reset", ({ resume }) => {
      resetEnts(); rt.todSpeed = 0; rt.tod = 0.1; rt.w.dust = 0; rt.cam.cine = null; rt.shelter = false;
      const g = store.get().game; rt.ents.slice(0, 4).forEach((e, i) => { if (i >= g.crew) { e.alive = false; e.fade = 0; } });
      if (g.status?.dust > 0) rt.wT.dust = 0.7;
    });
    const offBonus = bus.on("bonus", () => { const c = E()[4]; for (let i = 0; i < 26; i++) fxGlow.emit({ x: c.x, y: 1 + Math.random() * 1.5, z: c.z, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 5, life: 1.1, s0: 0.34, s1: 0.05, grav: 4, r: 1, g: 0.85, b: 0.3 }); setPose(c, "cheer", 1.4); });
    return () => { offPerform(); offRepair(); offShelter(); offAcc(); offRes(); offReset(); offBonus(); };
  }, [ctrl]);

  // nouveau jour : tout le monde ressort et reprend son poste
  useEffect(() => { let prev = ctrl.store.get().phase; return ctrl.store.subscribe(() => {
    const s = ctrl.store.get(); const was = prev; prev = s.phase;
    if (s.phase === "plan" && was !== "plan" && was !== "intro" && was !== "briefing") {
      rt.tod = 0.1; rt.todSpeed = 0;
      rt.ents.slice(0, 4).forEach((e) => { if (e.alive) { e.busy = false; e.hidden = false; goTo(e, e.home[0], e.home[1]); setPose(e, "idle"); } });
    }
  }); }, [ctrl]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(0.05, dtRaw); rt.time += dt;
    for (let i = sched.length - 1; i >= 0; i--) if (rt.time >= sched[i].t) { const f = sched[i].fn; sched.splice(i, 1); f(); }
    const E = rt.ents, phase = ctrl.store.get().phase;
    for (const e of E) {
      // errance tranquille des astronautes libres
      if (e.kind === "crew" && e.alive && !e.busy && !e.target) { e.wander -= dt; if (e.wander <= 0) { e.wander = 3 + Math.random() * 6; const p = near(e.home, 0.6 + Math.random() * 2.2); goTo(e, p[0], p[1]); e.run = false; } }
      stepEnt(e, dt, E);
      if (e.speed > 2.2 && e.alive && !e.hidden && Math.random() < dt * 9) fxSoft.emit({ x: e.x - e.vx * 0.05, y: e.y + 0.08, z: e.z - e.vz * 0.05, vx: -e.vx * 0.1, vy: 0.5, vz: -e.vz * 0.1, life: 0.9, s0: 0.25, s1: 0.8, a: 0.4, r: 0.78, g: 0.5, b: 0.32, drag: 1.5 });
    }
    // intervention : le commandant atteint le lieu de l'accident
    const hz = rt.hazard; const c = E[4];
    if (hz && hz.pos && hz.bonus && !hz.reached && phase === "accident" && Math.hypot(c.x - hz.pos[0], c.z - hz.pos[1]) < 2.3) { hz.reached = true; ctrl.reachHazard(); }
  });

  return (
    <>
      {ents.slice(0, 4).map((e, i) => <Astronaut key={i} ent={e} skin={CREW[i].skin} pack={CREW[i].pack} accent="#c9d2e4" onPick={() => focusCrew(ctrl, i)} />)}
      <Astronaut ent={ents[4]} skin={suit.skin} pack={accent} accent={accent} suit={suit.suit} visor={suit.visor} commander />
    </>
  );
}
