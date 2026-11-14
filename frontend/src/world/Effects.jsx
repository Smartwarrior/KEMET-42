import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { rt, fxSoft, fxGlow } from "./sim.js";
import { groundY } from "./terrain.js";

const vert = `attribute float aSize; attribute vec4 aCol; varying vec4 vCol; uniform float uScale;
void main(){ vCol = aCol; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = max(0.0, aSize * uScale / -mv.z); gl_Position = projectionMatrix * mv; }`;
const frag = `varying vec4 vCol; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vCol.a; if (a < 0.01) discard; gl_FragColor = vec4(vCol.rgb, a); }`;

function Points({ pool, additive }) {
  const mat = useRef(), geo = useRef();
  const g = useMemo(() => { const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(pool.pos, 3).setUsage(THREE.DynamicDrawUsage)); gg.setAttribute("aSize", new THREE.BufferAttribute(pool.size, 1).setUsage(THREE.DynamicDrawUsage)); gg.setAttribute("aCol", new THREE.BufferAttribute(pool.col, 4).setUsage(THREE.DynamicDrawUsage)); gg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4); return gg; }, [pool]);
  const uniforms = useMemo(() => ({ uScale: { value: 600 } }), []);
  const { size, camera } = useThree();
  useFrame((s, dt) => {
    pool.step(Math.min(0.05, dt)); g.attributes.position.needsUpdate = true; g.attributes.aSize.needsUpdate = true; g.attributes.aCol.needsUpdate = true;
    uniforms.uScale.value = (size.height * s.gl.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  });
  return <points geometry={g} frustumCulled={false} renderOrder={additive ? 8 : 7}><shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} transparent depthWrite={false} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} /></points>;
}

/** Météo + accidents : fait évoluer rt.w vers rt.wT et émet les particules du moment. */
export function Weather() {
  const acc = useRef({ wind: 0, leak: 0, spark: 0, snow: 0 });
  useFrame((s, dtRaw) => {
    const dt = Math.min(0.05, dtRaw), w = rt.w, T = rt.wT, a = acc.current, f = rt.cam;
    const lerp = (k, r) => { w[k] += (T[k] - w[k]) * (1 - Math.exp(-dt * r)); };
    lerp("dust", 1.4); lerp("dark", 4); lerp("alert", 5); lerp("blight", 0.5); lerp("static", 6); lerp("aurora", 0.7); lerp("calm", 1);
    w.flare *= Math.exp(-dt * 0.7); w.shake *= Math.exp(-dt * 1.6);
    const px = f.fx, pz = f.fz;
    // vent de poussière
    if (w.dust > 0.04) { a.wind += dt * (rt.quality === "low" ? 60 : 130) * w.dust; while (a.wind > 1) { a.wind--; const x = px - 30 + Math.random() * 12, z = pz + (Math.random() - 0.5) * 60; fxSoft.emit({ x, y: groundY(x, z) + Math.random() * 7, z, vx: 11 + Math.random() * 7, vy: 0.4, vz: 2 + Math.random() * 3, life: 3.6, s0: 1.6, s1: 3.6, a: 0.4 * w.dust, r: 0.82, g: 0.5, b: 0.3, drag: 0.05 }); } }
    const h = rt.hazard;
    if (h?.pos) {
      const [hx, hz] = h.pos, y = groundY(hx, hz);
      if (h.id === "oxygen_leak") { a.leak += dt * 90; while (a.leak > 1) { a.leak--; const an = Math.random() * 6.283; fxSoft.emit({ x: hx, y: y + 1.2, z: hz, vx: Math.cos(an) * 4 * Math.random(), vy: 5 + Math.random() * 5, vz: Math.sin(an) * 4 * Math.random(), life: 1.1, s0: 0.3, s1: 1.6, a: 0.7, r: 0.92, g: 0.97, b: 1, grav: 1, drag: 0.4 }); } }
      if (h.id === "power_failure" || h.id === "comm_blackout") { a.spark += dt * 26; while (a.spark > 1) { a.spark--; const [sx, sz] = h.id === "power_failure" ? [hx, hz] : [hx, hz]; fxGlow.emit({ x: sx + (Math.random() - 0.5), y: y + 1 + Math.random() * 2, z: sz, vx: (Math.random() - 0.5) * 7, vy: 2 + Math.random() * 5, vz: (Math.random() - 0.5) * 7, life: 0.6, s0: 0.3, s1: 0.03, grav: 14, drag: 0.2, r: 1, g: 0.7, b: 0.3 }); } }
      if (h.id === "food_shortage" && Math.random() < dt * 10) fxSoft.emit({ x: -13 + (Math.random() - 0.5) * 4, y: 1.5, z: 2 + (Math.random() - 0.5) * 4, vx: 0.4, vy: 0.8, vz: 0, life: 2, s0: 0.3, s1: 1, a: 0.3, r: 0.5, g: 0.38, b: 0.18 });
    }
    // éruption : pluie de particules dorées sur toute la scène
    if (w.aurora > 0.3) { a.snow += dt * 40; while (a.snow > 1) { a.snow--; fxGlow.emit({ x: px + (Math.random() - 0.5) * 50, y: 18 + Math.random() * 6, z: pz + (Math.random() - 0.5) * 50, vx: 0, vy: -4, vz: 0, life: 3.5, s0: 0.22, s1: 0.1, r: 1, g: 0.9, b: 0.5, drag: 0.1, a: 0.8 }); } }
    // les panneaux solaires étincellent quand le soleil brille
    if (h?.id === "calm_sol" && Math.random() < dt * 4) fxGlow.emit({ x: px + (Math.random() - 0.5) * 30, y: 1 + Math.random() * 4, z: pz + (Math.random() - 0.5) * 30, vx: 0, vy: 0.5, vz: 0, life: 2, s0: 0.15, s1: 0.02, r: 1, g: 0.95, b: 0.7 });
  });
  return (<><Points pool={fxSoft} /><Points pool={fxGlow} additive /></>);
}
