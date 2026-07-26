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
  roadGeo: THREE.BufferGeometry;        // Pitch asphalt for both left & right lanes
  dividerGeo: THREE.BufferGeometry;     // Raised concrete median divider (NON-pitch color)
  dividerLineGeo: THREE.BufferGeometry; // Yellow safety line stripes along median edges
  barrierGeo: THREE.BufferGeometry;     // Central guardrail / Jersey barrier along middle of divider
  curbGeo: THREE.BufferGeometry;        // Outer concrete shoulders / curbs
  edgelineGeo: THREE.BufferGeometry;    // White outer edge lines
  lampPositions: { x: number; z: number; rotY: number }[];
}

function buildSnakeRoadGeometry(
  controlPoints: [number, number][],
  laneWidth = 2.6,
  dividerWidth = 0.8
): RoadMeshGroup {
  // 1. Create CatmullRomCurve3
  const points3D = controlPoints.map(([x, z]) => new THREE.Vector3(x, getTerrainHeight(x, z), z));
  const curve = new THREE.CatmullRomCurve3(points3D, false, 'centripetal', 0.5);

  const totalLen = curve.getLength();
  const numSamples = Math.max(140, Math.floor(totalLen * 2.0));
  const curvePoints = curve.getSpacedPoints(numSamples);

  // Buffer arrays
  const roadVerts: number[] = [];
  const roadNorms: number[] = [];
  const roadIndices: number[] = [];

  const dividerVerts: number[] = [];
  const dividerNorms: number[] = [];
  const dividerIndices: number[] = [];

  const divLineVerts: number[] = [];
  const divLineIndices: number[] = [];

  const barrierVerts: number[] = [];
  const barrierNorms: number[] = [];
  const barrierIndices: number[] = [];

  const curbVerts: number[] = [];
  const curbIndices: number[] = [];

  const edgeVerts: number[] = [];
  const edgeIndices: number[] = [];

  const lampPositions: { x: number; z: number; rotY: number }[] = [];

  const dHalf = dividerWidth / 2; // 0.4m from center
  const outerDist = dHalf + laneWidth; // 3.0m from center
  const curbW = 0.45;
  const roadElevation = 0.22; // Height of pitch lanes above grass
  const dividerH = 0.14; // Height of central divider above pitch road (0.36m total)
  const barrierH = 0.42; // Guardrail height above divider top (0.78m total)

  for (let i = 0; i < curvePoints.length; i++) {
    const pt = curvePoints[i];
    const u = i / (curvePoints.length - 1);
    const tangent = curve.getTangentAt(Math.min(0.999, Math.max(0.001, u))).normalize();

    // Perpendicular vector across road width
    const normX = -tangent.z;
    const normZ = tangent.x;

    // ── Key Offsets Across Road ──
    // Left Lane outer / inner
    const L_outX = pt.x + normX * outerDist;
    const L_outZ = pt.z + normZ * outerDist;
    const L_inX = pt.x + normX * dHalf;
    const L_inZ = pt.z + normZ * dHalf;

    // Right Lane inner / outer
    const R_inX = pt.x - normX * dHalf;
    const R_inZ = pt.z - normZ * dHalf;
    const R_outX = pt.x - normX * outerDist;
    const R_outZ = pt.z - normZ * outerDist;

    // Pitch lane surface heights
    const yL_out = getTerrainHeight(L_outX, L_outZ) + roadElevation;
    const yL_in = getTerrainHeight(L_inX, L_inZ) + roadElevation;
    const yR_in = getTerrainHeight(R_inX, R_inZ) + roadElevation;
    const yR_out = getTerrainHeight(R_outX, R_outZ) + roadElevation;

    // ── 1. Pitch Asphalt Surface (Left Lane & Right Lane) ──
    const rBase = roadVerts.length / 3;
    // Vertices: [L_out, L_in, R_in, R_out]
    roadVerts.push(
      L_outX, yL_out, L_outZ,
      L_inX, yL_in, L_inZ,
      R_inX, yR_in, R_inZ,
      R_outX, yR_out, R_outZ
    );
    roadNorms.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);

    if (i < curvePoints.length - 1) {
      // Left Lane Quad
      roadIndices.push(rBase, rBase + 1, rBase + 4);
      roadIndices.push(rBase + 1, rBase + 5, rBase + 4);

      // Right Lane Quad
      roadIndices.push(rBase + 2, rBase + 3, rBase + 6);
      roadIndices.push(rBase + 3, rBase + 7, rBase + 6);
    }

    // ── 2. Raised Central Median Divider (NON-pitch Concrete) ──
    // Top of divider sits elevated above road surface
    const yDivL = yL_in + dividerH;
    const yDivR = yR_in + dividerH;

    const divBase = dividerVerts.length / 3;
    // Vertices for Median Cross-section:
    // 0: Road left bottom (L_inX, yL_in, L_inZ)
    // 1: Median top left  (L_inX, yDivL, L_inZ)
    // 2: Median top right (R_inX, yDivR, R_inZ)
    // 3: Road right bottom(R_inX, yR_in, R_inZ)
    dividerVerts.push(
      L_inX, yL_in, L_inZ,
      L_inX, yDivL, L_inZ,
      R_inX, yDivR, R_inZ,
      R_inX, yR_in, R_inZ
    );
    // Normals (approximate for top and sides)
    dividerNorms.push(
      normX, 0.4, normZ,
      0, 1, 0,
      0, 1, 0,
      -normX, 0.4, -normZ
    );

    if (i < curvePoints.length - 1) {
      const d0 = divBase;
      const d1 = divBase + 4;

      // Left curb vertical face (L_in road up to median top)
      dividerIndices.push(d0, d0 + 1, d1);
      dividerIndices.push(d0 + 1, d1 + 1, d1);

      // Median top horizontal surface
      dividerIndices.push(d0 + 1, d0 + 2, d1 + 1);
      dividerIndices.push(d0 + 2, d1 + 2, d1 + 1);

      // Right curb vertical face (median top down to R_in road)
      dividerIndices.push(d0 + 2, d0 + 3, d1 + 2);
      dividerIndices.push(d0 + 3, d1 + 3, d1 + 2);
    }

    // ── 3. Yellow Safety Stripes along Divider Edges ──
    const stripeW = 0.08;
    const yDL = yDivL + 0.01;
    const yDR = yDivR + 0.01;
    const dlBase = divLineVerts.length / 3;

    divLineVerts.push(
      L_inX, yDL, L_inZ,
      L_inX - normX * stripeW, yDL, L_inZ - normZ * stripeW,
      R_inX + normX * stripeW, yDR, R_inZ + normZ * stripeW,
      R_inX, yDR, R_inZ
    );

    if (i < curvePoints.length - 1) {
      // Left median yellow line
      divLineIndices.push(dlBase, dlBase + 1, dlBase + 4);
      divLineIndices.push(dlBase + 1, dlBase + 5, dlBase + 4);
      // Right median yellow line
      divLineIndices.push(dlBase + 2, dlBase + 3, dlBase + 6);
      divLineIndices.push(dlBase + 3, dlBase + 7, dlBase + 6);
    }

    // ── 4. Central Guardrail / Barrier Wall along Centerline ──
    const bCapW = 0.12; // Barrier top width
    const yB_top = (yDivL + yDivR) / 2 + barrierH;
    const bBase = barrierVerts.length / 3;

    const bLX = pt.x + normX * bCapW;
    const bLZ = pt.z + normZ * bCapW;
    const bRX = pt.x - normX * bCapW;
    const bRZ = pt.z - normZ * bCapW;
    const yB_bot = (yDivL + yDivR) / 2;

    barrierVerts.push(
      bLX, yB_bot, bLZ,
      bLX, yB_top, bLZ,
      bRX, yB_top, bRZ,
      bRX, yB_bot, bRZ
    );
    barrierNorms.push(
      normX, 0, normZ,
      0, 1, 0,
      0, 1, 0,
      -normX, 0, -normZ
    );

    if (i < curvePoints.length - 1) {
      const b0 = bBase;
      const b1 = bBase + 4;
      // Barrier top surface
      barrierIndices.push(b0 + 1, b0 + 2, b1 + 1);
      barrierIndices.push(b0 + 2, b1 + 2, b1 + 1);
      // Barrier left face
      barrierIndices.push(b0, b0 + 1, b1);
      barrierIndices.push(b0 + 1, b1 + 1, b1);
      // Barrier right face
      barrierIndices.push(b0 + 2, b0 + 3, b1 + 2);
      barrierIndices.push(b0 + 3, b1 + 3, b1 + 2);
    }

    // ── 5. Outer Concrete Shoulders / Curbs ──
    const clx = pt.x + normX * (outerDist + curbW);
    const clz = pt.z + normZ * (outerDist + curbW);
    const crx = pt.x - normX * (outerDist + curbW);
    const crz = pt.z - normZ * (outerDist + curbW);

    const cly = getTerrainHeight(clx, clz) + roadElevation + 0.05;
    const cry = getTerrainHeight(crx, crz) + roadElevation + 0.05;

    const cBase = curbVerts.length / 3;
    curbVerts.push(
      L_outX, yL_out, L_outZ,
      clx, cly, clz,
      R_outX, yR_out, R_outZ,
      crx, cry, crz
    );

    if (i < curvePoints.length - 1) {
      curbIndices.push(cBase, cBase + 1, cBase + 4);
      curbIndices.push(cBase + 1, cBase + 5, cBase + 4);

      curbIndices.push(cBase + 2, cBase + 6, cBase + 3);
      curbIndices.push(cBase + 3, cBase + 6, cBase + 7);
    }

    // ── 6. White Outer Edge Lines ──
    const elx = pt.x + normX * (outerDist - 0.2);
    const elz = pt.z + normZ * (outerDist - 0.2);
    const erx = pt.x - normX * (outerDist - 0.2);
    const erz = pt.z - normZ * (outerDist - 0.2);

    const ely = yL_out + 0.02;
    const ery = yR_out + 0.02;

    const eW = 0.08;
    const eBase = edgeVerts.length / 3;

    edgeVerts.push(
      elx - normX * eW, ely, elz - normZ * eW,
      elx + normX * eW, ely, elz + normZ * eW,
      erx - normX * eW, ery, erz - normZ * eW,
      erx + normX * eW, ery, erz + normZ * eW
    );

    if (i < curvePoints.length - 1) {
      edgeIndices.push(eBase, eBase + 1, eBase + 4);
      edgeIndices.push(eBase + 1, eBase + 5, eBase + 4);

      edgeIndices.push(eBase + 2, eBase + 3, eBase + 6);
      edgeIndices.push(eBase + 3, eBase + 7, eBase + 6);
    }

    // ── 7. Street Lamp Placements ──
    if (i % 16 === 5 && i > 3 && i < curvePoints.length - 4) {
      const side = (i / 16) % 2 === 0 ? 1 : -1;
      const lampX = pt.x + normX * (outerDist + 1.8) * side;
      const lampZ = pt.z + normZ * (outerDist + 1.8) * side;
      const rotY = Math.atan2(tangent.x, tangent.z) + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
      lampPositions.push({ x: lampX, z: lampZ, rotY });
    }
  }

  // Create BufferGeometries
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
  roadGeo.setIndex(roadIndices);

  const dividerGeo = new THREE.BufferGeometry();
  dividerGeo.setAttribute('position', new THREE.Float32BufferAttribute(dividerVerts, 3));
  dividerGeo.setAttribute('normal', new THREE.Float32BufferAttribute(dividerNorms, 3));
  dividerGeo.setIndex(dividerIndices);
  dividerGeo.computeVertexNormals();

  const dividerLineGeo = new THREE.BufferGeometry();
  dividerLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(divLineVerts, 3));
  dividerLineGeo.setIndex(divLineIndices);
  dividerLineGeo.computeVertexNormals();

  const barrierGeo = new THREE.BufferGeometry();
  barrierGeo.setAttribute('position', new THREE.Float32BufferAttribute(barrierVerts, 3));
  barrierGeo.setAttribute('normal', new THREE.Float32BufferAttribute(barrierNorms, 3));
  barrierGeo.setIndex(barrierIndices);
  barrierGeo.computeVertexNormals();

  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVerts, 3));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const edgelineGeo = new THREE.BufferGeometry();
  edgelineGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
  edgelineGeo.setIndex(edgeIndices);
  edgelineGeo.computeVertexNormals();

  return { roadGeo, dividerGeo, dividerLineGeo, barrierGeo, curbGeo, edgelineGeo, lampPositions };
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
  const road1 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_1, 2.6, 0.8), []);
  const road2 = useMemo(() => buildSnakeRoadGeometry(SNAKE_ROAD_PATH_2, 2.6, 0.8), []);

  return (
    <group>
      {/* ── Central Roundabout Plaza ── */}
      {/* Outer Pitch Asphalt Driving Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}>
        <ringGeometry args={[4.2, 9.2, 36]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.88}
          polygonOffset
          polygonOffsetFactor={-12}
          polygonOffsetUnits={-12}
        />
      </mesh>
      {/* Non-Pitch Concrete Central Roundabout Median Island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <ringGeometry args={[1.5, 4.15, 36]} />
        <meshStandardMaterial color="#475569" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Roundabout Outer Concrete Curb */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.23, 0]}>
        <ringGeometry args={[9.1, 9.7, 36]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Central Island Yellow Safety Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.27, 0]}>
        <ringGeometry args={[3.95, 4.15, 36]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* ── Snake Road 1 (2-Lane Dual Carriageway Highway) ── */}
      {/* 2-Lane Dark Pitch Asphalt Surface (Left Lane & Right Lane) */}
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
      {/* Center Concrete Median Divider (NON-Pitch Color) */}
      <mesh geometry={road1.dividerGeo}>
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Median Edge Yellow Safety Stripes */}
      <mesh geometry={road1.dividerLineGeo}>
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* Central Guardrail / Barrier Along Divider */}
      <mesh geometry={road1.barrierGeo}>
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Outer Concrete Shoulders / Curbs */}
      <mesh geometry={road1.curbGeo}>
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road1.edgelineGeo}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* ── Snake Road 2 (2-Lane Dual Carriageway Highway) ── */}
      {/* 2-Lane Dark Pitch Asphalt Surface (Left Lane & Right Lane) */}
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
      {/* Center Concrete Median Divider (NON-Pitch Color) */}
      <mesh geometry={road2.dividerGeo}>
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Median Edge Yellow Safety Stripes */}
      <mesh geometry={road2.dividerLineGeo}>
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* Central Guardrail / Barrier Along Divider */}
      <mesh geometry={road2.barrierGeo}>
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Outer Concrete Shoulders / Curbs */}
      <mesh geometry={road2.curbGeo}>
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* White Outer Edge Lines */}
      <mesh geometry={road2.edgelineGeo}>
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
