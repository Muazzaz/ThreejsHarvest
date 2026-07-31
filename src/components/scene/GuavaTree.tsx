/* eslint-disable react-hooks/purity */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';
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

/** Aggregated Leaf clusters */
function GuavaLeafClusters({ positions }: { positions: Vec3[] }) {
  const leafTex = getLeafTexture('#1a6e28', 'rgba(100, 210, 100, 0.25)', '#2d8838', 'oval');
  
  const allLeaves = useMemo(() => {
    const leaves: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    positions.forEach((pos, index) => {
      const rng = seededRandom(Math.floor(pos[0] * 1000 + pos[1] * 100 + pos[2] * 10));
      const size = 0.7 + (index % 4) * 0.12;
      const count = 6 + Math.floor(rng() * 5);
      
      for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2;
        const tilt = rng() * 0.5 - 0.25;
        const spread = 0.08 + rng() * 0.18 * size;
        leaves.push({
          pos: [
            pos[0] + Math.cos(angle) * spread,
            pos[1] + (rng() - 0.4) * 0.15 * size,
            pos[2] + Math.sin(angle) * spread,
          ],
          rot: [tilt, angle + rng() * 0.6, rng() * 0.3],
          scale: (0.22 + rng() * 0.18) * size,
        });
      }
    });
    return leaves;
  }, [positions]);

  if (allLeaves.length === 0) return null;

  return (
    <Instances range={allLeaves.length} limit={allLeaves.length}>
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
      {allLeaves.map((leaf, i) => (
        <Instance key={i} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale} />
      ))}
    </Instances>
  );
}

/** Renders all connected branch segments using Instances */
function BranchRenderer({ branches, barkColor = '#5a5045' }: {
  branches: BranchSegment[];
  barkColor?: string;
}) {
  const barkTex = getBarkTexture(barkColor);
  const barkNorm = getBarkNormal();

  const instancedData = useMemo(() => {
    return branches.map((b) => {
      const t = computeCylinderTransform(b.start, b.end);
      const avgRadius = (b.radiusStart + b.radiusEnd) / 2;
      return {
        pos: t.position,
        rot: t.quaternion,
        scale: [avgRadius, t.length, avgRadius] as [number, number, number],
      };
    });
  }, [branches]);

  if (instancedData.length === 0) return null;

  return (
    <Instances range={instancedData.length} limit={instancedData.length}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial map={barkTex} normalMap={barkNorm} color={barkColor} roughness={0.92} metalness={0.0} />
      {instancedData.map((d, i) => (
        <Instance key={i} position={d.pos} quaternion={d.rot} scale={d.scale} />
      ))}
    </Instances>
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

  const { fruits, calyxes, stems } = useMemo(() => {
    const rng = seededRandom(seed + 400);
    const fArr: any[] = [];
    const cArr: any[] = [];
    const stArr: any[] = [];
    
    fruitPositions.forEach((pos) => {
      const p: Vec3 = [pos[0], pos[1] - 0.1 - rng() * 0.12, pos[2]];
      const scale = 0.07 + rng() * 0.035;
      const r = rng();
      
      const color = new THREE.Color();
      if (r < 0.5) {
        color.lerpColors(new THREE.Color('#3a8a2a'), new THREE.Color('#8ac44a'), r * 2);
      } else {
        color.lerpColors(new THREE.Color('#8ac44a'), new THREE.Color('#d4c82a'), (r - 0.5) * 2);
      }
      
      fArr.push({ pos: p, scale, color });
      cArr.push({ pos: [p[0], p[1] + scale * 0.85, p[2]], scale });
      stArr.push({ pos: [p[0], p[1] + scale * 1.0, p[2]] });
    });
    
    return { fruits: fArr, calyxes: cArr, stems: stArr };
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.length > 0 && (
        <Instances range={fruits.length} limit={fruits.length}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial roughness={0.5} metalness={0.01} />
          {fruits.map((f, i) => (
            <Instance key={i} position={f.pos} scale={[f.scale, f.scale * 1.05, f.scale]} color={f.color} />
          ))}
        </Instances>
      )}
      {calyxes.length > 0 && (
        <Instances range={calyxes.length} limit={calyxes.length}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial color="#3a5a28" roughness={0.9} />
          {calyxes.map((c, i) => (
            <Instance key={i} position={c.pos} scale={[0.02, 0.015, 0.02]} />
          ))}
        </Instances>
      )}
      {stems.length > 0 && (
        <Instances range={stems.length} limit={stems.length}>
          <cylinderGeometry args={[0.005, 0.008, 0.08, 4]} />
          <meshStandardMaterial color="#5a4a30" roughness={0.9} />
          {stems.map((st, i) => (
            <Instance key={i} position={st.pos} />
          ))}
        </Instances>
      )}
    </group>
  );
}

/** Root buttresses */
function GuavaRoots({ seed = 0 }: { seed?: number }) {
  const barkTex = getBarkTexture('#5a5045');

  const rootTransforms = useMemo(() => {
    const rng = seededRandom(seed + 600);
    const arr = [];
    const count = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.6;
      const length = 0.3 + rng() * 0.25;
      const thickness = 0.04 + rng() * 0.03;
      
      const start: Vec3 = [0, 0.05, 0];
      const end: Vec3 = [
        Math.cos(angle) * length,
        -0.05,
        Math.sin(angle) * length,
      ];
      const t = computeCylinderTransform(start, end);
      arr.push({
        pos: t.position,
        rot: t.quaternion,
        scale: [thickness * 0.3, t.length, thickness] as [number, number, number]
      });
    }
    return arr;
  }, [seed]);

  if (rootTransforms.length === 0) return null;

  return (
    <Instances range={rootTransforms.length} limit={rootTransforms.length}>
      <cylinderGeometry args={[1, 1, 1, 5]} />
      <meshStandardMaterial map={barkTex} color="#4a4035" roughness={0.98} />
      {rootTransforms.map((rt, i) => (
        <Instance key={i} position={rt.pos} quaternion={rt.rot} scale={rt.scale} />
      ))}
    </Instances>
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
        {/* Branch Segments */}
        <BranchRenderer branches={treeData.branches} barkColor="#5a5045" />

        {/* Aggregated Leaf Clusters */}
        <GuavaLeafClusters positions={treeData.leafTipPositions} />

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
