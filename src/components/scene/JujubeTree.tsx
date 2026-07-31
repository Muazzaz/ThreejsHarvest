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
// Jujube Tree (Boroi) — zig-zag branching, thorns,
// small oval leaves, compact crown with small red berries
// ─────────────────────────────────────────────────────

const BARK_COLOR = '#4a3520';

/** Aggregated Leaf clusters */
function JujubeLeafClusters({ positions }: { positions: Vec3[] }) {
  const leafTex = getLeafTexture('#2a5c1a', 'rgba(150, 220, 150, 0.25)', '#3a7a2a', 'oval');
  
  const allLeaves = useMemo(() => {
    const leaves: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    positions.forEach((pos, index) => {
      const rng = seededRandom(Math.floor(pos[0] * 1000 + pos[1] * 100 + pos[2] * 10));
      const size = 0.7 + (index % 4) * 0.12;
      const count = 5 + Math.floor(rng() * 4);
      
      for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2;
        const tilt = rng() * 0.5 - 0.1;
        const spread = 0.05 + rng() * 0.12 * size;
        leaves.push({
          pos: [
            pos[0] + Math.cos(angle) * spread,
            pos[1] + (rng() - 0.4) * 0.12 * size,
            pos[2] + Math.sin(angle) * spread,
          ],
          rot: [tilt, angle + rng() * 0.6, rng() * 0.2],
          scale: (0.18 + rng() * 0.12) * size,
        });
      }
    });
    return leaves;
  }, [positions]);

  if (allLeaves.length === 0) return null;

  return (
    <Instances range={allLeaves.length} limit={allLeaves.length}>
      <planeGeometry args={[0.3, 0.6]} />
      <meshStandardMaterial
        map={leafTex}
        color="#3a7a2a"
        roughness={0.4}
        metalness={0.05}
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

/** Renders connected branch segments using Instances */
function BranchRenderer({ branches }: { branches: BranchSegment[] }) {
  const barkTex = getBarkTexture(BARK_COLOR);
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
      <meshStandardMaterial map={barkTex} normalMap={barkNorm} color={BARK_COLOR} roughness={0.95} metalness={0.0} />
      {instancedData.map((d, i) => (
        <Instance key={i} position={d.pos} quaternion={d.rot} scale={d.scale} />
      ))}
    </Instances>
  );
}

/** Thorns along branches */
function JujubeThorns({ branches, seed }: { branches: BranchSegment[]; seed: number }) {
  const thorns = useMemo(() => {
    const rng = seededRandom(seed + 900);
    const arr: { pos: Vec3; rot: [number, number, number] }[] = [];
    for (const b of branches) {
      const thornCount = 1 + Math.floor(rng() * 2);
      for (let t = 0; t < thornCount; t++) {
        if (rng() > 0.55) continue;
        const frac = 0.2 + rng() * 0.6;
        arr.push({
          pos: [
            b.start[0] + (b.end[0] - b.start[0]) * frac + (rng() - 0.5) * 0.03,
            b.start[1] + (b.end[1] - b.start[1]) * frac + (rng() - 0.5) * 0.03,
            b.start[2] + (b.end[2] - b.start[2]) * frac + (rng() - 0.5) * 0.03,
          ],
          rot: [rng() * Math.PI * 0.5, rng() * Math.PI * 2, rng() * Math.PI * 0.3],
        });
      }
    }
    return arr;
  }, [branches, seed]);

  if (thorns.length === 0) return null;

  return (
    <Instances range={thorns.length} limit={thorns.length}>
      <coneGeometry args={[0.007, 0.04, 4]} />
      <meshStandardMaterial color="#6a5a3a" roughness={0.9} />
      {thorns.map((thorn, i) => (
        <Instance key={i} position={thorn.pos} rotation={thorn.rot} />
      ))}
    </Instances>
  );
}

/** Small jujube berries at fruit positions */
function JujubeFruits({ fruitPositions, seed = 0 }: {
  fruitPositions: Vec3[];
  seed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5 + seed) * 0.012;
    }
  });

  const { fruits, stems } = useMemo(() => {
    const rng = seededRandom(seed + 700);
    const fArr: any[] = [];
    const stArr: any[] = [];
    
    fruitPositions.forEach((pos) => {
      const scale = 0.035 + rng() * 0.02;
      const r = rng();
      
      const color = new THREE.Color();
      if (r < 0.3) {
        color.lerpColors(new THREE.Color('#4a8a2a'), new THREE.Color('#a4b044'), r * 3.3);
      } else if (r < 0.7) {
        color.lerpColors(new THREE.Color('#a4b044'), new THREE.Color('#c44a28'), (r - 0.3) * 2.5);
      } else {
        color.lerpColors(new THREE.Color('#c44a28'), new THREE.Color('#8a2020'), (r - 0.7) * 3.3);
      }
      
      const p: Vec3 = [pos[0], pos[1] - 0.06 - rng() * 0.08, pos[2]];
      fArr.push({ pos: p, scale, color });
      stArr.push({ pos: [p[0], p[1] + scale * 0.9, p[2]] });
    });
    return { fruits: fArr, stems: stArr };
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.length > 0 && (
        <Instances range={fruits.length} limit={fruits.length}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial roughness={0.35} metalness={0.02} />
          {fruits.map((f, i) => (
            <Instance key={i} position={f.pos} scale={f.scale} color={f.color} />
          ))}
        </Instances>
      )}
      {stems.length > 0 && (
        <Instances range={stems.length} limit={stems.length}>
          <cylinderGeometry args={[0.003, 0.005, 0.05, 3]} />
          <meshStandardMaterial color="#5a4a30" roughness={0.9} />
          {stems.map((st, i) => (
            <Instance key={i} position={st.pos} />
          ))}
        </Instances>
      )}
    </group>
  );
}

