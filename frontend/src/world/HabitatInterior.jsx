/**
 * Géométrie intérieure 3D de l’habitat — visible uniquement en mode abri (rt.shelter).
 * Liée à l’état mission via rt.w (alert, dark) et les jauges passées en props optionnelles.
 * Léger : primitives Three.js, peu de lumières, pas de textures lourdes.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rt } from "./sim.js";

const WALL = "#c8ceda";
const FLOOR = "#3d4556";
const ACCENT = "#4fd1c5";
const ALERT = "#ff5c5c";
const PANEL = "#2a3142";
const METAL = "#8b95a8";

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.75,
    metalness: opts.metalness ?? 0.15,
    emissive: opts.emissive || "#000000",
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    side: opts.side || THREE.FrontSide,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
  });
}

/** Panneau mural avec voyant d’état. */
function StatusPanel({ position, rotation = [0, 0, 0], label = "SYS", color = ACCENT, alert = false }) {
  const led = useRef();
  const ledMat = useMemo(
    () => mat(color, { emissive: color, emissiveIntensity: 1.2, roughness: 0.3 }),
    [color]
  );
  useFrame((s) => {
    if (!led.current) return;
    const t = s.clock.elapsedTime;
    const pulse = alert || rt.w.alert > 0.3 ? (Math.sin(t * 8) > 0 ? 2.2 : 0.15) : 0.9 + Math.sin(t * 2) * 0.2;
    ledMat.emissiveIntensity = pulse * (1 - rt.w.dark * 0.7);
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[1.4, 0.9, 0.08]} />
        <meshStandardMaterial color={PANEL} roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh ref={led} position={[0.45, 0.22, 0.06]} material={ledMat}>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
      </mesh>
      {/* faux écran */}
      <mesh position={[-0.15, 0.05, 0.05]}>
        <boxGeometry args={[0.7, 0.45, 0.03]} />
        <meshStandardMaterial color="#0a1628" emissive="#1a3a5c" emissiveIntensity={0.6 * (1 - rt.w.dark)} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Râtelier batteries / O₂ */
function Rack({ position, rotation = [0, 0, 0], kind = "power" }) {
  const col = kind === "o2" ? "#5ad6ff" : kind === "food" ? "#7bdc6a" : "#ffd24a";
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.9, 1.6, 0.55]} />
        <meshStandardMaterial color={METAL} roughness={0.45} metalness={0.55} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -0.5 + i * 0.45, 0.3]}>
          <boxGeometry args={[0.7, 0.28, 0.12]} />
          <meshStandardMaterial color={PANEL} emissive={col} emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Couchettes simples le long du mur */
