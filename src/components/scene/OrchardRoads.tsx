import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../../lib/terrain';
import { useOrchardStore } from '../../store/useOrchardStore';
import { getTimeConfig } from '../../lib/timeOfDay';

// Winding "Snake" Road Waypoints traversing through all fruit groves in an S-curve path
const SNAKE_ROAD_PATH_1: [number, number][] = [
  [0, -85],
  [25, -75],
  [-30, -55],
  [20, -35],
  [-15, -15],
  [0, 0],
  [-25, 20],
  [30, 35],
  [65, 15],
  [70, -20],
  [45, -50],
];

const SNAKE_ROAD_PATH_2: [number, number][] = [
  [0, 0],
  [35, -5],
  [60, -15],
  [75, 15],
  [50, 50],
  [10, 75],
  [-35, 65],
  [-65, 25],
  [-60, -25],
  [-35, -60],
];

function buildSnakeRoadGeometry(
  controlPoints: [number, number][],
  width = 4.4
): {
  roadGeo: THREE.BufferGeometry;
  curbGeo: THREE.BufferGeometry;
  stripeGeo: THREE.BufferGeometry;
  lampPositions: { x: number; z: number; rotY: number }[];
} {
  // Convert 2D waypoints to 3D CatmullRom curve
  const points3D = controlPoints.map(([x, z]) => new THREE.Vector3(x, getTerrainHeight(x, z), z));
  const curve = new THREE.CatmullRomCurve3(points3D, false, 'centripetal', 0.5);

  const numSamples = controlPoints.length * 28;
  const curvePoints = curve.getSpacedPoints(numSamples);

  const roadVertices: number[] = [];
  const roadNormals: number[] = [];
  const roadIndices: number[] = [];

  const curbVertices: number[] = [];
  const curbIndices: number[] = [];

  const stripeVertices: number[] = [];
  const stripeIndices: number[] = [];

  const lampPositions: { x: number; z: number; rotY: number }[] = [];

  const halfW = width / 2;
  const curbW = 0.35;
  const stripeW = 0.16;

  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i];
    // Get tangent direction
    const t = i / (curvePoints.length - 1);
    const tangent = curve.getTangentAt(Math.min(0.999, Math.max(0.001, t))).normalize();

    // Perpendicular horizontal normal vector
    const normX = -tangent.z;
    const normZ = tangent.x;

    // Road surface left & right
    const lx = pt.x + normX * halfW;
    const lz = pt.z + normZ * halfW;
    const rx = pt.x - normX * halfW;
    const rz = pt.z - normZ * halfW;

    // Y heights elevated slightly (+0.14) above terrain to prevent clipping
    const ly = getTerrainHeight(lx, lz) + 0.14;
    const ry = getTerrainHeight(rx, rz) + 0.14;

    roadVertices.push(lx, ly, lz, rx, ry, rz);
    roadNormals.push(0, 1, 0, 0, 1, 0);

    if (i < curvePoints.length - 1) {
      const b = i * 2;
      roadIndices.push(b, b + 1, b + 2);
      roadIndices.push(b + 1, b + 3, b + 2);
    }

    // Outer Curbs (slightly higher +0.18)
    const clx = pt.x + normX * (halfW + curbW);
    const clz = pt.z + normZ * (halfW + curbW);
    const crx = pt.x - normX * (halfW + curbW);
    const crz = pt.z - normZ * (halfW + curbW);
    const cly = getTerrainHeight(clx, clz) + 0.18;
    const cry = getTerrainHeight(crx, crz) + 0.18;

    const cBase = curbVertices.length / 3;
    curbVertices.push(lx, ly + 0.02, lz, clx, cly, clz, rx, ry + 0.02, rz, crx, cry, crz);

    if (i < curvePoints.length - 1) {
      curbIndices.push(cBase, cBase + 1, cBase + 4);
      curbIndices.push(cBase + 1, cBase + 5, cBase + 4);

      curbIndices.push(cBase + 2, cBase + 6, cBase + 3);
      curbIndices.push(cBase + 3, cBase + 6, cBase + 7);
    }

    // Dashed centerlines (3 steps on, 2 steps off)
    if (i % 5 < 3) {
      const slx = pt.x + normX * stripeW;
      const slz = pt.z + normZ * stripeW;
      const srx = pt.x - normX * stripeW;
      const srz = pt.z - normZ * stripeW;
      const sly = getTerrainHeight(slx, slz) + 0.17;
      const sry = getTerrainHeight(srx, srz) + 0.17;

      const sBase = stripeVertices.length / 3;
      stripeVertices.push(slx, sly, slz, srx, sry, srz);

      if (i % 5 < 2 && i < curvePoints.length - 1) {
        stripeIndices.push(sBase, sBase + 1, sBase + 2);
        stripeIndices.push(sBase + 1, sBase + 3, sBase + 2);
      }
    }

    // Street lamp placements along the snake road edge every ~14 steps
    if (i % 14 === 4 && i > 3 && i < curvePoints.length - 4) {
      const side = (i / 14) % 2 === 0 ? 1 : -1;
      const lampX = pt.x + normX * (halfW + 1.8) * side;
      const lampZ = pt.z + normZ * (halfW + 1.8) * side;
      const rotY = Math.atan2(tangent.x, tangent.z) + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
      lampPositions.push({ x: lampX, z: lampZ, rotY });
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setIndex(roadIndices);

  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVertices, 3));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const stripeGeo = new THREE.BufferGeometry();
  stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute(stripeVertices, 3));
  stripeGeo.setIndex(stripeIndices);
  stripeGeo.computeVertexNormals();

  return { roadGeo, curbGeo, stripeGeo, lampPositions };
}