/** Root flare */
function JujubeRoots({ seed = 0 }: { seed?: number }) {
  const barkTex = getBarkTexture(BARK_COLOR);

  const rootTransforms = useMemo(() => {
    const rng = seededRandom(seed + 550);
    const count = 3 + Math.floor(rng() * 2);
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
      const length = 0.3 + rng() * 0.2;
      const thickness = 0.04 + rng() * 0.03;
      const start: Vec3 = [0, 0.04, 0];
      const end: Vec3 = [
        Math.cos(angle) * length,
        -0.04,
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
      <meshStandardMaterial map={barkTex} color="#3a2e18" roughness={0.98} />
      {rootTransforms.map((rt, i) => (
        <Instance key={i} position={rt.pos} quaternion={rt.rot} scale={rt.scale} />
      ))}
    </Instances>
  );
}

// ─────────────────────────────────────────────────────
// Main JujubeTree Component
// ─────────────────────────────────────────────────────
export interface JujubeTreeProps {
  x: number;
  z: number;
  groundY?: number;
}

export default function JujubeTree({ x, z, groundY = 0 }: JujubeTreeProps) {
  const seed = useMemo(() => Math.floor(Math.abs(x * 71 + z * 163) % 10000), [x, z]);
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const sizeVar = useMemo(() => 0.8 + rng() * 0.35, [rng]);

  const trunkHeight = 2.0 * sizeVar;
  const canopyRadius = 1.8 * sizeVar;
  const trunkRadiusBottom = 0.22 * sizeVar;
  const trunkRadiusTop = 0.12 * sizeVar;

  const barkTex = getBarkTexture(BARK_COLOR);
  const barkNorm = getBarkNormal();

  // Generate connected zig-zag branching
  const treeData = useMemo(() => generateBranchTree(
    trunkHeight, canopyRadius, seed + 66,
    {
      mainBranchCount: 5,
      subBranchCount: 3,
      twigCount: 2,
      branchStartMin: 0.3,
      branchStartMax: 0.6,
      elevationMin: 0.15,
      elevationMax: 0.55,
      lengthMin: 0.4,
      lengthMax: 0.8,
      mainRadiusBot: 0.07,
      mainRadiusTop: 0.03,
      subRadiusBot: 0.03,
      subRadiusTop: 0.012,
      twigRadiusBot: 0.012,
      twigRadiusTop: 0.004,
      subAngleSpread: 1.4,  // wider zig-zag angles
      subElevationDelta: 0.6,
    },
  ), [trunkHeight, canopyRadius, seed]);

  // Canopy sway
  const canopyRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (canopyRef.current) {
      const t = clock.getElapsedTime();
      canopyRef.current.rotation.z = Math.sin(t * 0.4 + seed * 0.1) * 0.012;
      canopyRef.current.rotation.x = Math.cos(t * 0.3 + seed * 0.2) * 0.008;
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
          normalScale={new THREE.Vector2(0.9, 0.9)}
          color={BARK_COLOR}
          roughness={0.97}
          metalness={0.0}
        />
      </mesh>

      {/* ── Trunk flare ── */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[trunkRadiusBottom, trunkRadiusBottom * 1.25, 0.2, 8]} />
        <meshStandardMaterial map={barkTex} color="#3a2a15" roughness={0.98} />
      </mesh>

      {/* ── Roots ── */}
      <JujubeRoots seed={seed} />

      {/* ── Connected branches + thorns + leaves + fruits ── */}
      <group ref={canopyRef}>
        {/* Connected branch segments */}
        <BranchRenderer branches={treeData.branches} />
        <JujubeThorns branches={treeData.branches} seed={seed} />

        {/* Aggregated Leaf Clusters */}
        <JujubeLeafClusters positions={treeData.leafTipPositions} />
        
        {/* Fruits from branch junctions */}
        <JujubeFruits fruitPositions={treeData.fruitPositions} seed={seed} />
      </group>

      {/* ── Ground shadow ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[canopyRadius * 0.9, 24]} />
        <meshStandardMaterial color="#0a1a0a" transparent opacity={0.16} roughness={1} />
      </mesh>
    </group>
  );
}
