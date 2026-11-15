import { useMemo } from "react";
import * as THREE from "three";
import { groundY, colorAt } from "./terrain.js";
import { rt, goTo } from "./sim.js";

export function Terrain({ onGround, env }) {
  const geo = useMemo(() => {
    const seg = rt.quality === "low" ? 110 : 160;
    const g = new THREE.PlaneGeometry(260, 260, seg, seg); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), c = [0, 0, 0];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = groundY(x, z); p.setY(i, y); colorAt(x, z, y, c, env); col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }, [env]);
  const rocks = useMemo(() => {
    const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const arr = []; let tries = 0;
    while (arr.length < 170 && tries++ < 2000) {
      const a = rnd() * 6.283, r = 28 + rnd() ** 1.4 * 75, x = Math.cos(a) * r, z = Math.sin(a) * r;
      arr.push({ x, z, y: groundY(x, z), s: 0.25 + rnd() ** 2.5 * 2.4, ry: rnd() * 6, sq: 0.5 + rnd() * 0.6, tone: 0.55 + rnd() * 0.45 });
    }
    return arr;
  }, []);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), rocks.length);
    const o = new THREE.Object3D(), col = new THREE.Color();
    rocks.forEach((r, i) => { o.position.set(r.x, r.y + r.s * 0.25, r.z); o.rotation.set(r.ry, r.ry * 2, 0); o.scale.set(r.s, r.s * r.sq, r.s * 1.1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, env === "moon" ? col.setRGB(0.5 * r.tone, 0.5 * r.tone, 0.49 * r.tone) : col.setRGB(0.42 * r.tone, 0.2 * r.tone, 0.13 * r.tone)); });
    m.castShadow = true; m.receiveShadow = true; return m;
  }, [rocks, env]);
  mesh.material.color.set(env === "moon" ? "#9a9a9a" : "#ffffff");
  return (
    <>
      <mesh geometry={geo} receiveShadow onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); onGround(e.point); }}
        onPointerMove={(e) => { if (rt.placing) return; }}>
        <meshStandardMaterial vertexColors roughness={1} flatShading />
      </mesh>
      <primitive object={mesh} />
    </>
  );
}
