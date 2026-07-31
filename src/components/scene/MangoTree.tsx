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
// Mango Tree — large, spreading crown with dense
// lanceolate leaves, visible branch structure, flower
// panicles, and hanging mango fruits at various ripeness.
// ─────────────────────────────────────────────────────

/** Aggregated Lanceolate leaf clusters for the entire tree */
function MangoLeafClusters({ positions }: { positions: Vec3[] }) {
  const leafTex = getLeafTexture('#1a5c1a', 'rgba(120, 200, 120, 0.25)', '#2a7a2a', 'lanceolate');
  
  const allLeaves = useMemo(() => {
    const leaves: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    positions.forEach((pos, index) => {
      const rng = seededRandom(Math.floor(pos[0] * 1000 + pos[1] * 100 + pos[2] * 10));
      const size = 0.7 + (index % 4) * 0.12;
      const count = 6 + Math.floor(rng() * 5);
      
      for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2;
        const tilt = rng() * 0.6 - 0.3;
        const spread = 0.08 + rng() * 0.2 * size;
        leaves.push({
          pos: [
            pos[0] + Math.cos(angle) * spread,
            pos[1] + (rng() - 0.3) * 0.18 * size,
            pos[2] + Math.sin(angle) * spread,
          ],
          rot: [tilt, angle + rng() * 0.5, rng() * 0.3],
          scale: (0.28 + rng() * 0.22) * size,
        });
      }
    });
    return leaves;
  }, [positions]);

  if (allLeaves.length === 0) return null;

  return (
    <Instances range={allLeaves.length} limit={allLeaves.length}>
      <planeGeometry args={[0.4, 0.8]} />
      <meshStandardMaterial
        map={leafTex}
        color="#1e6b1e"
        roughness={0.45}
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

/** Renders all connected branch segments with bark texture */
function BranchRenderer({ branches, barkColor = '#4a3828' }: {
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
      <meshStandardMaterial map={barkTex} normalMap={barkNorm} color={barkColor} roughness={0.95} metalness={0.0} />
      {instancedData.map((d, i) => (
        <Instance key={i} position={d.pos} quaternion={d.rot} scale={d.scale} />
      ))}
    </Instances>
  );
}

/** Flower panicles near leaf tips */
function FlowerPanicles({ positions, seed = 0 }: {
  positions: Vec3[];
  seed?: number;
}) {
  const { spheres, stems } = useMemo(() => {
    const sArr: any[] = [];
    const stArr: any[] = [];
    const rng = seededRandom(seed + 200);
    
    positions.forEach((pos, pi) => {
      if (rng() > 0.6) {
        const count = 10 + Math.floor(rng() * 12);
        
        stArr.push({ pos });
        
        for (let fi = 0; fi < count; fi++) {
          const rng2 = seededRandom(pi * 100 + fi);
          sArr.push({
            pos: [
              pos[0] + (rng2() - 0.5) * 0.25,
              pos[1] + rng2() * 0.3 - 0.15,
              pos[2] + (rng2() - 0.5) * 0.25,
            ],
            scale: 0.018 + rng2() * 0.012,
            color: new THREE.Color(`hsl(${65 + rng2() * 15}, ${50 + rng2() * 20}%, ${65 + rng2() * 15}%)`)
          });
        }
      }
    });
    return { spheres: sArr, stems: stArr };
  }, [positions, seed]);

  return (
    <group>
      {spheres.length > 0 && (
        <Instances range={spheres.length} limit={spheres.length}>
          <sphereGeometry args={[1, 4, 4]} />
          <meshStandardMaterial roughness={0.6} />
          {spheres.map((s, i) => (
            <Instance key={i} position={s.pos} scale={s.scale} color={s.color} />
          ))}
        </Instances>
      )}
      {stems.length > 0 && (
        <Instances range={stems.length} limit={stems.length}>
          <cylinderGeometry args={[0.006, 0.01, 0.3, 4]} />
          <meshStandardMaterial color="#6b8a3a" roughness={0.8} />
          {stems.map((st, i) => (
            <Instance key={i} position={st.pos} rotation={[0, 0, Math.PI / 2 + 0.2]} />
          ))}
        </Instances>
      )}
    </group>
  );
}

/** Mango fruits hanging from branch positions */
function MangoFruits({ fruitPositions, seed = 0 }: {
  fruitPositions: Vec3[];
  seed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.3 + seed) * 0.02;
    }
  });

  const { fruits, stems } = useMemo(() => {
    const rng = seededRandom(seed + 400);
    const fArr: any[] = [];
    const stArr: any[] = [];
    
    fruitPositions.forEach((pos) => {
      const scale = 0.08 + rng() * 0.04;
      const r = rng();
      const color = new THREE.Color();
      if (r < 0.3) {
        color.lerpColors(new THREE.Color('#2a6a2a'), new THREE.Color('#8a9a2a'), r * 3.3);
      } else if (r < 0.7) {
        color.lerpColors(new THREE.Color('#8a9a2a'), new THREE.Color('#d4a017'), (r - 0.3) * 2.5);
      } else {
        color.lerpColors(new THREE.Color('#d4a017'), new THREE.Color('#d45017'), (r - 0.7) * 3.3);
      }
      
      const p: Vec3 = [pos[0], pos[1] - 0.15 - rng() * 0.1, pos[2]];
      fArr.push({ pos: p, scale, color });
      stArr.push({ pos: [p[0], p[1] + scale * 0.9, p[2]] });
    });
    return { fruits: fArr, stems: stArr };
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.length > 0 && (
        <Instances range={fruits.length} limit={fruits.length}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial roughness={0.4} metalness={0.01} />
          {fruits.map((f, i) => (
            <Instance key={i} position={f.pos} scale={[f.scale * 0.85, f.scale, f.scale * 0.85]} color={f.color} />
          ))}
        </Instances>
      )}
      {stems.length > 0 && (
        <Instances range={stems.length} limit={stems.length}>
          <cylinderGeometry args={[0.005, 0.008, 0.1, 4]} />
          <meshStandardMaterial color="#4a3828" roughness={0.9} />
          {stems.map((st, i) => (
            <Instance key={i} position={st.pos} />
          ))}
        </Instances>
      )}
    </group>
  );
}

