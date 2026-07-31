/* eslint-disable react-hooks/purity */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';
import {
  seededRandom,
  getSmoothBarkTexture,
  getLeafTexture,
  computeCylinderTransform,
  type Vec3,
} from './TreeTextures';

// ─────────────────────────────────────────────────────
// Papaya Tree — tall, unbranched palm-like trunk with
// a crown of large palmate leaves radiating from the top
// and fruits clustered beneath the crown.
// ─────────────────────────────────────────────────────

/** Leaf crown with instanced lobes for performance */
function PapayaLeafCrown({ trunkHeight, trunkRadius, seed }: {
  trunkHeight: number;
  trunkRadius: number;
  seed: number;
}) {
  const leafTex = getLeafTexture('#1a7030', 'rgba(80, 200, 80, 0.2)', '#2a8838', 'palmate');
  
  const leafCount = useMemo(() => {
    const rng = seededRandom(seed + 300);
    return 10 + Math.floor(rng() * 5);
  }, [seed]);

  const { petioles, lobes } = useMemo(() => {
    const pArr: any[] = [];
    const lArr: any[] = [];
    
    for (let i = 0; i < leafCount; i++) {
      const rng = seededRandom(seed + i * 17);
      const angle = (i / leafCount) * Math.PI * 2 + rng() * 0.3;
      const petioleLength = 1.0 + rng() * 0.5;
      const leafScale = 0.65 + rng() * 0.3;
      const isLowerTier = rng() > 0.5;
      const droopAngle = isLowerTier ? 0.7 + rng() * 0.5 : 0.3 + rng() * 0.3;

      const cosD = Math.cos(droopAngle);
      const sinD = Math.sin(droopAngle);
      
      const petioleTip: Vec3 = [
        Math.cos(angle) * sinD * petioleLength,
        trunkHeight - 0.1 + cosD * petioleLength * 0.3,
        Math.sin(angle) * sinD * petioleLength,
      ];

      const petioleStart: Vec3 = [
        Math.cos(angle) * trunkRadius * 0.8,
        trunkHeight - 0.1,
        Math.sin(angle) * trunkRadius * 0.8,
      ];

      const petioleTransform = computeCylinderTransform(petioleStart, petioleTip);
      pArr.push({ ...petioleTransform, index: i });

      for (let li = 0; li < 7; li++) {
        const lobeRng = seededRandom(seed + i * 100 + li);
        const lobeAngle = ((li - 3) / 3) * 0.7;
        const lobeDir = angle + lobeAngle;
        const lobeTilt = droopAngle * 0.3 + lobeRng() * 0.2;
        
        lArr.push({
          pos: [
            petioleTip[0] + Math.cos(lobeDir) * 0.1,
            petioleTip[1] - 0.02 * li * 0.3,
            petioleTip[2] + Math.sin(lobeDir) * 0.1,
          ],
          rot: [lobeTilt, lobeDir + Math.PI / 2, lobeRng() * 0.15],
          scale: leafScale * (0.75 + lobeRng() * 0.3),
        });
      }
    }
    return { petioles: pArr, lobes: lArr };
  }, [leafCount, trunkHeight, trunkRadius, seed]);

  return (
    <group>
      {petioles.length > 0 && (
        <Instances range={petioles.length} limit={petioles.length}>
          <cylinderGeometry args={[0.015, 0.03, 1, 5]} />
          <meshStandardMaterial color="#5a8a3a" roughness={0.8} />
          {petioles.map((p, i) => (
            <Instance key={i} position={p.position} quaternion={p.quaternion} scale={[1, p.length, 1]} />
          ))}
        </Instances>
      )}
      
      {lobes.length > 0 && (
        <Instances range={lobes.length} limit={lobes.length}>
          <planeGeometry args={[0.4, 0.85]} />
          <meshStandardMaterial
            map={leafTex}
            color="#228833"
            roughness={0.5}
            metalness={0.02}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.25}
          />
          {lobes.map((lobe, i) => (
            <Instance key={i} position={lobe.pos} rotation={lobe.rot} scale={lobe.scale} />
          ))}
        </Instances>
      )}
    </group>
  );
}

