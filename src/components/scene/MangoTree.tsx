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
// Mango Tree — large, spreading crown with dense
// lanceolate leaves, visible branch structure, flower
// panicles, and hanging mango fruits at various ripeness.
// ─────────────────────────────────────────────────────

/** Lanceolate leaf cluster at a branch tip */
function MangoLeafCluster({ position, size = 1.0 }: { position: Vec3; size?: number }) {
  const leafTex = getLeafTexture('#1a5c1a', 'rgba(120, 200, 120, 0.25)', '#2a7a2a', 'lanceolate');
  const leaves = useMemo(() => {
    const rng = seededRandom(
      Math.floor(position[0] * 1000 + position[1] * 100 + position[2] * 10),
    );
    const count = 6 + Math.floor(rng() * 5);
    const arr: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const tilt = rng() * 0.6 - 0.3;
      const spread = 0.08 + rng() * 0.2 * size;
      arr.push({
        pos: [
          Math.cos(angle) * spread,
          (rng() - 0.3) * 0.18 * size,
          Math.sin(angle) * spread,
        ],
        rot: [tilt, angle + rng() * 0.5, rng() * 0.3],
        scale: (0.28 + rng() * 0.22) * size,
      });
    }
    return arr;
  }, [position, size]);

  return (
    <group position={position}>
      {leaves.map((leaf, i) => (
        <mesh key={i} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale} castShadow>
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
        </mesh>
      ))}
    </group>
  );
}

/** Renders all connected branch segments with bark texture */
function BranchRenderer({ branches, barkColor = '#4a3828' }: {
  branches: BranchSegment[];
  barkColor?: string;
}) {
  const barkTex = getBarkTexture(barkColor);
  const barkNorm = getBarkNormal();

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
            castShadow
          >
            <cylinderGeometry args={[b.radiusEnd, b.radiusStart, t.length, 6]} />
            <meshStandardMaterial
              map={barkTex}
              normalMap={barkNorm}
              color={barkColor}
              roughness={0.95}
              metalness={0.0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Flower panicles near leaf tips */
function FlowerPanicles({ positions, seed = 0 }: {
  positions: Vec3[];
  seed?: number;
}) {
  const panicles = useMemo(() => {
    const rng = seededRandom(seed + 200);
    // Only some tips get flowers
    return positions.filter(() => rng() > 0.6).map((pos) => ({
      pos,
      count: 10 + Math.floor(rng() * 12),
    }));
  }, [positions, seed]);

  return (
    <group>
      {panicles.map((pan, pi) => (
        <group key={pi} position={pan.pos}>
          {Array.from({ length: pan.count }, (_, fi) => {
            const rng2 = seededRandom(pi * 100 + fi);
            const fx = (rng2() - 0.5) * 0.25;
            const fy = rng2() * 0.3 - 0.15;
            const fz = (rng2() - 0.5) * 0.25;
            return (
              <mesh key={fi} position={[fx, fy, fz]}>
                <sphereGeometry args={[0.018 + rng2() * 0.012, 4, 4]} />
                <meshStandardMaterial
                  color={`hsl(${65 + rng2() * 15}, ${50 + rng2() * 20}%, ${65 + rng2() * 15}%)`}
                  roughness={0.6}
                />
              </mesh>
            );
          })}
          {/* Panicle stem */}
          <mesh rotation={[0, 0, Math.PI / 2 + 0.2]}>
            <cylinderGeometry args={[0.006, 0.01, 0.3, 4]} />
            <meshStandardMaterial color="#6b8a3a" roughness={0.8} />
          </mesh>
        </group>
      ))}
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
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5 + seed) * 0.02;
    }
  });

  const fruits = useMemo(() => {
    const rng = seededRandom(seed + 300);
    return fruitPositions.map((pos) => ({
      pos: [pos[0], pos[1] - 0.12 - rng() * 0.15, pos[2]] as Vec3,
      rot: [rng() * 0.3, rng() * Math.PI * 2, Math.PI + rng() * 0.4] as [number, number, number],
      scale: [
        0.1 + rng() * 0.04,
        0.14 + rng() * 0.05,
        0.09 + rng() * 0.03,
      ] as [number, number, number],
      ripeness: rng(),
    }));
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.map((fruit, i) => {
        const r = fruit.ripeness;
        const color = new THREE.Color();
        if (r < 0.5) {
          color.lerpColors(new THREE.Color('#3a7d2a'), new THREE.Color('#c4b52a'), r * 2);
        } else {
          color.lerpColors(new THREE.Color('#c4b52a'), new THREE.Color('#e8872a'), (r - 0.5) * 2);
        }

        return (
          <group key={i} position={fruit.pos} rotation={fruit.rot}>
            {/* Mango body */}
            <mesh castShadow scale={fruit.scale}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial
                color={color}
                roughness={0.35}
                metalness={0.02}
              />
            </mesh>

            {/* Stem */}
            <mesh position={[0, fruit.scale[1] * 0.9, 0]}>
              <cylinderGeometry args={[0.006, 0.01, 0.07, 4]} />
              <meshStandardMaterial color="#5a4a30" roughness={0.9} />
            </mesh>

            {/* Blush spot */}
            {fruit.ripeness > 0.4 && (
              <mesh
                position={[fruit.scale[0] * 0.4, fruit.scale[1] * 0.2, 0]}
                scale={[fruit.scale[0] * 0.6, fruit.scale[1] * 0.5, fruit.scale[2] * 0.5]}
              >
                <sphereGeometry args={[1, 8, 8]} />
                <meshStandardMaterial
                  color="#d44a20"
                  transparent
                  opacity={0.15 + fruit.ripeness * 0.15}
                  roughness={0.4}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** Root buttresses at trunk base */
function TrunkRoots({ seed = 0 }: { seed?: number }) {
  const barkTex = getBarkTexture('#3a2e20');

  const rootTransforms = useMemo(() => {
    const rng = seededRandom(seed + 500);
    const arr = [];
    const count = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.5;
      const length = 0.4 + rng() * 0.3;
      const thickness = 0.06 + rng() * 0.04;
      const start: Vec3 = [0, 0.06, 0];
      const end: Vec3 = [Math.cos(angle) * length, -0.04, Math.sin(angle) * length];
      const transform = computeCylinderTransform(start, end);
      arr.push({ ...transform, thickness });
    }
    return arr;
  }, [seed]);

  return (
    <group>
      {rootTransforms.map((rt, i) => (
        <mesh key={i} position={rt.position} quaternion={rt.quaternion} castShadow>
          <cylinderGeometry args={[rt.thickness * 0.3, rt.thickness, rt.length, 5]} />
          <meshStandardMaterial map={barkTex} color="#3a2e20" roughness={0.98} />
        </mesh>
      ))}
    </group>
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
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[trunkRadiusBottom, trunkRadiusBottom * 1.4, 0.3, 10]} />
        <meshStandardMaterial map={barkTex} color="#3a2a1a" roughness={0.98} />
      </mesh>

      {/* ── Root buttresses ── */}
      <TrunkRoots seed={seed} />

      {/* ── Branches + canopy ── */}
      <group ref={canopyRef}>
        {/* Connected branch segments */}
        <BranchRenderer branches={treeData.branches} barkColor="#4a3828" />

        {/* Leaf clusters at branch tips */}
        {treeData.leafTipPositions.map((pos, i) => (
          <MangoLeafCluster key={i} position={pos} size={0.7 + (i % 4) * 0.12} />
        ))}

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
