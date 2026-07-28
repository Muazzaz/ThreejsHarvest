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
  const roadElevation = 0.06; // Realistic road elevation sitting flush on ground
  const lineHalfW = 0.08; // 0.16m wide painted line
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

    // ── 2. Solid White Center Divider Line (Glued flat to asphalt at +0.003m) ──
    const cy = getTerrainHeight(pt.x, pt.z) + roadElevation + 0.003;
    const cBase = centerVerts.length / 3;
    centerVerts.push(
      pt.x + normX * lineHalfW, cy, pt.z + normZ * lineHalfW,
      pt.x - normX * lineHalfW, cy, pt.z - normZ * lineHalfW
    );

    if (i < curvePoints.length - 1) {
      const c0 = cBase;
      const c1 = cBase + 1;
      const c2 = cBase + 2;
      const c3 = cBase + 3;

      // UP-facing winding order
      centerIndices.push(c0, c2, c1);
      centerIndices.push(c1, c2, c3);
    }

    // ── 3. Solid White Outer Edge Lines (Glued flat to asphalt at +0.003m) ──
    const el_outX = pt.x + normX * (halfW - 0.30);
    const el_outZ = pt.z + normZ * (halfW - 0.30);
    const el_inX  = pt.x + normX * (halfW - 0.14);
    const el_inZ  = pt.z + normZ * (halfW - 0.14);

    const er_inX  = pt.x - normX * (halfW - 0.14);
    const er_inZ  = pt.z - normZ * (halfW - 0.14);
    const er_outX = pt.x - normX * (halfW - 0.30);
    const er_outZ = pt.z - normZ * (halfW - 0.30);

    const ely = getTerrainHeight(pt.x, pt.z) + roadElevation + 0.003;

    const eBase = edgeVerts.length / 3;
    edgeVerts.push(
      el_outX, ely, el_outZ, // e0 (left outer)
      el_inX,  ely, el_inZ,  // e1 (left inner)
      er_inX,  ely, er_inZ,  // e2 (right inner)
      er_outX, ely, er_outZ  // e3 (right outer)
    );

    if (i < curvePoints.length - 1) {
      const e0 = eBase;
      const e1 = eBase + 1;
      const e2 = eBase + 2;
      const e3 = eBase + 3;
      const e4 = eBase + 4;
      const e5 = eBase + 5;
      const e6 = eBase + 6;
      const e7 = eBase + 7;

      // Left edge line quad (UP-facing)
      edgeIndices.push(e0, e4, e1);
      edgeIndices.push(e1, e4, e5);
      // Right edge line quad (UP-facing)
      edgeIndices.push(e2, e6, e3);
      edgeIndices.push(e3, e6, e7);
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

    const cly = getTerrainHeight(clx, clz) + roadElevation + 0.02;
    const cry = getTerrainHeight(crx, crz) + roadElevation + 0.02;

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
    if (i % 52 === 12 && distFromCenter > 15.0) {
      const side = (i / 52) % 2 === 0 ? 1 : -1;
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
      {/* Base Tier 1 */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.2, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Base Tier 2 */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 0.4, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main vertical post */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 4.0, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Post Top Cap */}
      <mesh position={[0, 4.6, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Diagonal arm */}
      <mesh position={[0.176, 4.776, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Joint */}
      <mesh position={[0.353, 4.953, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Horizontal arm */}
      <mesh position={[0.853, 4.953, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.06, 1.0, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Lamp Head Fixture - Sleek & Modern */}
      <mesh position={[1.053, 4.953, 0]}>
        <boxGeometry args={[0.7, 0.08, 0.3]} />
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.15} />
      </mesh>
      
      {/* Lamp Head Top Ridge */}
      <mesh position={[1.053, 5.013, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.15]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Emissive Lamp Glass */}
      <mesh position={[1.053, 4.903, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isNight ? '#ffedd5' : '#64748b'}
          emissiveIntensity={isNight ? 2.5 : 0.2}
        />
      </mesh>

      {/* Street Light Illumination */}
      {isNight && (
        <pointLight
          position={[1.053, 4.7, 0]}
          color="#ffedd5"
          intensity={25.0}
          distance={60}
          decay={1.8}
        />
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
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      {/* Roundabout Center Grass Island Curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.21, 0]}>
        <ringGeometry args={[3.2, 3.5, 48]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Center Island Outer White Divider Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.205, 0]}>
        <ringGeometry args={[3.5, 3.66, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-6}
          polygonOffsetUnits={-6}
        />
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
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      {/* White Center Divider Line (2-Lane Road Divider) */}
      <mesh geometry={road1.centerlineGeo}>
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-6}
          polygonOffsetUnits={-6}
        />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road1.edgelineGeo}>
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-6}
          polygonOffsetUnits={-6}
        />
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
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      {/* White Center Divider Line (2-Lane Road Divider) */}
      <mesh geometry={road2.centerlineGeo}>
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-6}
          polygonOffsetUnits={-6}
        />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road2.edgelineGeo}>
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-6}
          polygonOffsetUnits={-6}
        />
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
