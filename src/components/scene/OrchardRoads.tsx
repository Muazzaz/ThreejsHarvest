import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../../lib/terrain';
import { useOrchardStore } from '../../store/useOrchardStore';
import { getTimeConfig } from '../../lib/timeOfDay';

// Continuous 2-lane Highway Loop Waypoints traversing all fruit groves in seamless circuits
const SNAKE_ROAD_PATH_1: [number, number][] = [
  [0, 0],
  [25, -20],
  [50, -35],
  [65, -60],
  [35, -80],
  [0, -85],
  [-35, -78],
  [-55, -55],
  [-40, -30],
  [-18, -12],
];

const SNAKE_ROAD_PATH_2: [number, number][] = [
  [0, 0],
  [25, 18],
  [55, 30],
  [75, 55],
  [45, 80],
  [0, 85],
  [-45, 78],
  [-70, 45],
  [-65, 10],
  [-40, -10],
];

interface RoadMeshGroup {
  roadGeo: THREE.BufferGeometry;       // Pitch asphalt surface across full road width
  centerlineGeo: THREE.BufferGeometry; // Solid white center divider line (2-lane road divider matching ref image)
  edgelineGeo: THREE.BufferGeometry;   // Solid white outer boundary lines
  curbGeo: THREE.BufferGeometry;       // Outer concrete shoulder curbs
  lampPositions: { x: number; z: number; rotY: number }[];
}

