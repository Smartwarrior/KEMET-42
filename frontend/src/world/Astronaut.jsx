import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rt } from "./sim.js";
import { gravity, floatParams } from "../kemet/space.js";

const white = new THREE.MeshStandardMaterial({ color: "#f1f3f8", roughness: 0.55, metalness: 0.05 });
const grey = new THREE.MeshStandardMaterial({ color: "#8b93a3", roughness: 0.6, metalness: 0.2 });
const dark = new THREE.MeshStandardMaterial({ color: "#1b2030", roughness: 0.7 });
const visorMat = new THREE.MeshPhysicalMaterial({ color: "#2a1d0a", roughness: 0.06, metalness: 0.9, transparent: true, opacity: 0.38, clearcoat: 1 });
const eyeMat = new THREE.MeshBasicMaterial({ color: "#10131c" });
const geo = {
  torso: new THREE.CapsuleGeometry(0.3, 0.42, 6, 14), pack: new THREE.BoxGeometry(0.52, 0.66, 0.26),
  helmet: new THREE.SphereGeometry(0.36, 24, 18), visor: new THREE.SphereGeometry(0.3, 20, 14), face: new THREE.SphereGeometry(0.24, 16, 12),
  eye: new THREE.SphereGeometry(0.035, 8, 6), arm: new THREE.CapsuleGeometry(0.095, 0.38, 4, 8), leg: new THREE.CapsuleGeometry(0.12, 0.42, 4, 8),
  glove: new THREE.SphereGeometry(0.115, 10, 8), boot: new THREE.BoxGeometry(0.22, 0.14, 0.32), panel: new THREE.BoxGeometry(0.3, 0.2, 0.06),
  ring: new THREE.RingGeometry(0.62, 0.78, 40), lamp: new THREE.BoxGeometry(0.14, 0.06, 0.08),
};

