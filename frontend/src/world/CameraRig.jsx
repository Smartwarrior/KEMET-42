import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { rt } from "./sim.js";
import { groundY } from "./terrain.js";

/** Caméra orbitale « jeu vidéo » : glisser = tourner, molette/pincer = zoom, suit le commandant, plans cinématiques. */
export function CameraRig() {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement, ptrs = new Map(); let pinch = 0;
    const down = (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } rt.cam.intro = false; };
    const move = (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; const c = rt.cam;
      if (ptrs.size === 1) { if (Math.hypot(p.x - p.sx, p.y - p.sy) > 4) { c.az -= dx * 0.0055; c.pol = Math.min(1.42, Math.max(0.3, c.pol - dy * 0.0045)); } }
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); c.dist = Math.min(60, Math.max(9, c.dist * (pinch / Math.max(30, d)))); pinch = d; }
    };
    const up = (e) => { ptrs.delete(e.pointerId); };
    const wheel = (e) => { e.preventDefault(); rt.cam.dist = Math.min(60, Math.max(9, rt.cam.dist * (1 + e.deltaY * 0.0011))); rt.cam.intro = false; };
    el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); el.addEventListener("wheel", wheel, { passive: false });
    el.style.touchAction = "none";
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); el.removeEventListener("wheel", wheel); };
  }, [gl]);

  useFrame((s, dtRaw) => {
    const dt = Math.min(0.05, dtRaw), c = rt.cam, cam = s.camera, cmd = rt.ents[4];
    let tx, ty, tz, dist = c.dist, pol = c.pol, az = c.az;
    if (rt.shelter) {
      // Mode intérieur abri : caméra dans le module, cadrage serré sur la zone de vie
      tx = 0; tz = 0.4; ty = 1.35;
      dist = Math.min(dist, 5.8); pol = Math.min(Math.max(pol, 0.85), 1.25);
      az = c.az;
    } else if (c.intro) { c.az += dt * 0.07; az = c.az; dist = 36; pol = 1.12; tx = 0; ty = 2.5; tz = 3; }
    else if (c.cine && rt.time < c.cine.until) { tx = c.cine.x; tz = c.cine.z; ty = 1.5; dist = Math.min(dist, c.cine.dist); pol = Math.min(pol, c.cine.pol); }
    else { if (c.cine) c.cine = null; if (c.follow && cmd && !cmd.hidden) { tx = cmd.x; tz = cmd.z; ty = cmd.y + 1.3; } else { tx = c.fx; tz = c.fz; ty = c.fy; } }
    const k = 1 - Math.exp(-dt * (c.cine ? 2.2 : 4.5));
    c.fx += (tx - c.fx) * k; c.fy += (ty - c.fy) * k; c.fz += (tz - c.fz) * k;
    const sp = Math.sin(pol) * dist, shake = rt.w.shake * (rt.reduced ? 0.15 : 1);
    cam.position.set(c.fx + Math.sin(az) * sp, c.fy + Math.cos(pol) * dist, c.fz + Math.cos(az) * sp);
    if (rt.shelter) {
      // garde la caméra dans le volume intérieur (~rayon 3.6 m, hauteur 0.6–2.8)
      const dx = cam.position.x, dz = cam.position.z;
      const r = Math.hypot(dx, dz);
      if (r > 3.6) { const s = 3.6 / r; cam.position.x *= s; cam.position.z *= s; }
      cam.position.y = Math.min(2.75, Math.max(0.65, cam.position.y));
    } else {
      cam.position.y = Math.max(cam.position.y, groundY(cam.position.x, cam.position.z) + 1.4);
    }
    if (shake > 0.005) { const t = s.clock.elapsedTime; cam.position.x += Math.sin(t * 43) * shake * 0.25; cam.position.y += Math.sin(t * 51 + 1) * shake * 0.22; cam.position.z += Math.cos(t * 39) * shake * 0.25; }
    cam.lookAt(c.fx, c.fy, c.fz);
    rt.project = (v) => { v.project(cam); return v; };
    rt.camObj = cam;
  });
  return null;
}
