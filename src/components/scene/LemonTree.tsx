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
// Lemon Tree — compact, evergreen citrus with glossy
// narrow leaves, white flowers, and bright lemons.
// ─────────────────────────────────────────────────────

const BARK_COLOR = '#5a4a2a';

/** Aggregated Leaf clusters */
function LemonLeafClusters({ positions }: { positions: Vec3[] }) {
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
      <meshStandardMaterial map={barkTex} normalMap={barkNorm} color={BARK_COLOR} roughness={0.92} metalness={0.0} />
      {instancedData.map((d, i) => (
        <Instance key={i} position={d.pos} quaternion={d.rot} scale={d.scale} />
      ))}
    </Instances>
  );
}

/** White 5-petaled citrus flowers at some branch tips */
function LemonFlowers({ positions, seed }: { positions: Vec3[]; seed: number }) {
  const { petals, centers } = useMemo(() => {
    const p: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    const c: { pos: Vec3; scale: number }[] = [];
    const rng = seededRandom(seed + 250);
    
    positions.forEach((pos) => {
      if (rng() > 0.55) {
        const scale = 0.022 + rng() * 0.012;
        c.push({ pos, scale: scale * 0.4 });
        
        for (let pi = 0; pi < 5; pi++) {
          const pAngle = (pi / 5) * Math.PI * 2;
          p.push({
            pos: [
              pos[0] + Math.cos(pAngle) * scale * 0.7,
              pos[1],
              pos[2] + Math.sin(pAngle) * scale * 0.7,
            ],
            rot: [0.3, pAngle, 0],
            scale,
          });
        }
      }
    });
    return { petals: p, centers: c };
  }, [positions, seed]);

  return (
    <group>
      {petals.length > 0 && (
        <Instances range={petals.length} limit={petals.length}>
          <planeGeometry args={[0.8, 1.2]} />
          <meshStandardMaterial color="#fffde8" roughness={0.4} side={THREE.DoubleSide} transparent opacity={0.9} />
          {petals.map((p, i) => (
            <Instance key={i} position={p.pos} rotation={p.rot} scale={p.scale} />
          ))}
        </Instances>
      )}
      {centers.length > 0 && (
        <Instances range={centers.length} limit={centers.length}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial color="#e8c820" roughness={0.5} />
          {centers.map((c, i) => (
            <Instance key={i} position={c.pos} scale={c.scale} />
          ))}
        </Instances>
      )}
    </group>
  );
}

