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
// Lemon Tree — compact, evergreen citrus with glossy
// narrow leaves, white flowers, and bright lemons.
// ─────────────────────────────────────────────────────

const BARK_COLOR = '#5a4a2a';

/** Glossy narrow citrus leaf cluster at branch tip */
function LemonLeafCluster({ position, size = 1.0 }: { position: Vec3; size?: number }) {
  const leafTex = getLeafTexture('#1a5a18', 'rgba(140, 220, 100, 0.3)', '#2a7a28', 'narrow');
  const leaves = useMemo(() => {
    const rng = seededRandom(
      Math.floor(position[0] * 1000 + position[1] * 100 + position[2] * 10),
    );
    const count = 7 + Math.floor(rng() * 5);
    const arr: { pos: Vec3; rot: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const tilt = rng() * 0.4 - 0.2;
      const spread = 0.06 + rng() * 0.16 * size;
      arr.push({
        pos: [
          Math.cos(angle) * spread,
          (rng() - 0.35) * 0.14 * size,
          Math.sin(angle) * spread,
        ],
        rot: [tilt, angle + rng() * 0.5, rng() * 0.25],
        scale: (0.18 + rng() * 0.14) * size,
      });
    }
    return arr;
  }, [position, size]);

  return (
    <group position={position}>
      {leaves.map((leaf, i) => (
        <mesh key={i} position={leaf.pos} rotation={leaf.rot} scale={leaf.scale} castShadow>
          <planeGeometry args={[0.3, 0.6]} />
          <meshStandardMaterial
            map={leafTex}
            color="#2a7a22"
            roughness={0.35}
            metalness={0.06}
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
          <mesh key={i} position={t.position} quaternion={t.quaternion} castShadow>
            <cylinderGeometry args={[b.radiusEnd, b.radiusStart, t.length, 6]} />
            <meshStandardMaterial
              map={barkTex}
              normalMap={barkNorm}
              color={BARK_COLOR}
              roughness={0.92}
              metalness={0.0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** White 5-petaled citrus flowers at some branch tips */
function LemonFlowers({ positions, seed }: { positions: Vec3[]; seed: number }) {
  const flowers = useMemo(() => {
    const rng = seededRandom(seed + 250);
    // Only some positions get flowers
    return positions.filter(() => rng() > 0.55).map((pos) => ({
      pos,
      scale: 0.022 + rng() * 0.012,
    }));
  }, [positions, seed]);

  return (
    <group>
      {flowers.map((flower, i) => (
        <group key={i} position={flower.pos}>
          {Array.from({ length: 5 }, (_, pi) => {
            const pAngle = (pi / 5) * Math.PI * 2;
            return (
              <mesh
                key={pi}
                position={[
                  Math.cos(pAngle) * flower.scale * 0.7,
                  0,
                  Math.sin(pAngle) * flower.scale * 0.7,
                ]}
                rotation={[0.3, pAngle, 0]}
                scale={flower.scale}
              >
                <planeGeometry args={[0.8, 1.2]} />
                <meshStandardMaterial
                  color="#fffde8"
                  roughness={0.4}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            );
          })}
          <mesh scale={flower.scale * 0.4}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshStandardMaterial color="#e8c820" roughness={0.5} />
          </mesh>
        </group>
      ))}
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

  const fruits = useMemo(() => {
    const rng = seededRandom(seed + 450);
    return fruitPositions.map((pos) => ({
      pos: [pos[0], pos[1] - 0.08 - rng() * 0.1, pos[2]] as Vec3,
      rot: [rng() * 0.3 - 0.15, rng() * Math.PI * 2, rng() * 0.3] as [number, number, number],
      scaleX: 0.055 + rng() * 0.02,
      scaleY: 0.075 + rng() * 0.025,
      ripeness: rng(),
    }));
  }, [fruitPositions, seed]);

  return (
    <group ref={groupRef}>
      {fruits.map((fruit, i) => {
        const r = fruit.ripeness;
        const color = new THREE.Color();
        if (r < 0.5) {
          color.lerpColors(new THREE.Color('#4a8a2a'), new THREE.Color('#b4c830'), r * 2);
        } else {
          color.lerpColors(new THREE.Color('#b4c830'), new THREE.Color('#fde047'), (r - 0.5) * 2);
        }

        return (
          <group key={i} position={fruit.pos} rotation={fruit.rot}>
            {/* Lemon body */}
            <mesh castShadow scale={[fruit.scaleX, fruit.scaleY, fruit.scaleX]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color={color} roughness={0.4} metalness={0.02} />
            </mesh>
            {/* Nipple tip */}
            <mesh
              position={[0, -fruit.scaleY * 0.85, 0]}
              scale={[fruit.scaleX * 0.35, fruit.scaleY * 0.25, fruit.scaleX * 0.35]}
            >
              <sphereGeometry args={[1, 6, 4]} />
              <meshStandardMaterial color={color} roughness={0.45} />
            </mesh>
            {/* Stem connecting to branch */}
            <mesh position={[0, fruit.scaleY * 0.9, 0]}>
              <cylinderGeometry args={[0.005, 0.008, 0.06, 4]} />
              <meshStandardMaterial color="#5a6a30" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
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
          <meshStandardMaterial map={barkTex} color="#4a3a1a" roughness={0.98} />
        </mesh>
      ))}
    </group>
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
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[trunkRadiusBottom, trunkRadiusBottom * 1.25, 0.2, 8]} />
        <meshStandardMaterial map={barkTex} color="#4a3a1a" roughness={0.95} />
      </mesh>

      {/* ── Roots ── */}
      <LemonRoots seed={seed} />

      {/* ── Connected branches + leaves + flowers + fruits ── */}
      <group ref={canopyRef}>
        <BranchRenderer branches={treeData.branches} />

        {/* Leaf clusters at branch tips */}
        {treeData.leafTipPositions.map((pos, i) => (
          <LemonLeafCluster key={i} position={pos} size={0.55 + (i % 3) * 0.12} />
        ))}

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
