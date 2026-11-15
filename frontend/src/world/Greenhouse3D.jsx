/**
 * Serre hydroponique visuelle (NASA Veggie / APH).
 * Affiche le dôme pressurisé + les bacs de plantes.
 * Quand une culture est lancée, un astronaute se met en pose "work" près des bacs,
 * arrose (particules) et les plantes poussent visuellement.
 * Pas de culture à l'air libre sur Mars/Lune : tout est sous cloche pressurisée.
 */
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { groundY } from "./terrain.js";
import { useCtrl, useGame } from "../game/useStore.js";
import { fxSoft } from "./sim.js";

export const GREENHOUSE_POS = [-14, 0];

const domeMat = new THREE.MeshStandardMaterial({
  color: "#4fd1c5",
  roughness: 0.2,
  metalness: 0.1,
  transparent: true,
  opacity: 0.35,
  side: THREE.DoubleSide,
});
const frameMat = new THREE.MeshStandardMaterial({ color: "#b6c2d4", roughness: 0.4, metalness: 0.3 });
const potMat = new THREE.MeshStandardMaterial({ color: "#5d4037", roughness: 0.8 });
const soilMat = new THREE.MeshStandardMaterial({ color: "#4e342e", roughness: 1 });
const stemMat = new THREE.MeshStandardMaterial({ color: "#6b8e23", roughness: 0.6 });
const leafMat = new THREE.MeshStandardMaterial({ color: "#7bd389", roughness: 0.5 });

export function Greenhouse3D({ ctrl }) {
  const c = useCtrl();
  const group = useRef();
  const pots = useRef([]);
  const progress = useRef(35);
  const growing = useRef(false);

  // 4 bacs de plantes disposés en cercle dans le dôme
  const potPositions = useMemo(() => [
    [-1.6, 0, -1.6],
    [1.6, 0, -1.6],
    [-1.6, 0, 1.6],
    [1.6, 0, 1.6],
  ], []);

  // Écoute les événements du bus de contrôle de façon sécurisée
  useEffect(() => {
    const bus = c?.bus;
    if (!bus) return;

    const onStart = () => {
      growing.current = true;
      progress.current = 10;
    };
    const onGrow = () => {
      growing.current = true;
      progress.current = Math.min(100, progress.current + 35);
    };
    const onHarvest = () => {
      growing.current = false;
      progress.current = 20;
    };

    bus.on?.("greenhouseStart", onStart);
    bus.on?.("greenhouseGrow", onGrow);
    bus.on?.("greenhouseHarvest", onHarvest);

    return () => {
      if (bus.off) {
        bus.off("greenhouseStart", onStart);
        bus.off("greenhouseGrow", onGrow);
        bus.off("greenhouseHarvest", onHarvest);
      }
    };
  }, [c]);

  // Animation : rotation décorative, arrosage et croissance
  useFrame((s, dt) => {
    const g = group.current;
    if (!g) return;

    // Légère pulsation des lampes et croissance des plantes
    const grow = Math.sin(s.clock.elapsedTime * 2) * 0.02;
    for (const pot of pots.current) {
      if (!pot) continue;
      const scale = 0.6 + (progress.current / 100) * 0.8;
      pot.scale.setScalar(scale + grow);
      pot.position.y = 0.5 + (progress.current / 100) * 0.4;
    }

    // Particules d'arrosage si en croissance
    if (growing.current && s.clock.elapsedTime % 0.5 < dt) {
      for (const p of potPositions) {
        fxSoft.emit?.({
          x: GREENHOUSE_POS[0] + p[0],
          y: GREENHOUSE_POS[1] + 1.6,
          z: p[2],
          vx: 0,
          vy: -2,
          vz: 0,
          life: 0.5,
          s0: 0.06,
          s1: 0,
          grav: 8,
          drag: 0.6,
          r: 0.4,
          g: 0.7,
          b: 1,
        });
      }
    }
  });

  const posY = groundY(GREENHOUSE_POS[0], GREENHOUSE_POS[1]);

  return (
    <group ref={group} position={[GREENHOUSE_POS[0], posY, GREENHOUSE_POS[1]]}>
      {/* Dôme serre pressurisé translucide */}
      <mesh geometry={new THREE.SphereGeometry(4, 32, 16)} material={domeMat} castShadow receiveShadow position-y={2} />
      <mesh geometry={new THREE.RingGeometry(3.8, 4.2, 32)} material={frameMat} rotation-x={-Math.PI / 2} position-y={0.02} castShadow />
      <mesh geometry={new THREE.RingGeometry(3.8, 4.2, 32)} material={frameMat} rotation-x={Math.PI / 2} position-y={4} castShadow />

      {/* Éclairage horticole LED NASA Veggie (rouge + bleu) */}
      <pointLight color="#ff2a6d" intensity={2} distance={8} position-y={1.8} />
      <pointLight color="#2a6dff" intensity={2} distance={8} position-y={1.8} />

      {/* 4 bacs de culture hydroponique */}
      {potPositions.map((p, i) => (
        <group key={i} position={[p[0], 0, p[2]]}>
          <mesh geometry={new THREE.CylinderGeometry(0.7, 0.6, 0.35, 16)} material={potMat} position-y={0.18} castShadow />
          <mesh geometry={new THREE.CylinderGeometry(0.62, 0.55, 0.12, 16)} material={soilMat} position-y={0.42} castShadow />
          <group ref={(ref) => { pots.current[i] = ref; }} position-y={0.5}>
            <mesh geometry={new THREE.CylinderGeometry(0.05, 0.4, 8)} material={stemMat} position-y={0.2} castShadow />
            <mesh geometry={new THREE.SphereGeometry(0.18, 12, 8)} material={leafMat} position={[0, 0.38, 0]} castShadow />
            <mesh geometry={new THREE.SphereGeometry(0.15, 10, 6)} material={leafMat} position={[-0.14, 0.46, 0]} castShadow />
            <mesh geometry={new THREE.SphereGeometry(0.15, 10, 6)} material={leafMat} position={[0.14, 0.46, 0]} castShadow />
          </group>
        </group>
      ))}
    </group>
  );
}
