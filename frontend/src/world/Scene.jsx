import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { rt, goTo, fxSoft } from "./sim.js";
import { SkyAndLight } from "./Sky.jsx";
import { Terrain } from "./Terrain.jsx";
import { Habitat, Modules } from "./Base.jsx";
import { HabitatInterior } from "./HabitatInterior.jsx";
import { Crew } from "./Crew.jsx";
import { Weather } from "./Effects.jsx";
import { CameraRig } from "./CameraRig.jsx";

/** Entrées clavier (ZQSD / WASD / flèches, Maj = courir). Le joystick tactile écrit dans rt.cmd lui aussi. */
function useKeyboard() {
  useEffect(() => {
    const down = new Set();
    const L = ["a", "q", "arrowleft"], R = ["d", "arrowright"], U = ["w", "z", "arrowup"], D = ["s", "arrowdown"];
    const any = (arr) => arr.some((k) => down.has(k));
    const upd = () => { if (!rt.joy) { rt.cmd.x = (any(R) ? 1 : 0) - (any(L) ? 1 : 0); rt.cmd.y = (any(D) ? 1 : 0) - (any(U) ? 1 : 0); } rt.cmd.run = down.has("shift"); };
    const dn = (e) => { if (e.target && /input|textarea|select/i.test(e.target.tagName)) return; const k = e.key.toLowerCase(); if ([...L, ...R, ...U, ...D, "shift"].includes(k)) { down.add(k); if (k.startsWith("arrow")) e.preventDefault(); upd(); rt.cam.intro = false; } };
    const up = (e) => { down.delete(e.key.toLowerCase()); upd(); };
    const blur = () => { down.clear(); upd(); };
    window.addEventListener("keydown", dn); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);
}

function Ripple() {
  const m = useRef(), mat = useRef();
  useFrame((s, dt) => { const r = rt.ripple; if (!r) { m.current.visible = false; return; } r.t += dt; const k = r.t / 0.9; if (k >= 1) { rt.ripple = null; return; } m.current.visible = true; m.current.position.set(r.x, r.y + 0.08, r.z); m.current.scale.setScalar(0.4 + k * 1.6); mat.current.opacity = (1 - k) * 0.9; });
  return <mesh ref={m} rotation-x={-Math.PI / 2} visible={false}><ringGeometry args={[0.7, 0.9, 32]} /><meshBasicMaterial ref={mat} color="#ffe9b0" transparent depthWrite={false} /></mesh>;
}

/** Mesure de fluidité : si l'appareil peine, on baisse la qualité (ombres, résolution) sans rien demander au joueur. */
function Governor({ onLow }) {
  const acc = useRef({ t: 0, n: 0, done: false });
  useFrame((s, dt) => { const a = acc.current; if (a.done || rt.cam.intro) return; a.t += dt; a.n++; if (a.t > 4) { a.done = true; const fps = a.n / a.t; if (fps < 32) onLow(); } });
  return null;
}

function Inner({ ctrl, onLow, quality, env }) {
  useKeyboard();
  const { gl, camera } = useThree();
  useEffect(() => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.0; gl.outputColorSpace = THREE.SRGBColorSpace; }, [gl]);
  const onGround = (p) => {
    const c = rt.ents[4]; if (!c || ctrl.store.get().phase === "intro") return;
    if (ctrl.store.get().placing) return;
    goTo(c, p.x, p.z, { run: false }); rt.ripple = { x: p.x, y: p.y, z: p.z, t: 0 }; rt.cam.intro = false; ctrl.inspect(null);
  };
  return (
    <>
      <SkyAndLight quality={quality} />
      <Terrain onGround={onGround} env={env} />
      <Habitat />
      <HabitatInterior />
      <Modules ctrl={ctrl} />
      <Crew ctrl={ctrl} />
      <Weather />
      <Ripple />
      <CameraRig />
      <Governor onLow={onLow} />
    </>
  );
}

export default function Scene({ ctrl, quality, onLow, env = "mars" }) {
  rt.env = env; rt.quality = quality === "low" ? "low" : "high";
  return (
    <Canvas shadows={quality !== "low"} dpr={quality === "low" ? 1 : [1, 1.75]} camera={{ fov: 52, near: 0.3, far: 900, position: [0, 14, 30] }} gl={{ antialias: quality !== "low", powerPreference: "high-performance" }} style={{ position: "fixed", inset: 0, touchAction: "none" }}>
      <Suspense fallback={null}><Inner ctrl={ctrl} onLow={onLow} quality={quality} env={env} /></Suspense>
    </Canvas>
  );
}