function buildSnakeRoadGeometry(
  controlPoints: [number, number][],
  width = 5.2
): RoadMeshGroup {
  // 1. Create CatmullRomCurve3 (closed loop for endless circuit)
  const points3D = controlPoints.map(([x, z]) => new THREE.Vector3(x, getTerrainHeight(x, z), z));
  const curve = new THREE.CatmullRomCurve3(points3D, true, 'centripetal', 0.5);

  const totalLen = curve.getLength();
  const numSamples = Math.max(260, Math.floor(totalLen * 3.0));
  const curvePoints = curve.getSpacedPoints(numSamples);

  // Buffer arrays
  const roadVerts: number[] = [];
  const roadNorms: number[] = [];
  const roadIndices: number[] = [];

  const centerVerts: number[] = [];
  const centerIndices: number[] = [];

  const edgeVerts: number[] = [];
  const edgeIndices: number[] = [];

  const curbVerts: number[] = [];
  const curbIndices: number[] = [];

  const lampPositions: { x: number; z: number; rotY: number }[] = [];

  const halfW = width / 2; // 2.6m half-width for 2-lane road
  const curbW = 0.35;
  const roadElevation = 0.35; // Elevated high enough above grass terrain to prevent any clipping
  const lineHalfW = 0.08; // 0.16m wide painted lines
  const WIDTH_STEPS = 4; // 4 sub-strips (5 vertices across width) to hug terrain curves across road

  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i];
    const u = i / (curvePoints.length - 1);
    const tangent = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u))).normalize();

    // Perpendicular vector across road width
    const normX = -tangent.z;
    const normZ = tangent.x;

    // ── 1. Pitch Asphalt Surface (Subdivided across width into 5 vertices) ──
    const stepBaseIndex = (roadVerts.length / 3);
    for (let s = 0; s <= WIDTH_STEPS; s++) {
      const offset = -halfW + (s / WIDTH_STEPS) * (2 * halfW);
      const vx = pt.x + normX * offset;
      const vz = pt.z + normZ * offset;
      const vy = getTerrainHeight(vx, vz) + roadElevation;

      roadVerts.push(vx, vy, vz);
      roadNorms.push(0, 1, 0);
    }

    if (i < curvePoints.length - 1) {
      const vertsPerStep = WIDTH_STEPS + 1;
      const rowA = stepBaseIndex;
      const rowB = stepBaseIndex + vertsPerStep;

      for (let s = 0; s < WIDTH_STEPS; s++) {
        const v0 = rowA + s;
        const v1 = rowA + s + 1;
        const v2 = rowB + s;
        const v3 = rowB + s + 1;

        roadIndices.push(v0, v1, v2);
        roadIndices.push(v1, v3, v2);
      }
    }

    // ── 2. Solid White Center Divider Line (Painted down middle at +0.03m above asphalt) ──
    const cy = getTerrainHeight(pt.x, pt.z) + roadElevation + 0.03;
    const cBase = centerVerts.length / 3;
    centerVerts.push(
      pt.x + normX * lineHalfW, cy, pt.z + normZ * lineHalfW,
      pt.x - normX * lineHalfW, cy, pt.z - normZ * lineHalfW
    );

    if (i < curvePoints.length - 1) {
      centerIndices.push(cBase, cBase + 1, cBase + 2);
      centerIndices.push(cBase + 1, cBase + 3, cBase + 2);
    }

    // ── 3. Solid White Outer Edge Lines ──
    const elx = pt.x + normX * (halfW - 0.3);
    const elz = pt.z + normZ * (halfW - 0.3);
    const erx = pt.x - normX * (halfW - 0.3);
    const erz = pt.z - normZ * (halfW - 0.3);

    const ely = getTerrainHeight(elx, elz) + roadElevation + 0.03;
    const ery = getTerrainHeight(erx, erz) + roadElevation + 0.03;

    const eBase = edgeVerts.length / 3;
    edgeVerts.push(
      elx - normX * lineHalfW, ely, elz - normZ * lineHalfW,
      elx + normX * lineHalfW, ely, elz + normZ * lineHalfW,
      erx - normX * lineHalfW, ery, erz - normZ * lineHalfW,
      erx + normX * lineHalfW, ery, erz + normZ * lineHalfW
    );

    if (i < curvePoints.length - 1) {
      // Left edge line quad
      edgeIndices.push(eBase, eBase + 1, eBase + 4);
      edgeIndices.push(eBase + 1, eBase + 5, eBase + 4);
      // Right edge line quad
      edgeIndices.push(eBase + 2, eBase + 3, eBase + 6);
      edgeIndices.push(eBase + 3, eBase + 7, eBase + 6);
    }

    // ── 4. Outer Concrete Shoulders / Curbs ──
    const lx = pt.x + normX * halfW;
    const lz = pt.z + normZ * halfW;
    const rx = pt.x - normX * halfW;
    const rz = pt.z - normZ * halfW;

    const ly = getTerrainHeight(lx, lz) + roadElevation;
    const ry = getTerrainHeight(rx, rz) + roadElevation;

    const clx = pt.x + normX * (halfW + curbW);
    const clz = pt.z + normZ * (halfW + curbW);
    const crx = pt.x - normX * (halfW + curbW);
    const crz = pt.z - normZ * (halfW + curbW);

    const cly = getTerrainHeight(clx, clz) + roadElevation + 0.04;
    const cry = getTerrainHeight(crx, crz) + roadElevation + 0.04;

    const curbBase = curbVerts.length / 3;
    curbVerts.push(lx, ly, lz, clx, cly, clz, rx, ry, rz, crx, cry, crz);

    if (i < curvePoints.length - 1) {
      curbIndices.push(curbBase, curbBase + 1, curbBase + 4);
      curbIndices.push(curbBase + 1, curbBase + 5, curbBase + 4);

      curbIndices.push(curbBase + 2, curbBase + 6, curbBase + 3);
      curbIndices.push(curbBase + 3, curbBase + 6, curbBase + 7);
    }

    // ── 5. Street Lamp Placements ──
    const distFromCenter = Math.sqrt(pt.x * pt.x + pt.z * pt.z);
    if (i % 18 === 6 && distFromCenter > 10.0) {
      const side = (i / 18) % 2 === 0 ? 1 : -1;
      const lampX = pt.x + normX * (halfW + 1.8) * side;
      const lampZ = pt.z + normZ * (halfW + 1.8) * side;
      const rotY = Math.atan2(tangent.x, tangent.z) + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
      lampPositions.push({ x: lampX, z: lampZ, rotY });
    }
  }

  // Create BufferGeometries
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
  roadGeo.setIndex(roadIndices);

  const centerlineGeo = new THREE.BufferGeometry();
  centerlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(centerVerts, 3));
  centerlineGeo.setIndex(centerIndices);
  centerlineGeo.computeVertexNormals();

  const edgelineGeo = new THREE.BufferGeometry();
  edgelineGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
  edgelineGeo.setIndex(edgeIndices);
  edgelineGeo.computeVertexNormals();

  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  return { roadGeo, centerlineGeo, edgelineGeo, curbGeo, lampPositions };
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
  const road1 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_1, 5.2), []);
  const road2 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_2, 5.2), []);

  return (
    <group>
      {/* ── Central Pitch Roundabout Plaza ── */}
      {/* Pitch Asphalt Driving Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.20, 0]}>
        <ringGeometry args={[3.5, 9.0, 48]} />
        <meshStandardMaterial
          color="#121318"
          roughness={0.88}
          metalness={0.05}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
      {/* Roundabout Center Grass Island Curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]}>
        <ringGeometry args={[3.2, 3.5, 48]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Center Island Outer White Divider Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.225, 0]}>
        <ringGeometry args={[3.5, 3.66, 48]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* Roundabout Outer Concrete Curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]}>
        <ringGeometry args={[8.9, 9.4, 48]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>

      {/* ── Snake Road 1 (Continuous Pitch Asphalt 2-Lane Highway) ── */}
      {/* Pitch Asphalt Surface */}
      <mesh receiveShadow geometry={road1.roadGeo}>
        <meshStandardMaterial
          color="#121318"
          roughness={0.88}
          metalness={0.05}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
      {/* White Center Divider Line (2-Lane Road Divider) */}
      <mesh geometry={road1.centerlineGeo}>
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road1.edgelineGeo}>
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* Outer Concrete Curbs */}
      <mesh geometry={road1.curbGeo}>
        <meshStandardMaterial color="#334155" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Snake Road 2 (Continuous Pitch Asphalt 2-Lane Highway) ── */}
      {/* Pitch Asphalt Surface */}
      <mesh receiveShadow geometry={road2.roadGeo}>
        <meshStandardMaterial
          color="#121318"
          roughness={0.88}
          metalness={0.05}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
      {/* White Center Divider Line (2-Lane Road Divider) */}
      <mesh geometry={road2.centerlineGeo}>
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road2.edgelineGeo}>
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* Outer Concrete Curbs */}
      <mesh geometry={road2.curbGeo}>
        <meshStandardMaterial color="#334155" roughness={0.6} side={THREE.DoubleSide} />
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
