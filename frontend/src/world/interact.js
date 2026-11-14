import { rt, setPose } from "./sim.js";
import { CREW } from "../game/layout.js";
import { makeT, RES } from "../ui/strings.js";

/** Le commandant va parler à un équipier : caméra rapprochée + bulle de conseil selon sa jauge. */
export function focusCrew(ctrl, i) {
  const e = rt.ents[i]; if (!e) return;
  const s = ctrl.store.get(), t = makeT(s.lang), g = s.game;
  rt.ents.forEach((x) => (x.sel = false)); e.sel = true;
  if (e.alive) {
    const v = g.resources[CREW[i].role], k = v >= 50 ? "crewTipGood" : v >= 25 ? "crewTipWarn" : "crewTipCrit";
    e.say = t(k, { name: CREW[i].name, role: t("crewRole" + i), res: t(RES[CREW[i].role].key), value: v }); e.sayT = 6;
    if (v < 25) setPose(e, "panic", 1.5); else if (v >= 50) setPose(e, "wave", 1.6);
    rt.cam.cine = { x: e.x, z: e.z, until: rt.time + 3.6, dist: 11, pol: 1.15 }; rt.cam.intro = false;
  }
  ctrl.store.set({ crewSel: i });
}