/** Base root flares for mango tree */
function MangoRoots({ seed = 0 }: { seed?: number }) {
  const barkTex = getBarkTexture('#4a3828');

  const rootTransforms = useMemo(() => {
    const rng = seededRandom(seed + 600);
    const count = 4 + Math.floor(rng() * 3);
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
      const length = 0.5 + rng() * 0.4;
      const thickness = 0.05 + rng() * 0.04;
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
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial map={barkTex} color="#3a2a1a" roughness={0.98} />
      {rootTransforms.map((rt, i) => (
        <Instance key={i} position={rt.pos} quaternion={rt.rot} scale={rt.scale} />
      ))}
    </Instances>
  );
}

// ─────────────────────────────────────────────────────
// Main MangoTree Component
// ─────────────────────────────────────────────────────
export interface MangoTreeProps {
  x: number;
  z: number;
  groundY?: number;
  scale?: number;
}

export default function MangoTree({ x, z, groundY = 0, scale: treeScale = 1 }: MangoTreeProps) {
  const seed = useMemo(() => Math.floor(Math.abs(x * 73 + z * 137) % 10000), [x, z]);
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const sizeVar = useMemo(() => 0.85 + rng() * 0.35, [rng]);

  const trunkHeight = 2.0 * sizeVar * treeScale;
  const canopyRadius = 2.6 * sizeVar * treeScale;
  const trunkRadiusBottom = 0.35 * sizeVar * treeScale;
  const trunkRadiusTop = 0.2 * sizeVar * treeScale;

  const barkTex = getBarkTexture('#4a3828');
  const barkNorm = getBarkNormal();

  // Generate connected branching
  const treeData = useMemo(() => generateBranchTree(
    trunkHeight, canopyRadius, seed + 55,
    {
      mainBranchCount: 6,
      subBranchCount: 3,
      twigCount: 2,
      branchStartMin: 0.3,
      branchStartMax: 0.6,
      elevationMin: 0.2,
      elevationMax: 0.65,
      lengthMin: 0.5,
      lengthMax: 0.9,
      mainRadiusBot: 0.12,
      mainRadiusTop: 0.05,
      subRadiusBot: 0.05,
      subRadiusTop: 0.022,
      twigRadiusBot: 0.022,
      twigRadiusTop: 0.008,
      subAngleSpread: 1.0,
      subElevationDelta: 0.4,
    },
  ), [trunkHeight, canopyRadius, seed]);

  // Gentle canopy sway
  const canopyRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (canopyRef.current) {
      const t = clock.getElapsedTime();
      canopyRef.current.rotation.z = Math.sin(t * 0.3 + seed * 0.1) * 0.008;
      canopyRef.current.rotation.x = Math.cos(t * 0.25 + seed * 0.2) * 0.006;
    }
  });

  return (
    <group position={[x, groundY, z]}>
      {/* ── Trunk ── */}
      <mesh castShadow receiveShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadiusTop, trunkRadiusBottom, trunkHeight, 10, 4]} />
        <meshStandardMaterial
          map={barkTex}
          normalMap={barkNorm}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          color="#4a3828"
          roughness={0.97}
          metalness={0.0}
        />
      </mesh>

      {/* ── Trunk flare at base ── */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[trunkRadiusBottom, trunkRadiusBottom * 1.4, 0.3, 10]} />
        <meshStandardMaterial map={barkTex} color="#3a2a1a" roughness={0.98} />
      </mesh>

      {/* ── Root buttresses ── */}
      <MangoRoots seed={seed} />

      {/* ── Branches + canopy ── */}
      <group ref={canopyRef}>
        {/* Connected branch segments */}
        <BranchRenderer branches={treeData.branches} barkColor="#4a3828" />

        {/* Aggregated Leaf clusters */}
        <MangoLeafClusters positions={treeData.leafTipPositions} />

        {/* Flower panicles at some leaf positions */}
        <FlowerPanicles positions={treeData.leafTipPositions} seed={seed} />

        {/* Mango fruits hanging from branch junctions */}
        <MangoFruits fruitPositions={treeData.fruitPositions} seed={seed} />
      </group>

      {/* ── Shadow disc ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[canopyRadius * 1.1, 24]} />
        <meshStandardMaterial color="#0a1a0a" transparent opacity={0.2} roughness={1} />
      </mesh>
    </group>
  );
}
