import { getTerrainHeight } from '../../lib/terrain';

// Solar panel cluster
function SolarPanel({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <group position={[x, y, z]}>
      {/* Post */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 1.8, 6]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Panel */}
      <mesh position={[0, 1.1, 0]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[1.4, 0.05, 0.9]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.6} roughness={0.3}
          emissive="#1e3a8a" emissiveIntensity={0.2} />
      </mesh>
      {/* Panel grid lines */}
      <mesh position={[0, 1.11, 0]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[1.42, 0.01, 0.46]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// Irrigation pipe segment
function IrrigationPipe({ x1, z1, x2, z2 }: { x1: number; z1: number; x2: number; z2: number }) {
  const mx = (x1 + x2) / 2;
  const mz = (z1 + z2) / 2;
  const y = getTerrainHeight(mx, mz) + 0.15;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  return (
    <mesh position={[mx, y, mz]} rotation={[0, angle, Math.PI / 2]}>
      <cylinderGeometry args={[0.06, 0.06, len, 6]} />
      <meshStandardMaterial color="#0ea5e9" metalness={0.5} roughness={0.4} />
    </mesh>
  );
}

// Irrigation drip nozzle
function Nozzle({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z) + 0.3;
  return (
    <group position={[x, y, z]}>
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
      {/* Water droplet */}
      <mesh position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// Zone sign board
function SignBoard({ x, z, label }: { x: number; z: number; label: string }) {
  const y = getTerrainHeight(x, z) + 2.5;
  return (
    <group position={[x, y, z]}>
      {/* Post */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      {/* Board */}
      <mesh>
        <boxGeometry args={[1.8, 0.55, 0.08]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
    </group>
  );
}

export default function ModernElements() {
  return (
    <group>
      {/* Solar panel farm — flat eastern area */}
      <SolarPanel x={45} z={-45} />
      <SolarPanel x={48} z={-45} />
      <SolarPanel x={51} z={-45} />
      <SolarPanel x={45} z={-42} />
      <SolarPanel x={48} z={-42} />

      {/* Irrigation network around guava zone */}
      <IrrigationPipe x1={50} z1={-15} x2={75} z2={-15} />
      <IrrigationPipe x1={62} z1={-25} x2={62} z2={35} />
      <Nozzle x={55} z={-20} />
      <Nozzle x={62} z={5} />
      <Nozzle x={68} z={25} />

      {/* Zone signs */}
      <SignBoard x={62} z={0} label="🍈 Guava Zone" />
      <SignBoard x={5} z={-68} label="🥭 Mango Grove" />
      <SignBoard x={-62} z={20} label="🍒 Jujube" />

      {/* Small weather station */}
      <group position={[0, getTerrainHeight(0, -30), -30]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 3, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Antenna */}
        <mesh position={[0.25, 2.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}
