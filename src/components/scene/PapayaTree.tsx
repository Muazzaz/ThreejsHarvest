/* eslint-disable react-hooks/purity */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
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

/** Single papaya leaf on a petiole — connected to trunk top */
function PapayaLeaf({ index, total, trunkHeight, trunkRadius, seed }: {
  index: number;
  total: number;
  trunkHeight: number;
  trunkRadius: number;
  seed: number;
}) {
  const leafTex = getLeafTexture('#1a7030', 'rgba(80, 200, 80, 0.2)', '#2a8838', 'palmate');
  const rng = useMemo(() => seededRandom(seed + index * 17), [seed, index]);

  const angle = useMemo(() => (index / total) * Math.PI * 2 + rng() * 0.3, [index, total, rng]);
  const petioleLength = useMemo(() => 1.0 + rng() * 0.5, [rng]);
  const leafScale = useMemo(() => 0.65 + rng() * 0.3, [rng]);
  // Droop angle — lower leaves droop more, upper ones point outward/up
  const isLowerTier = useMemo(() => rng() > 0.5, [rng]);
  const droopAngle = useMemo(
    () => (isLowerTier ? 0.7 + rng() * 0.5 : 0.3 + rng() * 0.3),
    [isLowerTier, rng],
  );

  const leafRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (leafRef.current) {
      const t = clock.getElapsedTime();
      leafRef.current.rotation.z = Math.sin(t * 0.4 + index * 1.3) * 0.02;
    }
  });

  // Compute the petiole as start→end connected cylinder
  const petioleTip: Vec3 = useMemo(() => {
    const cosD = Math.cos(droopAngle);
    const sinD = Math.sin(droopAngle);
    return [
      Math.cos(angle) * sinD * petioleLength,
      trunkHeight - 0.1 + cosD * petioleLength * 0.3,
      Math.sin(angle) * sinD * petioleLength,
    ];
  }, [angle, droopAngle, petioleLength, trunkHeight]);

  const petioleStart: Vec3 = useMemo(() => [
    Math.cos(angle) * trunkRadius * 0.8,
    trunkHeight - 0.1,
    Math.sin(angle) * trunkRadius * 0.8,
  ], [angle, trunkRadius, trunkHeight]);

  const petioleTransform = useMemo(
    () => computeCylinderTransform(petioleStart, petioleTip),
    [petioleStart, petioleTip],
  );

  return (
    <group ref={leafRef}>
      {/* Petiole — properly connected cylinder from trunk to tip */}
      <mesh
        position={petioleTransform.position}
        quaternion={petioleTransform.quaternion}
      >
        <cylinderGeometry args={[0.015, 0.03, petioleTransform.length, 5]} />
        <meshStandardMaterial color="#5a8a3a" roughness={0.8} />
      </mesh>

      {/* Leaf blade lobes — attached at petiole tip */}
      <group position={petioleTip}>
        {Array.from({ length: 7 }, (_, li) => {
          const lobeRng = seededRandom(seed + index * 100 + li);
          const lobeAngle = ((li - 3) / 3) * 0.7;
          const lobeDir = angle + lobeAngle;
          const lobeTilt = droopAngle * 0.3 + lobeRng() * 0.2;
          return (
            <mesh
              key={li}
              position={[
                Math.cos(lobeDir) * 0.1,
                -0.02 * li * 0.3,
                Math.sin(lobeDir) * 0.1,
              ]}
              rotation={[lobeTilt, lobeDir + Math.PI / 2, lobeRng() * 0.15]}
              scale={leafScale * (0.75 + lobeRng() * 0.3)}
            >
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
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Leaf crown */
function PapayaLeafCrown({ trunkHeight, trunkRadius, seed }: {
  trunkHeight: number;
  trunkRadius: number;
  seed: number;
}) {
  const leafCount = useMemo(() => {
    const rng = seededRandom(seed + 300);
    return 10 + Math.floor(rng() * 5);
  }, [seed]);

  return (
    <group>
      {Array.from({ length: leafCount }, (_, i) => (
        <PapayaLeaf
          key={i}
          index={i}
          total={leafCount}
          trunkHeight={trunkHeight}
          trunkRadius={trunkRadius}
          seed={seed}
        />
      ))}
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

  const fruits = useMemo(() => {
    const rng = seededRandom(seed + 500);
    const arr: {
      pos: Vec3;
      rot: [number, number, number];
      scaleX: number;
      scaleY: number;
      ripeness: number;
    }[] = [];

    const numFruits = 4 + Math.floor(rng() * 4);
    for (let i = 0; i < numFruits; i++) {
      const angle = (i / numFruits) * Math.PI * 2 + rng() * 0.5;
      const dist = trunkRadius * 1.1 + rng() * 0.05;
      arr.push({
        pos: [
          Math.cos(angle) * dist,
          trunkHeight * 0.82 - rng() * 0.35,
          Math.sin(angle) * dist,
        ],
        rot: [rng() * 0.15, rng() * Math.PI * 2, 0],
        scaleX: 0.07 + rng() * 0.03,
        scaleY: 0.11 + rng() * 0.05,
        ripeness: rng(),
      });
    }
    return arr;
  }, [trunkHeight, trunkRadius, seed]);

  return (
    <group ref={groupRef}>
      {fruits.map((fruit, i) => {
        const r = fruit.ripeness;
        const color = new THREE.Color();
        if (r < 0.4) {
          color.lerpColors(new THREE.Color('#3a8a2a'), new THREE.Color('#8ac44a'), r * 2.5);
        } else {
          color.lerpColors(new THREE.Color('#e8a020'), new THREE.Color('#f97316'), (r - 0.4) * 1.67);
        }

        return (
          <group key={i} position={fruit.pos} rotation={fruit.rot}>
            <mesh scale={[fruit.scaleX, fruit.scaleY, fruit.scaleX]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color={color} roughness={0.4} metalness={0.01} />
            </mesh>
            {/* Short stem connecting fruit to trunk */}
            <mesh position={[0, fruit.scaleY * 0.85, 0]}>
              <cylinderGeometry args={[0.006, 0.01, 0.05, 4]} />
              <meshStandardMaterial color="#5a6a30" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
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
    const arr: { y: number; angle: number }[] = [];
    const count = 12 + Math.floor(rng() * 8);
    for (let i = 0; i < count; i++) {
      arr.push({
        y: 0.3 + rng() * (trunkHeight * 0.85),
        angle: rng() * Math.PI * 2,
      });
    }
    return arr;
  }, [trunkHeight, seed]);

  return (
    <group>
      {scars.map((scar, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(scar.angle) * trunkRadius * 1.01,
            scar.y,
            Math.sin(scar.angle) * trunkRadius * 1.01,
          ]}
          rotation={[0, -scar.angle + Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.06, 0.03]} />
          <meshStandardMaterial
            color="#7a8a6a"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
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
