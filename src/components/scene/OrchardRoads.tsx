import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../../lib/terrain';
import { useOrchardStore } from '../../store/useOrchardStore';
import { getTimeConfig } from '../../lib/timeOfDay';

// Snake Road Waypoints traversing all fruit groves in winding curves
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

interface RoadMeshGroup {
  roadGeo: THREE.BufferGeometry;
  curbGeo: THREE.BufferGeometry;
  centerlineGeo: THREE.BufferGeometry;
  edgelineGeo: THREE.BufferGeometry;
  lampPositions: { x: number; z: number; rotY: number }[];
}

function buildSnakeRoadGeometry(
  controlPoints: [number, number][],
  width = 4.8
): RoadMeshGroup {
  // 1. Create CatmullRomCurve3
  const points3D = controlPoints.map(([x, z]) => new THREE.Vector3(x, getTerrainHeight(x, z), z));
  const curve = new THREE.CatmullRomCurve3(points3D, false, 'centripetal', 0.5);

  const totalLen = curve.getLength();
  const numSamples = Math.max(120, Math.floor(totalLen * 1.8));
  const curvePoints = curve.getSpacedPoints(numSamples);

  // Buffer arrays
  const roadVerts: number[] = [];
  const roadNorms: number[] = [];
  const roadIndices: number[] = [];

  const curbVerts: number[] = [];
  const curbIndices: number[] = [];

  const edgeVerts: number[] = [];
  const edgeIndices: number[] = [];

  const lampPositions: { x: number; z: number; rotY: number }[] = [];

  const halfW = width / 2;
  const curbW = 0.45;
  const roadElevation = 0.22; // Elevated pitch road height above grass

  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i];
    const u = i / (curvePoints.length - 1);
    const tangent = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u))).normalize();

    // Perpendicular vector
    const normX = -tangent.z;
    const normZ = tangent.x;

    // Pitch road edges
    const lx = pt.x + normX * halfW;
    const lz = pt.z + normZ * halfW;
    const rx = pt.x - normX * halfW;
    const rz = pt.z - normZ * halfW;

    const ly = getTerrainHeight(lx, lz) + roadElevation;
    const ry = getTerrainHeight(rx, rz) + roadElevation;

    roadVerts.push(lx, ly, lz, rx, ry, rz);
    roadNorms.push(0, 1, 0, 0, 1, 0);

    if (i < curvePoints.length - 1) {
      const b = i * 2;
      roadIndices.push(b, b + 1, b + 2);
      roadIndices.push(b + 1, b + 3, b + 2);
    }

    // Outer curbs / concrete shoulders
    const clx = pt.x + normX * (halfW + curbW);
    const clz = pt.z + normZ * (halfW + curbW);
    const crx = pt.x - normX * (halfW + curbW);
    const crz = pt.z - normZ * (halfW + curbW);

    const cly = getTerrainHeight(clx, clz) + roadElevation + 0.05;
    const cry = getTerrainHeight(crx, crz) + roadElevation + 0.05;

    const cBase = curbVerts.length / 3;
    curbVerts.push(lx, ly, lz, clx, cly, clz, rx, ry, rz, crx, cry, crz);

    if (i < curvePoints.length - 1) {
      curbIndices.push(cBase, cBase + 1, cBase + 4);
      curbIndices.push(cBase + 1, cBase + 5, cBase + 4);

      curbIndices.push(cBase + 2, cBase + 6, cBase + 3);
      curbIndices.push(cBase + 3, cBase + 6, cBase + 7);
    }

    // White Edge Lines (continuous lines 0.15m inside road edges)
    const elx = pt.x + normX * (halfW - 0.25);
    const elz = pt.z + normZ * (halfW - 0.25);
    const erx = pt.x - normX * (halfW - 0.25);
    const erz = pt.z - normZ * (halfW - 0.25);

    const ely = getTerrainHeight(elx, elz) + roadElevation + 0.02;
    const ery = getTerrainHeight(erx, erz) + roadElevation + 0.02;

    const eW = 0.08;
    const eBase = edgeVerts.length / 3;

    edgeVerts.push(
      elx - normX * eW, ely, elz - normZ * eW,
      elx + normX * eW, ely, elz + normZ * eW,
      erx - normX * eW, ery, erz - normZ * eW,
      erx + normX * eW, ery, erz + normZ * eW
    );

    if (i < curvePoints.length - 1) {
      // Left edge line quad
      edgeIndices.push(eBase, eBase + 1, eBase + 4);
      edgeIndices.push(eBase + 1, eBase + 5, eBase + 4);
      // Right edge line quad
      edgeIndices.push(eBase + 2, eBase + 3, eBase + 6);
      edgeIndices.push(eBase + 3, eBase + 7, eBase + 6);
    }

    // Street lamp placements along road edges every ~16 steps
    if (i % 16 === 5 && i > 3 && i < curvePoints.length - 4) {
      const side = (i / 16) % 2 === 0 ? 1 : -1;
      const lampX = pt.x + normX * (halfW + 1.8) * side;
      const lampZ = pt.z + normZ * (halfW + 1.8) * side;
      const rotY = Math.atan2(tangent.x, tangent.z) + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
      lampPositions.push({ x: lampX, z: lampZ, rotY });
    }
  }

  // Build Dashed Centerline Quads
  const dashVerts: number[] = [];
  const dashIndices: number[] = [];
  const dashLen = 2.8;
  const gapLen = 2.0;
  const dashCycle = dashLen + gapLen;
  const numDashes = Math.floor(totalLen / dashCycle);
  const stripeW = 0.12;

  for (let d = 0; d < numDashes; d++) {
    const distStart = d * dashCycle;
    const distEnd = distStart + dashLen;

    const uStart = Math.min(0.99, distStart / totalLen);
    const uEnd = Math.min(0.999, distEnd / totalLen);

    const ptStart = curve.getPointAt(uStart);
    const ptEnd = curve.getPointAt(uEnd);

    const tanStart = curve.getTangentAt(uStart).normalize();
    const tanEnd = curve.getTangentAt(uEnd).normalize();

    const nSx = -tanStart.z;
    const nSz = tanStart.x;
    const nEx = -tanEnd.z;
    const nEz = tanEnd.x;

    const yStart = getTerrainHeight(ptStart.x, ptStart.z) + roadElevation + 0.03;
    const yEnd = getTerrainHeight(ptEnd.x, ptEnd.z) + roadElevation + 0.03;

    const vBase = dashVerts.length / 3;

    // 4 corners of the dashed rectangle
    dashVerts.push(
      ptStart.x + nSx * stripeW, yStart, ptStart.z + nSz * stripeW,
      ptStart.x - nSx * stripeW, yStart, ptStart.z - nSz * stripeW,
      ptEnd.x + nEx * stripeW, yEnd, ptEnd.z + nEz * stripeW,
      ptEnd.x - nEx * stripeW, yEnd, ptEnd.z - nEz * stripeW
    );

    dashIndices.push(vBase, vBase + 1, vBase + 2);
    dashIndices.push(vBase + 1, vBase + 3, vBase + 2);
  }

  // Create BufferGeometries
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
  roadGeo.setIndex(roadIndices);

  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const edgelineGeo = new THREE.BufferGeometry();
  edgelineGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
  edgelineGeo.setIndex(edgeIndices);
  edgelineGeo.computeVertexNormals();

  const centerlineGeo = new THREE.BufferGeometry();
  centerlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(dashVerts, 3));
  centerlineGeo.setIndex(dashIndices);
  centerlineGeo.computeVertexNormals();

  return { roadGeo, curbGeo, centerlineGeo, edgelineGeo, lampPositions };
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
        <cylinderGeometry args={[0.3, 0.4, 0.2, 8]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main vertical post */}
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 4.6, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Curved arm */}
      <mesh position={[0.5, 4.5, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.07, 0.07, 1.1, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Lamp Head Fixture */}
      <mesh position={[0.9, 4.6, 0]}>
        <boxGeometry args={[0.55, 0.16, 0.35]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Emissive Lamp Glass */}
      <mesh position={[0.9, 4.51, 0]}>
        <boxGeometry args={[0.45, 0.04, 0.28]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isNight ? '#fef08a' : '#64748b'}
          emissiveIntensity={isNight ? 6 : 0.2}
        />
      </mesh>

      {/* Street Light Illumination */}
      {isNight && (
        <>
          <pointLight
            position={[0.9, 4.2, 0]}
            color="#fef08a"
            intensity={7.5}
            distance={22}
            decay={1.7}
          />
          {/* Soft ground illumination pool */}
          <mesh position={[0.9, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[5.5, 24]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.16} />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function OrchardRoads() {
  const road1 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_1, 4.8), []);
  const road2 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_2, 4.8), []);

  return (
    <group>
      {/* ── Central Pitch Roundabout Plaza ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}>
        <ringGeometry args={[3.0, 8.5, 36]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.88}
          polygonOffset
          polygonOffsetFactor={-12}
          polygonOffsetUnits={-12}
        />
      </mesh>
      {/* Roundabout Outer Concrete Curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.23, 0]}>
        <ringGeometry args={[8.4, 9.0, 36]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>
      {/* Central Island Yellow Safety Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <ringGeometry args={[2.7, 3.2, 36]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* ── Snake Road 1 (Pitch Asphalt Highway) ── */}
      {/* Dark Pitch Asphalt Surface */}
      <mesh receiveShadow geometry={road1.roadGeo}>
        <meshStandardMaterial
          color="#111827"
          roughness={0.88}
          metalness={0.08}
          polygonOffset
          polygonOffsetFactor={-12}
          polygonOffsetUnits={-12}
        />
      </mesh>
      {/* Concrete Shoulders / Curbs */}
      <mesh geometry={road1.curbGeo}>
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road1.edgelineGeo}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Yellow Dashed Centerline Markings */}
      <mesh geometry={road1.centerlineGeo}>
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* ── Snake Road 2 (Pitch Asphalt Loop Highway) ── */}
      {/* Dark Pitch Asphalt Surface */}
      <mesh receiveShadow geometry={road2.roadGeo}>
        <meshStandardMaterial
          color="#111827"
          roughness={0.88}
          metalness={0.08}
          polygonOffset
          polygonOffsetFactor={-12}
          polygonOffsetUnits={-12}
        />
      </mesh>
      {/* Concrete Shoulders / Curbs */}
      <mesh geometry={road2.curbGeo}>
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road2.edgelineGeo}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Yellow Dashed Centerline Markings */}
      <mesh geometry={road2.centerlineGeo}>
        <meshBasicMaterial color="#fbbf24" />
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