function Bunks({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {[0, 1].map((i) => (
        <group key={i} position={[0, i * 0.95, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[1.9, 0.12, 0.85]} />
            <meshStandardMaterial color="#5a6a7e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[2.0, 0.08, 0.95]} />
            <meshStandardMaterial color={METAL} roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[-1.05, 0.9, 0]}>
        <boxGeometry args={[0.1, 1.9, 0.9]} />
        <meshStandardMaterial color={METAL} roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Intérieur complet : cylindre/dôme inversé, sas, zone de vie, systèmes.
 * Monté sous l’habitat extérieur (même origine), visible seulement si rt.shelter.
 */
export function HabitatInterior() {
  const group = useRef();
  const alertMat = useMemo(() => mat(ALERT, { emissive: ALERT, emissiveIntensity: 1.5 }), []);
  const floorMat = useMemo(() => mat(FLOOR, { roughness: 0.9, metalness: 0.05 }), []);
  const wallMat = useMemo(() => mat(WALL, { roughness: 0.7, side: THREE.BackSide }), []);
  const ceilMat = useMemo(() => mat("#dfe6f0", { roughness: 0.65, side: THREE.BackSide }), []);
  const ambient = useRef();

  useFrame((s) => {
    const on = !!rt.shelter;
    if (group.current) group.current.visible = on;
    if (!on) return;
    const t = s.clock.elapsedTime;
    const power = Math.max(0.15, 1 - rt.w.dark * 0.85);
    if (ambient.current) ambient.current.intensity = 0.55 * power;
    alertMat.emissiveIntensity = rt.w.alert > 0.2 ? (Math.sin(t * 7) > 0 ? 2.5 : 0.2) : 0.3;
  });

  // Dimensions alignées sur l’habitat extérieur (sphère ~4.5 m de rayon)
  const R = 4.2;
  const H = 3.2;

  return (
    <group ref={group} visible={false} position={[0, 0.2, 0]}>
      {/* Sol */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow material={floorMat}>
        <circleGeometry args={[R - 0.15, 48]} />
      </mesh>
      {/* Anneau de sol antidérapant */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[R - 1.2, R - 0.3, 48]} />
        <meshStandardMaterial color="#2c3344" roughness={0.95} />
      </mesh>

      {/* Parois cylindriques (normals vers l’intérieur) */}
      <mesh material={wallMat} position={[0, H / 2, 0]}>
        <cylinderGeometry args={[R, R, H, 40, 1, true]} />
      </mesh>
      {/* Dôme plafond */}
      <mesh material={ceilMat} position={[0, H * 0.55, 0]}>
        <sphereGeometry args={[R, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
      </mesh>

      {/* Sas d’entrée (vers +Z, aligné AIRLOCK extérieur) */}
      <group position={[0, 0, R - 0.9]}>
        <mesh position={[0, 1.1, 0.4]}>
          <boxGeometry args={[2.0, 2.2, 1.6]} />
          <meshStandardMaterial color="#b0b8c8" roughness={0.65} metalness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Porte intérieure */}
        <mesh position={[0, 1.0, -0.15]}>
          <boxGeometry args={[1.1, 1.85, 0.08]} />
          <meshStandardMaterial color="#ffd9a0" emissive="#ffb050" emissiveIntensity={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.35, 0.2]} material={alertMat}>
          <boxGeometry args={[0.35, 0.12, 0.12]} />
        </mesh>
      </group>

      {/* Zone de vie — couchettes ouest */}
      <Bunks position={[-2.4, 0.15, -0.5]} rotation={[0, Math.PI / 2, 0]} />

      {/* Systèmes */}
      <Rack position={[2.5, 0.9, -1.8]} kind="power" />
      <Rack position={[2.5, 0.9, 0.6]} kind="o2" />
      <Rack position={[-2.5, 0.9, 1.6]} kind="food" />

      {/* Panneaux de contrôle */}
      <StatusPanel position={[0.2, 1.5, -R + 0.2]} rotation={[0, 0, 0]} color={ACCENT} />
      <StatusPanel position={[R - 0.25, 1.5, 0.3]} rotation={[0, -Math.PI / 2, 0]} color="#5ad6ff" alert />
      <StatusPanel position={[-R + 0.25, 1.5, -0.8]} rotation={[0, Math.PI / 2, 0]} color="#b58cff" />

      {/* Table centrale / console mission */}
      <mesh position={[0, 0.55, 0.3]} castShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.7, 20]} />
        <meshStandardMaterial color={METAL} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.95, 0.3]}>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 20]} />
        <meshStandardMaterial color="#0d1a2c" emissive="#1e4a6e" emissiveIntensity={0.7} roughness={0.25} />
      </mesh>

      {/* Lumières d’alerte au plafond */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, H - 0.35, -1]} material={alertMat}>
          <boxGeometry args={[0.4, 0.1, 0.15]} />
        </mesh>
      ))}

      {/* Éclairage intérieur doux */}
      <pointLight ref={ambient} position={[0, 2.4, 0]} color="#e8f0ff" intensity={0.55} distance={12} decay={2} />
      <pointLight position={[0, 1.8, 2.5]} color="#ffd9a8" intensity={0.35} distance={8} decay={2} />
      <hemisphereLight args={["#c8d8f0", "#2a3038", 0.35]} />
    </group>
  );
}