// Single Street Lamp component
export function StreetLamp({ x, z, rotationY = 0 }: { x: number; z: number; rotationY?: number }) {
  const timeMode = useOrchardStore((s) => s.timeMode);
  const { isNight } = getTimeConfig(timeMode);

  const groundY = getTerrainHeight(x, z);

  return (
    <group position={[x, groundY, z]} rotation={[0, rotationY, 0]}>
      {/* Base flange */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.2, 8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main vertical post */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 4.4, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Curved lamp arm */}
      <mesh position={[0.45, 4.35, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.06, 0.06, 1.0, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Modern Lamp Fixture Head */}
      <mesh position={[0.8, 4.45, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.32]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Emissive Lamp Glass Lens */}
      <mesh position={[0.8, 4.37, 0]}>
        <boxGeometry args={[0.42, 0.04, 0.26]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isNight ? '#fef08a' : '#64748b'}
          emissiveIntensity={isNight ? 6 : 0.2}
        />
      </mesh>

      {/* Street Lamp Illumination */}
      {isNight && (
        <>
          <pointLight
            position={[0.8, 4.1, 0]}
            color="#fef08a"
            intensity={7}
            distance={20}
            decay={1.8}
          />
          {/* Soft circular ground light pool under lamp */}
          <mesh position={[0.8, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[5.0, 24]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.15} />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function OrchardRoads() {
  const road1 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_1, 4.4), []);
  const road2 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_2, 4.4), []);

  return (
    <group>
      {/* ── Central Plaza Roundabout ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[3.0, 8.0, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.75}
          polygonOffset
          polygonOffsetFactor={-10}
          polygonOffsetUnits={-10}
        />
      </mesh>
      {/* Central Island Yellow Safety Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <ringGeometry args={[2.8, 3.2, 32]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>

      {/* ── Snake Road 1 (S-Curve Highway) ── */}
      {/* Asphalt Surface */}
      <mesh receiveShadow geometry={road1.roadGeo}>
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.75}
          metalness={0.15}
          polygonOffset
          polygonOffsetFactor={-8}
          polygonOffsetUnits={-8}
        />
      </mesh>
      {/* Side Curbs */}
      <mesh geometry={road1.curbGeo}>
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Centerline Stripes */}
      <mesh geometry={road1.stripeGeo}>
        <meshBasicMaterial color="#facc15" />
      </mesh>

      {/* ── Snake Road 2 (Loop Highway) ── */}
      {/* Asphalt Surface */}
      <mesh receiveShadow geometry={road2.roadGeo}>
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.75}
          metalness={0.15}
          polygonOffset
          polygonOffsetFactor={-8}
          polygonOffsetUnits={-8}
        />
      </mesh>
      {/* Side Curbs */}
      <mesh geometry={road2.curbGeo}>
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Centerline Stripes */}
      <mesh geometry={road2.stripeGeo}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* ── Street Lamps Along Snake Roads ── */}
      {road1.lampPositions.map((lamp, i) => (
        <StreetLamp key={`lamp1-${i}`} x={lamp.x} z={lamp.z} rotationY={lamp.rotY} />
      ))}
      {road2.lampPositions.map((lamp, i) => (
        <StreetLamp key={`lamp2-${i}`} x={lamp.x} z={lamp.z} rotationY={lamp.rotY} />
      ))}
    </group>
  );
}
