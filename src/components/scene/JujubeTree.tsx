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
// Jujube Tree (Boroi) — zig-zag branching, thorns,
// small oval leaves, compact crown with small red berries
// ─────────────────────────────────────────────────────

const BARK_COLOR = '#4a3520';

/** Small oval leaf cluster at a branch tip */
function JujubeLeafCluster({ position, size = 1.0 }: { position: Vec3; size?: number }) {
  const leafTex = getLeafTexture('#1a5520', 'rgba(90, 180, 90, 0.2)', '#2a7030', 'oval');
  const leaves = useMemo(() => {
    const rng = seededRandom(
      Math.floor(position[0] * 1000 + position[1] * 100 + position[2] * 10),
    );
    const count = 7 + Math.floor(rng() * 5);
    const arr: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const tilt = rng() * 0.6 - 0.3;
      const spread = 0.06 + rng() * 0.14 * size;
      arr.push({
        pos: [
          Math.cos(angle) * spread,
          (rng() - 0.35) * 0.12 * size,
          Math.sin(angle) * spread,
        ],
        rot: [tilt, angle + rng() * 0.5, rng() * 0.4],
        scale: (0.14 + rng() * 0.1) * size,
      });
    }
    return arr;
  }, [position, size]);

  return (
    <group position={position}>
      {leaves.map((leaf, i) => (
        <mesh key={i} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale}>
          <planeGeometry args={[0.35, 0.5]} />
          <meshStandardMaterial
            map={leafTex}
            color="#1e6620"
            roughness={0.55}
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

/** Renders connected branch segments */
function BranchRenderer({ branches }: { branches: BranchSegment[] }) {
  const barkTex = getBarkTexture(BARK_COLOR);
  const barkNorm = getBarkNormal();

  const transforms = useMemo(() => {
    return branches.map((b) => computeCylinderTransform(b.start, b.end));
  }, [branches]);

  return (
    <group>
      {branches.map((b, i) => {
        const t = transforms[i];
        return (
          <mesh key={i} position={t.position} quaternion={t.quaternion}>
            <cylinderGeometry args={[b.radiusEnd, b.radiusStart, t.length, 6]} />
            <meshStandardMaterial
              map={barkTex}
              normalMap={barkNorm}
              color={BARK_COLOR}
              roughness={0.95}
              metalness={0.0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Thorns along branches */
function JujubeThorns({ branches, seed }: { branches: BranchSegment[]; seed: number }) {
  const thorns = useMemo(() => {
    const rng = seededRandom(seed + 900);
    const arr: { pos: Vec3; rot: [number, number, number] }[] = [];
    // Place thorns along branch segments
    for (const b of branches) {
      const thornCount = 1 + Math.floor(rng() * 2);
      for (let t = 0; t < thornCount; t++) {
        if (rng() > 0.55) continue;
        const frac = 0.2 + rng() * 0.6;
        const pos: Vec3 = [
          b.start[0] + (b.end[0] - b.start[0]) * frac + (rng() - 0.5) * 0.03,
          b.start[1] + (b.end[1] - b.start[1]) * frac + (rng() - 0.5) * 0.03,
          b.start[2] + (b.end[2] - b.start[2]) * frac + (rng() - 0.5) * 0.03,
        ];
        arr.push({
          pos,
          rot: [rng() * Math.PI * 0.5, rng() * Math.PI * 2, rng() * Math.PI * 0.3],
        });
      }
    }
    return arr;
  }, [branches, seed]);

  return (
    <group>
      {thorns.map((thorn, i) => (
        <mesh key={i} position={thorn.pos} rotation={thorn.rot}>
          <coneGeometry args={[0.007, 0.04, 4]} />
          <meshStandardMaterial color="#6a5a3a" roughness={0.9} />
        </mesh>
      ))}
    </group>
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

  const fruits = useMemo(() => {
    const rng = seededRandom(seed + 700);
    return fruitPositions.map((pos) => ({
      pos: [pos[0], pos[1] - 0.06 - rng() * 0.08, pos[2]] as Vec3,
      scale: 0.035 + rng() * 0.02,
      ripeness: rng(),
    }));
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.map((fruit, i) => {
        const r = fruit.ripeness;
        const color = new THREE.Color();
        if (r < 0.3) {
          color.lerpColors(new THREE.Color('#4a8a2a'), new THREE.Color('#a4b044'), r * 3.3);
        } else if (r < 0.7) {
          color.lerpColors(new THREE.Color('#a4b044'), new THREE.Color('#c44a28'), (r - 0.3) * 2.5);
        } else {
          color.lerpColors(new THREE.Color('#c44a28'), new THREE.Color('#8a2020'), (r - 0.7) * 3.3);
        }

        return (
          <group key={i} position={fruit.pos}>
            <mesh scale={fruit.scale}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={color} roughness={0.35} metalness={0.02} />
            </mesh>
            {/* Tiny stem connecting to branch */}
            <mesh position={[0, fruit.scale * 0.9, 0]}>
              <cylinderGeometry args={[0.003, 0.005, 0.05, 3]} />
              <meshStandardMaterial color="#5a4a30" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
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
      const transform = computeCylinderTransform(start, end);
      arr.push({ ...transform, thickness });
    }
    return arr;
  }, [seed]);

  return (
    <group>
      {rootTransforms.map((rt, i) => (
        <mesh key={i} position={rt.position} quaternion={rt.quaternion}>
          <cylinderGeometry args={[rt.thickness * 0.3, rt.thickness, rt.length, 5]} />
          <meshStandardMaterial map={barkTex} color="#3a2e18" roughness={0.98} />
        </mesh>
      ))}
    </group>
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
        <BranchRenderer branches={treeData.branches} />
        <JujubeThorns branches={treeData.branches} seed={seed} />

        {/* Leaf clusters at branch tips */}
        {treeData.leafTipPositions.map((pos, i) => (
          <JujubeLeafCluster key={i} position={pos} size={0.5 + (i % 3) * 0.12} />
        ))}

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