/** Fruits clustered around the trunk below the leaf crown */
function PapayaFruits({ trunkHeight, trunkRadius, seed = 0 }: {
  trunkHeight: number;
  trunkRadius: number;
  seed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2 + seed) * 0.01;
    }
  });

  const { fruits, stems } = useMemo(() => {
    const rng = seededRandom(seed + 500);
    const fArr: any[] = [];
    const stArr: any[] = [];

    const numFruits = 4 + Math.floor(rng() * 4);
    for (let i = 0; i < numFruits; i++) {
      const angle = (i / numFruits) * Math.PI * 2 + rng() * 0.5;
      const dist = trunkRadius * 1.1 + rng() * 0.05;
      const scaleX = 0.07 + rng() * 0.03;
      const scaleY = 0.11 + rng() * 0.05;
      const r = rng();
      
      const color = new THREE.Color();
      if (r < 0.4) {
        color.lerpColors(new THREE.Color('#3a8a2a'), new THREE.Color('#8ac44a'), r * 2.5);
      } else {
        color.lerpColors(new THREE.Color('#e8a020'), new THREE.Color('#f97316'), (r - 0.4) * 1.67);
      }

      const p: Vec3 = [
        Math.cos(angle) * dist,
        trunkHeight * 0.82 - rng() * 0.35,
        Math.sin(angle) * dist,
      ];
      const rot: [number, number, number] = [rng() * 0.15, rng() * Math.PI * 2, 0];

      fArr.push({ pos: p, rot, scale: [scaleX, scaleY, scaleX], color });
      stArr.push({ pos: [p[0], p[1] + scaleY * 0.85, p[2]], rot });
    }
    return { fruits: fArr, stems: stArr };
  }, [trunkHeight, trunkRadius, seed]);

  return (
    <group ref={groupRef}>
      {fruits.length > 0 && (
        <Instances range={fruits.length} limit={fruits.length}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial roughness={0.4} metalness={0.01} />
          {fruits.map((f, i) => (
            <Instance key={i} position={f.pos} rotation={f.rot} scale={f.scale} color={f.color} />
          ))}
        </Instances>
      )}
      {stems.length > 0 && (
        <Instances range={stems.length} limit={stems.length}>
          <cylinderGeometry args={[0.006, 0.01, 0.05, 4]} />
          <meshStandardMaterial color="#5a6a30" roughness={0.9} />
          {stems.map((st, i) => (
            <Instance key={i} position={st.pos} rotation={st.rot} />
          ))}
        </Instances>
      )}
    </group>
  );
}

/** Leaf scar marks on trunk */
function TrunkScars({ trunkHeight, trunkRadius, seed }: {
  trunkHeight: number;
  trunkRadius: number;
  seed: number;
}) {
  const scars = useMemo(() => {
    const rng = seededRandom(seed + 800);
    const arr: { pos: Vec3; rot: [number, number, number] }[] = [];
    const count = 12 + Math.floor(rng() * 8);
    for (let i = 0; i < count; i++) {
      const y = 0.3 + rng() * (trunkHeight * 0.85);
      const angle = rng() * Math.PI * 2;
      arr.push({
        pos: [
          Math.cos(angle) * trunkRadius * 1.01,
          y,
          Math.sin(angle) * trunkRadius * 1.01,
        ],
        rot: [0, -angle + Math.PI / 2, 0],
      });
    }
    return arr;
  }, [trunkHeight, trunkRadius, seed]);

  if (scars.length === 0) return null;

  return (
    <Instances range={scars.length} limit={scars.length}>
      <planeGeometry args={[0.06, 0.03]} />
      <meshStandardMaterial color="#7a8a6a" transparent opacity={0.4} side={THREE.DoubleSide} roughness={0.95} />
      {scars.map((scar, i) => (
        <Instance key={i} position={scar.pos} rotation={scar.rot} />
      ))}
    </Instances>
  );
}

// ─────────────────────────────────────────────────────
// Main PapayaTree Component
// ─────────────────────────────────────────────────────
export interface PapayaTreeProps {
  x: number;
  z: number;
  groundY?: number;
}

export default function PapayaTree({ x, z, groundY = 0 }: PapayaTreeProps) {
  const seed = useMemo(() => Math.floor(Math.abs(x * 83 + z * 127) % 10000), [x, z]);
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const sizeVar = useMemo(() => 0.85 + rng() * 0.3, [rng]);

  const trunkHeight = 3.2 * sizeVar;
  const trunkRadius = 0.18 * sizeVar;

  const barkTex = getSmoothBarkTexture('#8a9a7a');

  // Gentle trunk sway
  const trunkRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (trunkRef.current) {
      const t = clock.getElapsedTime();
      trunkRef.current.rotation.z = Math.sin(t * 0.25 + seed * 0.1) * 0.012;
      trunkRef.current.rotation.x = Math.cos(t * 0.2 + seed * 0.15) * 0.008;
    }
  });

  return (
    <group position={[x, groundY, z]}>
      <group ref={trunkRef}>
        {/* ── Trunk — tall columnar ── */}
        <mesh castShadow receiveShadow position={[0, trunkHeight / 2, 0]}>
          <cylinderGeometry args={[trunkRadius * 0.9, trunkRadius, trunkHeight, 10, 6]} />
          <meshStandardMaterial
            map={barkTex}
            color="#7a8a6a"
            roughness={0.75}
            metalness={0.0}
          />
        </mesh>

        {/* ── Leaf scars ── */}
        <TrunkScars trunkHeight={trunkHeight} trunkRadius={trunkRadius} seed={seed} />

        {/* ── Leaf crown — petioles radiate from trunk top ── */}
        <PapayaLeafCrown trunkHeight={trunkHeight} trunkRadius={trunkRadius} seed={seed} />

        {/* ── Fruits clustered near trunk ── */}
        <PapayaFruits trunkHeight={trunkHeight} trunkRadius={trunkRadius} seed={seed} />
      </group>

      {/* ── Ground shadow ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.5 * sizeVar, 24]} />
        <meshStandardMaterial color="#0a1a0a" transparent opacity={0.15} roughness={1} />
      </mesh>
    </group>
  );
}
