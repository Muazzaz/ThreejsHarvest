import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../../lib/terrain';
import { useOrchardStore } from '../../store/useOrchardStore';
import { getTimeConfig } from '../../lib/timeOfDay';

// Define road waypoints for the orchard street network
export const ROAD_PATH_MAIN: [number, number][] = [
  [0, -80],
  [0, -50],
  [2, -25],
  [0, 0],
  [-2, 25],
  [0, 50],
  [0, 80],
];

export const ROAD_PATH_EAST: [number, number][] = [
  [0, 0],
  [18, -4],
  [38, -10],
  [58, -15],
  [75, -15],
];

export const ROAD_PATH_WEST: [number, number][] = [
  [0, 0],
  [-20, 5],
  [-40, 10],
  [-60, 5],
  [-75, 5],
];

export const ROAD_PATH_NORTH_EAST: [number, number][] = [
  [0, -45],
  [15, -45],
  [35, -48],
  [50, -45],
];

// Helper to create terrain-conforming road geometry
function buildRoadGeometry(path: [number, number][], width = 3.6): {
  roadGeo: THREE.BufferGeometry;
  stripeGeo: THREE.BufferGeometry;
} {
  const sampledPoints: { pos: [number, number]; tangent: [number, number] }[] = [];
  const stepSize = 1.5;

  for (let i = 0; i < path.length - 1; i++) {
    const [x1, z1] = path[i];
    const [x2, z2] = path[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.max(1, Math.floor(dist / stepSize));
    const ux = dx / dist;
    const uz = dz / dist;

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const rx = x1 + dx * t;
      const rz = z1 + dz * t;
      sampledPoints.push({ pos: [rx, rz], tangent: [ux, uz] });
    }
  }
  // Add final point
  const last = path[path.length - 1];
  const secondLast = path[path.length - 2];
  const ldx = last[0] - secondLast[0];
  const ldz = last[1] - secondLast[1];
  const ldist = Math.sqrt(ldx * ldx + ldz * ldz) || 1;
  sampledPoints.push({ pos: last, tangent: [ldx / ldist, ldz / ldist] });

  // Build quads for road
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const stripeVertices: number[] = [];
  const stripeIndices: number[] = [];

  const halfW = width / 2;
  const stripeW = 0.18;

  sampledPoints.forEach((pt, idx) => {
    const [px, pz] = pt.pos;
    const [tx, tz] = pt.tangent;
    // Perpendicular vector
    const nx = -tz;
    const nz = tx;

    // Left & Right road edges
    const lx = px + nx * halfW;
    const lz = pz + nz * halfW;
    const rx = px - nx * halfW;
    const rz = pz - nz * halfW;

    const ly = getTerrainHeight(lx, lz) + 0.05;
    const ry = getTerrainHeight(rx, rz) + 0.05;

    vertices.push(lx, ly, lz, rx, ry, rz);
    uvs.push(0, idx * 0.2, 1, idx * 0.2);

    if (idx < sampledPoints.length - 1) {
      const base = idx * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }

    // Dashed centerlines (every 3 steps)
    if (idx % 3 < 2) {
      const slx = px + nx * stripeW;
      const slz = pz + nz * stripeW;
      const srx = px - nx * stripeW;
      const srz = pz - nz * stripeW;
      const sly = getTerrainHeight(slx, slz) + 0.07;
      const sry = getTerrainHeight(srx, srz) + 0.07;

      const sIdx = stripeVertices.length / 3;
      stripeVertices.push(slx, sly, slz, srx, sry, srz);
      if (idx % 3 === 0 && idx < sampledPoints.length - 1) {
        stripeIndices.push(sIdx, sIdx + 1, sIdx + 2);
        stripeIndices.push(sIdx + 1, sIdx + 3, sIdx + 2);
      }
    }
  });

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const stripeGeo = new THREE.BufferGeometry();
  stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute(stripeVertices, 3));
  stripeGeo.setIndex(stripeIndices);
  stripeGeo.computeVertexNormals();

  return { roadGeo, stripeGeo };
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
        <cylinderGeometry args={[0.25, 0.3, 0.2, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main post */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 4.0, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Arm bend at top */}
      <mesh position={[0.4, 4.15, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Lamp Head Fixture */}
      <mesh position={[0.7, 4.25, 0]}>
        <boxGeometry args={[0.45, 0.12, 0.3]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Emissive Lamp Glass / Bulb */}
      <mesh position={[0.7, 4.18, 0]}>
        <boxGeometry args={[0.38, 0.04, 0.24]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isNight ? '#fef08a' : '#94a3b8'}
          emissiveIntensity={isNight ? 5 : 0.2}
        />
      </mesh>

      {/* Street Light Illumination */}
      {isNight && (
        <>
          <pointLight
            position={[0.7, 4.0, 0]}
            color="#fef08a"
            intensity={6}
            distance={18}
            decay={1.8}
          />
          {/* Ground glow ring directly under street lamp */}
          <mesh position={[0.7, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[4.5, 24]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.12} />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function OrchardRoads() {
  const mainRoad = useMemo(() => buildRoadGeometry(ROAD_PATH_MAIN, 4.2), []);
  const eastRoad = useMemo(() => buildRoadGeometry(ROAD_PATH_EAST, 3.6), []);
  const westRoad = useMemo(() => buildRoadGeometry(ROAD_PATH_WEST, 3.6), []);
  const northEastRoad = useMemo(() => buildRoadGeometry(ROAD_PATH_NORTH_EAST, 3.4), []);

  // Street lamp placements along the streets
  const streetLamps = useMemo(() => {
    const lamps: { id: string; x: number; z: number; rot: number }[] = [];

    // Along Main Road (North-South)
    for (let z = -70; z <= 70; z += 22) {
      if (Math.abs(z) < 5) continue; // skip spawn plaza center
      const side = (z / 22) % 2 === 0 ? 1 : -1;
      lamps.push({
        id: `main-${z}`,
        x: side * 3.2,
        z,
        rot: side > 0 ? 0 : Math.PI,
      });
    }

    // Along East Road (toward Guava zone)
    [15, 35, 55, 70].forEach((x, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      lamps.push({
        id: `east-${x}`,
        x,
        z: -12 + side * 2.8,
        rot: side > 0 ? Math.PI / 2 : -Math.PI / 2,
      });
    });

    // Along West Road (toward Jujube zone)
    [-18, -38, -58, -72].forEach((x, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      lamps.push({
        id: `west-${x}`,
        x,
        z: 8 + side * 2.8,
        rot: side > 0 ? -Math.PI / 2 : Math.PI / 2,
      });
    });

    return lamps;
  }, []);

  return (
    <group>
      {/* Central Plaza Roundabout */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[3.2, 7.5, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Central Island border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[3.0, 3.4, 32]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      {/* Main Road Meshes */}
      <mesh receiveShadow geometry={mainRoad.roadGeo}>
        <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.1} />
      </mesh>
      <mesh geometry={mainRoad.stripeGeo}>
        <meshBasicMaterial color="#facc15" />
      </mesh>

      {/* East Branch Road */}
      <mesh receiveShadow geometry={eastRoad.roadGeo}>
        <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.1} />
      </mesh>
      <mesh geometry={eastRoad.stripeGeo}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* West Branch Road */}
      <mesh receiveShadow geometry={westRoad.roadGeo}>
        <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.1} />
      </mesh>
      <mesh geometry={westRoad.stripeGeo}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* North-East Branch Road */}
      <mesh receiveShadow geometry={northEastRoad.roadGeo}>
        <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.1} />
      </mesh>

      {/* Street Lamps Network */}
      {streetLamps.map((lamp) => (
        <StreetLamp key={lamp.id} x={lamp.x} z={lamp.z} rotationY={lamp.rot} />
      ))}
    </group>
  );
}
