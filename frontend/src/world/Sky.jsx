import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rt } from "./sim.js";

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFrag = `
varying vec3 vDir; uniform vec3 uTop, uHor, uSun, uSunCol; uniform float uStars, uTime, uFlare, uDay;
float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
void main(){
  vec3 d = normalize(vDir); float h = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHor, uTop, pow(h, 0.55));
  float sd = max(dot(d, uSun), 0.0);
  col += uSunCol * (pow(sd, 900.0) * 4.0 + pow(sd, 14.0) * 0.28 + pow(sd, 3.0) * 0.07);
  col += vec3(0.25, 0.45, 0.9) * pow(sd, 55.0) * 0.55 * uDay;           // halo bleu du Soleil sur Mars
  vec3 sp = floor(d * 200.0); float s = h3(sp);
  col += vec3(1.0) * step(0.9982, s) * uStars * smoothstep(0.03, 0.35, d.y) * (0.55 + 0.45 * sin(uTime * 2.0 + s * 60.0));
  col += vec3(1.0, 0.92, 0.6) * uFlare * 0.55 * (0.4 + h);
  gl_FragColor = vec4(col, 1.0);
}`;
const auroraFrag = `
varying vec3 vDir; varying vec2 vUv; uniform float uA, uTime;
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x), mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x), f.y); }
void main(){
  float x = vUv.x * 40.0; float w = n(vec2(x * 0.5, uTime * 0.35)) ; float streak = pow(n(vec2(x * 3.0, uTime * 0.8)), 2.0);
  float band = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.35, vUv.y);
  vec3 c = mix(vec3(0.2, 1.0, 0.55), vec3(0.85, 0.25, 0.9), smoothstep(0.35, 1.0, vUv.y + w * 0.3));
  gl_FragColor = vec4(c, band * (0.25 + streak * 0.9) * w * uA * 0.9);
}`;
const auroraVert = `varying vec3 vDir; varying vec2 vUv; void main(){ vUv = uv; vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const C = (r, g, b) => new THREE.Color(r, g, b);
const dayTop = C(0.52, 0.30, 0.20), dayHor = C(0.86, 0.58, 0.38), duskHor = C(0.95, 0.42, 0.22), duskTop = C(0.30, 0.17, 0.2);
const nightTop = C(0.015, 0.02, 0.05), nightHor = C(0.07, 0.05, 0.09), dustTop = C(0.55, 0.32, 0.18), dustHor = C(0.72, 0.42, 0.22);
const tmp = new THREE.Color(), tmp2 = new THREE.Color();

export function SkyAndLight({ quality }) {
  const skyMat = useRef(), skyMesh = useRef(), sun = useRef(), hemi = useRef(), amb = useRef(), auroraMat = useRef(), phobos = useRef();
  const uniforms = useMemo(() => ({ uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uStars: { value: 0 }, uTime: { value: 0 }, uFlare: { value: 0 }, uDay: { value: 1 } }), []);
  const aU = useMemo(() => ({ uA: { value: 0 }, uTime: { value: 0 } }), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const w = rt.w;
    // heure : dérive lente pendant la planification, balayage jusqu'au crépuscule pendant la résolution
    if (rt.todSpeed) { rt.tod = Math.min(0.985, rt.tod + rt.todSpeed * dt); if (rt.tod >= 0.985) rt.todSpeed = 0; }
    else if (!rt.cam.intro) rt.tod = Math.min(0.42, rt.tod + dt * 0.0035);
    const a = Math.PI * rt.tod;
    dir.set(Math.cos(a), Math.sin(a) * 0.82 + 0.03, -0.38).normalize();
    const hgt = dir.y, day = THREE.MathUtils.smoothstep(hgt, 0.0, 0.28), low = 1 - THREE.MathUtils.smoothstep(hgt, 0.04, 0.5);
    const moon = rt.env === "moon"; const dust = moon ? 0 : w.dust;
    // couleurs du ciel
    const top = tmp.copy(nightTop).lerp(dayTop, day).lerp(duskTop, low * day * 0.8).lerp(dustTop, dust * 0.9);
    const hor = tmp2.copy(nightHor).lerp(dayHor, day).lerp(duskHor, low * day * 0.9).lerp(dustHor, dust * 0.85);
    if (moon) { top.copy(nightTop); hor.copy(nightTop); }
    uniforms.uTop.value.copy(top); uniforms.uHor.value.copy(hor);
    uniforms.uSun.value.copy(dir); uniforms.uSunCol.value.setRGB(1.0, 0.85 - low * 0.3, 0.6 - low * 0.35).multiplyScalar(1 - dust * 0.75);
    uniforms.uStars.value = moon ? 1 : (1 - day) * (1 - dust) * (rt.quality === "low" ? 0.6 : 1); uniforms.uTime.value = state.clock.elapsedTime; uniforms.uFlare.value = w.flare; uniforms.uDay.value = moon ? 0 : day;
    if (skyMesh.current) skyMesh.current.position.copy(state.camera.position);
    // brouillard assorti à l'horizon
    if (state.scene.fog) { state.scene.fog.color.copy(hor); state.scene.fog.density = moon ? 0.0004 : 0.0042 + dust * 0.03 + (1 - day) * 0.0015; }
    state.scene.background = state.scene.background || new THREE.Color(); state.scene.background.copy(hor);
    // lumières
    if (sun.current) {
      const k = Math.max(0, hgt) ** 0.5 * (1 - dust * 0.55) * (1 - w.flare * 0.0);
      sun.current.intensity = 3.1 * k + w.flare * 1.2; sun.current.color.setRGB(1, 0.84 - low * 0.25, 0.7 - low * 0.35);
      sun.current.position.set(dir.x * 70, Math.max(6, dir.y * 70), dir.z * 70 + 6); sun.current.target.position.set(0, 0, 6); sun.current.target.updateMatrixWorld();
    }
    if (hemi.current) { hemi.current.intensity = 0.28 + day * 0.55 + w.flare * 0.6 - dust * 0.1; hemi.current.color.copy(top).lerp(new THREE.Color(1, 0.85, 0.7), 0.5); hemi.current.groundColor.set("#6b2f1a"); }
    if (amb.current) amb.current.intensity = 0.18 + (1 - day) * 0.22;
    state.gl.toneMappingExposure = 1.0 + w.flare * 0.35 - w.dark * 0.05;
    if (auroraMat.current) { aU.uA.value = w.aurora; aU.uTime.value = state.clock.elapsedTime; }
    if (phobos.current) { const t = state.clock.elapsedTime * 0.012 + 1.2; phobos.current.position.set(Math.cos(t) * 260, 120 + Math.sin(t * 3) * 25, -Math.sin(t) * 260).add(state.camera.position); phobos.current.visible = day > 0.2 || w.calm > 0.2; phobos.current.scale.setScalar(1 + w.calm * 0.6); }
  });
  return (
    <>
      <fogExp2 attach="fog" args={["#d8946a", 0.0042]} />
      <mesh ref={skyMesh} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[500, 32, 20]} />
        <shaderMaterial ref={skyMat} uniforms={uniforms} vertexShader={skyVert} fragmentShader={skyFrag} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 60, 0]} frustumCulled={false} renderOrder={-5}>
        <cylinderGeometry args={[200, 200, 90, 64, 1, true]} />
        <shaderMaterial ref={auroraMat} uniforms={aU} vertexShader={auroraVert} fragmentShader={auroraFrag} side={THREE.DoubleSide} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
      {rt.env === "moon" && <mesh position={[-120, 90, -260]}><sphereGeometry args={[26, 32, 20]} /><meshStandardMaterial color="#3f78d8" emissive="#1b4fa8" emissiveIntensity={0.65} fog={false} /></mesh>}
      <mesh ref={phobos} visible={rt.env !== "moon"} scale={[1.4, 1, 1.1]}><dodecahedronGeometry args={[9, 1]} /><meshStandardMaterial color="#8a8078" roughness={1} fog={false} flatShading /></mesh>
      <hemisphereLight ref={hemi} args={["#ffd9b0", "#6b2f1a", 0.7]} />
      <ambientLight ref={amb} intensity={0.2} color="#9fb4ff" />
      <directionalLight ref={sun} castShadow={quality !== "low"} shadow-mapSize={[quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024]} shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34} shadow-camera-near={1} shadow-camera-far={180} shadow-bias={-0.0004} shadow-normalBias={0.04} />
    </>
  );
}