/** Lemons hanging from fruit positions */
function LemonFruits({ fruitPositions, seed = 0 }: {
  fruitPositions: Vec3[];
  seed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.45 + seed) * 0.015;
    }
  });

  const { fruits } = useMemo(() => {
    const rng = seededRandom(seed + 450);
    const fArr: any[] = [];
    
    fruitPositions.forEach((pos) => {
      const r = rng();
      const color = new THREE.Color();
      if (r < 0.5) {
        color.lerpColors(new THREE.Color('#4a8a2a'), new THREE.Color('#b4c830'), r * 2);
      } else {
        color.lerpColors(new THREE.Color('#b4c830'), new THREE.Color('#fde047'), (r - 0.5) * 2);
      }
      
      const p: Vec3 = [pos[0], pos[1] - 0.08 - rng() * 0.1, pos[2]];
      const rot: [number, number, number] = [rng() * 0.3 - 0.15, rng() * Math.PI * 2, rng() * 0.3];
      const scaleX = 0.055 + rng() * 0.02;
      const scaleY = 0.075 + rng() * 0.025;
      
      fArr.push({ pos: p, rot, scale: [scaleX, scaleY, scaleX], color });
    });
    return { fruits: fArr };
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.map((fruit, i) => (
        <group key={i} position={fruit.pos} rotation={fruit.rot}>
          <mesh scale={fruit.scale as any}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={fruit.color} roughness={0.4} metalness={0.02} />
          </mesh>
          <mesh position={[0, -fruit.scale[1] * 0.85, 0]} scale={[fruit.scale[0] * 0.35, fruit.scale[1] * 0.25, fruit.scale[0] * 0.35]}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshStandardMaterial color={fruit.color} roughness={0.45} />
          </mesh>
          <mesh position={[0, fruit.scale[1] * 0.9, 0]}>
            <cylinderGeometry args={[0.005, 0.008, 0.06, 4]} />
            <meshStandardMaterial color="#5a6a30" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Root flare */
function LemonRoots({ seed = 0 }: { seed?: number }) {
  const barkTex = getBarkTexture(BARK_COLOR);

  const rootTransforms = useMemo(() => {
    const rng = seededRandom(seed + 650);
    const count = 3 + Math.floor(rng() * 2);
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
      const length = 0.25 + rng() * 0.2;
      const thickness = 0.04 + rng() * 0.025;
      const start: Vec3 = [0, 0.04, 0];
      const end: Vec3 = [Math.cos(angle) * length, -0.03, Math.sin(angle) * length];
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
      <meshStandardMaterial map={barkTex} color="#4a3a1a" roughness={0.98} />
      {rootTransforms.map((rt, i) => (
        <Instance key={i} position={rt.pos} quaternion={rt.rot} scale={rt.scale} />
      ))}
    </Instances>
  );
}

// ─────────────────────────────────────────────────────
// Main LemonTree Component
// ─────────────────────────────────────────────────────
export interface LemonTreeProps {
  x: number;
  z: number;
  groundY?: number;
}

export default function LemonTree({ x, z, groundY = 0 }: LemonTreeProps) {
  const seed = useMemo(() => Math.floor(Math.abs(x * 59 + z * 181) % 10000), [x, z]);
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const sizeVar = useMemo(() => 0.85 + rng() * 0.3, [rng]);

  const trunkHeight = 1.6 * sizeVar;
  const canopyRadius = 1.8 * sizeVar;
  const trunkRadiusBottom = 0.2 * sizeVar;
  const trunkRadiusTop = 0.12 * sizeVar;

  const barkTex = getBarkTexture(BARK_COLOR);
  const barkNorm = getBarkNormal();

  // Generate connected branching
  const treeData = useMemo(() => generateBranchTree(
    trunkHeight, canopyRadius, seed + 88,
    {
      mainBranchCount: 5,
      subBranchCount: 2,
      twigCount: 2,
      branchStartMin: 0.3,
      branchStartMax: 0.6,
      elevationMin: 0.2,
      elevationMax: 0.6,
      lengthMin: 0.4,
      lengthMax: 0.75,
      mainRadiusBot: 0.065,
      mainRadiusTop: 0.028,
      subRadiusBot: 0.028,
      subRadiusTop: 0.012,
      twigRadiusBot: 0.012,
      twigRadiusTop: 0.005,
      subAngleSpread: 1.0,
      subElevationDelta: 0.4,
    },
  ), [trunkHeight, canopyRadius, seed]);

  // Canopy sway
  const canopyRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (canopyRef.current) {
      const t = clock.getElapsedTime();
      canopyRef.current.rotation.z = Math.sin(t * 0.32 + seed * 0.1) * 0.009;
      canopyRef.current.rotation.x = Math.cos(t * 0.26 + seed * 0.15) * 0.007;
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
          normalScale={new THREE.Vector2(0.7, 0.7)}
          color={BARK_COLOR}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* ── Trunk flare ── */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[trunkRadiusBottom, trunkRadiusBottom * 1.25, 0.2, 8]} />
        <meshStandardMaterial map={barkTex} color="#4a3a1a" roughness={0.95} />
      </mesh>

      {/* ── Roots ── */}
      <LemonRoots seed={seed} />

      {/* ── Connected branches + leaves + flowers + fruits ── */}
      <group ref={canopyRef}>
        {/* Connected branch segments */}
        <BranchRenderer branches={treeData.branches} />

        {/* Aggregated Leaf Clusters */}
        <LemonLeafClusters positions={treeData.leafTipPositions} />
        
        {/* Flowers at some leaf positions */}
        <LemonFlowers positions={treeData.leafTipPositions} seed={seed} />

        {/* Fruits from branch junctions */}
        <LemonFruits fruitPositions={treeData.fruitPositions} seed={seed} />
      </group>

      {/* ── Ground shadow ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[canopyRadius * 0.95, 24]} />
        <meshStandardMaterial color="#0a1a0a" transparent opacity={0.17} roughness={1} />
      </mesh>
    </group>
  );
}