export function Astronaut({ ent, skin, pack, accent, suit = "#f1f3f8", visor = "#2a1d0a", commander = false, selected = false, onPick }) {
  const root = useRef(), body = useRef(), armL = useRef(), armR = useRef(), legL = useRef(), legR = useRef(), ring = useRef(), eyes = useRef(), head = useRef();
  const suitM = useMemo(() => new THREE.MeshStandardMaterial({ color: suit, roughness: 0.55, metalness: 0.05 }), [suit]);
  const visorM = useMemo(() => { const m = visorMat.clone(); m.color.set(visor); return m; }, [visor]);
  const mats = useMemo(() => ({ pack: new THREE.MeshStandardMaterial({ color: pack, roughness: 0.5, emissive: pack, emissiveIntensity: 0.08 }), accent: new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4, emissive: accent, emissiveIntensity: 0.25 }), skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.8 }), ring: new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }) }), [skin, pack, accent]);

  useFrame((s, dt) => {
    const e = ent, g = root.current; if (!g) return;
    g.visible = !e.hidden && e.fade > 0.02;
    g.position.set(e.x, e.y, e.z); g.rotation.y = e.yaw;
    const t = s.clock.elapsedTime, sp = Math.min(1, e.speed / 3.2), sw = Math.sin(e.phase) * 0.85 * Math.min(1, sp * 1.2);
    let aL = -sw * 0.9, aR = sw * 0.9, lL = sw, lR = -sw, bob = Math.abs(Math.sin(e.phase)) * 0.07 * sp, lean = sp * 0.08 * (e.run ? 2 : 1), jump = 0, roll = 0, eyeS = 1, sink = 0, headTurn = 0;
    const pose = e.alive ? e.pose : "dead";
    if (pose === "idle" && sp < 0.05) { aL = Math.sin(t * 1.6 + e.idx) * 0.05; aR = -aL; lL = lR = 0; bob = Math.sin(t * 2 + e.idx) * 0.012; headTurn = Math.sin(t * 0.5 + e.idx * 2) * 0.5; }
    else if (pose === "work") { aL = -1.05 + Math.sin(t * 13) * 0.55; aR = -1.05 - Math.sin(t * 13) * 0.55; lL = lR = 0; lean = 0.28; bob = 0; }
    else if (pose === "panic") { aL = -2.7 + Math.sin(t * 22) * 0.3; aR = -2.7 - Math.sin(t * 22) * 0.3; roll = Math.sin(t * 28) * 0.08; eyeS = 1.5; if (sp < 0.2) { lL = Math.sin(t * 16) * 0.5; lR = -lL; bob = Math.abs(Math.sin(t * 16)) * 0.06; } }
    else if (pose === "cheer") { jump = Math.abs(Math.sin(t * 6 + e.idx)) * 0.5; aL = aR = -2.9; lL = lR = 0; }
    else if (pose === "wave") { aL = 0.05; aR = -2.6 + Math.sin(t * 7) * 0.45; lL = lR = 0; }
    else if (pose === "crouch") { aL = aR = -0.4; lL = lR = 0.9; sink = 0.22; lean = 0.35; }
    else if (pose === "dead") { aL = 0.4; aR = -0.3; lL = lR = 0; }
    legL.current.rotation.x = lL; legR.current.rotation.x = lR; armL.current.rotation.x = aL; armR.current.rotation.x = aR;
    if (pose !== "dead") { const fp = floatParams(gravity.frac); bob = bob * fp.bobScale + fp.lift * (0.65 + 0.35 * Math.sin(t * 1.3 + e.idx)); }
    body.current.rotation.x = lean; body.current.rotation.z = roll; body.current.position.y = 0.98 + bob + jump - sink;
    head.current.rotation.y = headTurn;
    eyes.current.scale.setScalar(eyeS);
    if (pose === "dead") { g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -Math.PI / 2 * 0.96, Math.min(1, dt * 3)); g.position.y = e.y + 0.28; g.scale.setScalar(1); }
    else { g.rotation.x = 0; g.scale.setScalar(commander ? 1.08 : 1); }
    mats.ring.opacity = 0.35 + Math.sin(t * 3) * 0.15 + (selected ? 0.4 : 0);
    ring.current.visible = commander || e.sel; ring.current.rotation.z = t * 0.6;
    if (!e.alive) for (const m of [white, grey]) m.opacity = 1;
  });

  return (
    <group ref={root} onClick={onPick ? (e) => { if (e.delta > 6) return; e.stopPropagation(); onPick(); } : undefined} onPointerOver={onPick ? () => (document.body.style.cursor = "pointer") : undefined} onPointerOut={onPick ? () => (document.body.style.cursor = "") : undefined}>
      <mesh ref={ring} geometry={geo.ring} material={mats.ring} rotation-x={-Math.PI / 2} position-y={0.05} renderOrder={5} />
      <group ref={body} position-y={0.98}>
        <mesh geometry={geo.torso} material={suitM} castShadow position-y={0.0} />
        <mesh geometry={geo.panel} material={mats.accent} position={[0, 0.08, 0.3]} />
        <mesh geometry={geo.pack} material={mats.pack} position={[0, 0.03, -0.3]} castShadow />
        <mesh geometry={geo.lamp} material={mats.accent} position={[0, 0.5, -0.3]} />
        <group ref={head} position-y={0.62}>
          <mesh geometry={geo.helmet} material={suitM} castShadow />
          <mesh geometry={geo.face} material={mats.skin} position={[0, 0, 0.06]} />
          <group ref={eyes} position={[0, 0.03, 0.27]}>
            <mesh geometry={geo.eye} material={eyeMat} position={[-0.075, 0, 0]} /><mesh geometry={geo.eye} material={eyeMat} position={[0.075, 0, 0]} />
          </group>
          <mesh geometry={geo.visor} material={visorM} position={[0, 0.0, 0.1]} scale={[1.02, 0.95, 1]} />
          {commander && <mesh geometry={geo.lamp} material={mats.accent} position={[0, 0.37, 0.05]} scale={[2.4, 1.4, 1.6]} />}
        </group>
        <group ref={armL} position={[-0.38, 0.2, 0]}><mesh geometry={geo.arm} material={suitM} position-y={-0.26} castShadow /><mesh geometry={geo.glove} material={grey} position-y={-0.54} /></group>
        <group ref={armR} position={[0.38, 0.2, 0]}><mesh geometry={geo.arm} material={suitM} position-y={-0.26} castShadow /><mesh geometry={geo.glove} material={grey} position-y={-0.54} /></group>
      </group>
      <group ref={legL} position={[-0.16, 0.62, 0]}><mesh geometry={geo.leg} material={suitM} position-y={-0.3} castShadow /><mesh geometry={geo.boot} material={dark} position={[0, -0.58, 0.05]} /></group>
      <group ref={legR} position={[0.16, 0.62, 0]}><mesh geometry={geo.leg} material={suitM} position-y={-0.3} castShadow /><mesh geometry={geo.boot} material={dark} position={[0, -0.58, 0.05]} /></group>
    </group>
  );
}
