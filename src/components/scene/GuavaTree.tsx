/* eslint-disable react-hooks/purity */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  seededRandom,
  getBarkTexture,
  getBarkNormal,
  getLeafTexture,
  generateBranchTree,
  computeCylinderTransform,
  type Vec3,
  type BranchSegment,
} from './TreeTextures';

// ─────────────────────────────────────────────────────
// Guava Tree — multi-stemmed, smooth bark, dense oval canopy
// ─────────────────────────────────────────────────────

/** Leaf cluster that sits AT a branch tip */
function GuavaLeafCluster({ position, size = 1.0 }: { position: Vec3; size?: number }) {
  const leafTex = getLeafTexture('#1a6e28', 'rgba(100, 210, 100, 0.25)', '#2d8838', 'oval');
  const leaves = useMemo(() => {
    const rng = seededRandom(
      Math.floor(position[0] * 1000 + position[1] * 100 + position[2] * 10),
    );
    const count = 6 + Math.floor(rng() * 5);
    const arr: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const tilt = rng() * 0.5 - 0.25;
      // Leaves radiate outward from this tip in a tight cluster
      const spread = 0.08 + rng() * 0.18 * size;
      arr.push({
        pos: [
          Math.cos(angle) * spread,
          (rng() - 0.4) * 0.15 * size,
          Math.sin(angle) * spread,
        ],
        rot: [tilt, angle + rng() * 0.6, rng() * 0.3],
        scale: (0.22 + rng() * 0.18) * size,
      });
    }
    return arr;
  }, [position, size]);

  return (
    <group position={position}>
      {leaves.map((leaf, i) => (
        <mesh key={i} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshStandardMaterial
            map={leafTex}
            color="#2a8a3a"
            roughness={0.5}
            metalness={0.03}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Renders all connected branch segments */
function BranchRenderer({ branches, barkColor = '#5a5045' }: {
  branches: BranchSegment[];
  barkColor?: string;
}) {
  const barkTex = getBarkTexture(barkColor);
  const barkNorm = getBarkNormal();

  // Pre-compute transforms for each segment
  const transforms = useMemo(() => {
    return branches.map((b) => computeCylinderTransform(b.start, b.end));
  }, [branches]);

  return (
    <group>
      {branches.map((b, i) => {
        const t = transforms[i];
        return (
          <mesh
            key={i}
            position={t.position}
            quaternion={t.quaternion}
          >
            <cylinderGeometry args={[b.radiusEnd, b.radiusStart, t.length, 6]} />
            <meshStandardMaterial
              map={barkTex}
              normalMap={barkNorm}
              color={barkColor}
              roughness={0.92}
              metalness={0.0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Guava fruits hanging from fruit positions */
function GuavaFruits({ fruitPositions, seed = 0 }: {
  fruitPositions: Vec3[];
  seed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.4 + seed) * 0.015;
    }
  });

  const fruits = useMemo(() => {
    const rng = seededRandom(seed + 400);
    return fruitPositions.map((pos) => ({
      pos: [pos[0], pos[1] - 0.1 - rng() * 0.12, pos[2]] as Vec3,
      scale: 0.07 + rng() * 0.035,
      ripeness: rng(),
    }));
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.map((fruit, i) => {
        const r = fruit.ripeness;
        const color = new THREE.Color();
        if (r < 0.5) {
          color.lerpColors(new THREE.Color('#3a8a2a'), new THREE.Color('#8ac44a'), r * 2);
        } else {
          color.lerpColors(new THREE.Color('#8ac44a'), new THREE.Color('#d4c82a'), (r - 0.5) * 2);
        }

        return (
          <group key={i} position={fruit.pos}>
            <mesh scale={[fruit.scale, fruit.scale * 1.05, fruit.scale]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color={color} roughness={0.5} metalness={0.01} />
            </mesh>
            {/* Calyx crown */}
            <mesh position={[0, fruit.scale * 0.85, 0]} scale={[0.02, 0.015, 0.02]}>
              <sphereGeometry args={[1, 6, 4]} />
              <meshStandardMaterial color="#3a5a28" roughness={0.9} />
            </mesh>
            {/* Short stem connecting to branch */}
            <mesh position={[0, fruit.scale * 1.0, 0]}>
              <cylinderGeometry args={[0.005, 0.008, 0.08, 4]} />
              <meshStandardMaterial color="#5a4a30" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Root buttresses */
function GuavaRoots({ seed = 0 }: { seed?: number }) {
  const barkTex = getBarkTexture('#5a5045');

  const roots = useMemo(() => {
    const rng = seededRandom(seed + 600);
    const arr: { angle: number; length: number; thickness: number }[] = [];
    const count = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      arr.push({
        angle: (i / count) * Math.PI * 2 + rng() * 0.6,
        length: 0.3 + rng() * 0.25,
        thickness: 0.04 + rng() * 0.03,
      });
    }
    return arr;
  }, [seed]);

  const rootTransforms = useMemo(() => {
    return roots.map((root) => {
      const start: Vec3 = [0, 0.05, 0];
      const end: Vec3 = [
        Math.cos(root.angle) * root.length,
        -0.05,
        Math.sin(root.angle) * root.length,
      ];
      return { ...computeCylinderTransform(start, end), root };
    });
  }, [roots]);

  return (
    <group>
      {rootTransforms.map((rt, i) => (
        <mesh
          key={i}
          position={rt.position}
          quaternion={rt.quaternion}
        >
          <cylinderGeometry args={[rt.root.thickness * 0.3, rt.root.thickness, rt.length, 5]} />
          <meshStandardMaterial map={barkTex} color="#4a4035" roughness={0.98} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────
// Main GuavaTree Component
// ─────────────────────────────────────────────────────
export interface GuavaTreeProps {
  x: number;
  z: number;
  groundY?: number;
  isSpecial?: boolean;
}

export default function GuavaTree({ x, z, groundY = 0, isSpecial = false }: GuavaTreeProps) {
  const seed = useMemo(() => Math.floor(Math.abs(x * 67 + z * 149) % 10000), [x, z]);
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const sizeVar = useMemo(() => 0.85 + rng() * 0.3, [rng]);

  const trunkHeight = 1.8 * sizeVar;
  const canopyRadius = 2.0 * sizeVar;
  const trunkRadiusBottom = 0.25 * sizeVar;
  const trunkRadiusTop = 0.15 * sizeVar;

  const barkTex = getBarkTexture('#5a5045');
  const barkNorm = getBarkNormal();

  // Generate connected branching structure
  const treeData = useMemo(() => generateBranchTree(
    trunkHeight, canopyRadius, seed + 77,
    {
      mainBranchCount: 6,
      subBranchCount: 3,
      twigCount: 2,
      branchStartMin: 0.25,
      branchStartMax: 0.55,
      elevationMin: 0.2,
      elevationMax: 0.65,
      lengthMin: 0.4,
      lengthMax: 0.75,
      mainRadiusBot: 0.08,
      mainRadiusTop: 0.035,
      subRadiusBot: 0.035,
      subRadiusTop: 0.015,
      twigRadiusBot: 0.015,
      twigRadiusTop: 0.006,
      subAngleSpread: 1.2,
      subElevationDelta: 0.45,
    },
  ), [trunkHeight, canopyRadius, seed]);

  // Canopy sway
  const canopyRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (canopyRef.current) {
      const t = clock.getElapsedTime();
      canopyRef.current.rotation.z = Math.sin(t * 0.35 + seed * 0.1) * 0.01;
      canopyRef.current.rotation.x = Math.cos(t * 0.28 + seed * 0.15) * 0.008;
    }
  });

  // Special guava glow
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glowRef.current && isSpecial) {
      const t = Math.sin(clock.getElapsedTime() * 1.2) * 0.5 + 0.5;
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + t * 0.5;
    }
  });

  return (
    <group position={[x, groundY, z]}>
      {/* ── Trunk ── */}
      <mesh castShadow receiveShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadiusTop, trunkRadiusBottom, trunkHeight, 8, 4]} />
        <meshStandardMaterial
          map={barkTex}
          normalMap={barkNorm}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          color="#5a5045"
          roughness={0.85}
          metalness={0.0}
          emissive={isSpecial ? '#4ade80' : '#000000'}
          emissiveIntensity={isSpecial ? 0.15 : 0}
        />
      </mesh>

      {/* ── Trunk flare ── */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[trunkRadiusBottom, trunkRadiusBottom * 1.3, 0.25, 8]} />
        <meshStandardMaterial map={barkTex} color="#4a3a2a" roughness={0.95} />
      </mesh>

      {/* ── Roots ── */}
      <GuavaRoots seed={seed} />

      {/* ── Connected branches ── */}
      <group ref={canopyRef}>
        <BranchRenderer branches={treeData.branches} barkColor="#5a5045" />

        {/* ── Leaf clusters AT branch tips ── */}
        {treeData.leafTipPositions.map((pos, i) => (
          <GuavaLeafCluster key={i} position={pos} size={0.7 + (i % 3) * 0.15} />
        ))}

        {/* ── Fruits hanging from branch junctions ── */}
        <GuavaFruits fruitPositions={treeData.fruitPositions} seed={seed} />
      </group>

      {/* ── Special glow ring ── */}
      {isSpecial && (
        <mesh ref={glowRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 2.9, 32]} />
          <meshStandardMaterial
            color="#4ade80"
            emissive="#4ade80"
            emissiveIntensity={0.4}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ── Ground shadow ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[canopyRadius * 1.0, 24]} />
        <meshStandardMaterial color="#0a1a0a" transparent opacity={0.18} roughness={1} />
      </mesh>
    </group>
  );
}
