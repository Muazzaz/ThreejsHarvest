import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { getTerrainHeight } from '../../lib/terrain';

interface ModernHouseProps {
  x: number;
  z: number;
  rotationY?: number;
  isNight?: boolean;
}

export default function ModernHouse({ x, z, rotationY = 0, isNight = false }: ModernHouseProps) {
  const groundY = getTerrainHeight(x, z);

  return (
    <group position={[x, groundY, z]} rotation={[0, rotationY, 0]}>
      {/* ── Foundation (Concrete Base) ── */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 0.5, 9]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>

      {/* ── First Story (Exposed Concrete) ── */}
      <mesh position={[0, 2.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 3.5, 8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
      
      {/* First Story Large Glass Window */}
      <mesh position={[3, 2.25, 4.01]}>
        <boxGeometry args={[4, 2.8, 0.05]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* ── Second Story (Cantilevered Modern Concrete block) ── */}
      <mesh position={[1, 5.75, 1]} castShadow receiveShadow>
        <boxGeometry args={[9, 3.5, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>

      {/* Second Story Large Glass Window (Corner wrap-around feel) */}
      <mesh position={[2, 5.75, 5.01]}>
        <boxGeometry args={[5, 2.8, 0.05]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* ── Flat Modern Roof ── */}
      <mesh position={[1, 7.6, 1]} castShadow receiveShadow>
        <boxGeometry args={[9.5, 0.2, 8.5]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* ── Solar Panel Array on Roof ── */}
      <group position={[1, 8.2, 1]} rotation={[-Math.PI / 8, 0, 0]}>
        {/* Support structure */}
        <mesh position={[0, -0.15, 0]} castShadow>
           <boxGeometry args={[8.5, 0.1, 4]} />
           <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Actual Panels (Glossy Dark Blue) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[8, 0.05, 3.8]} />
          <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Grid lines simulating photovoltaic cells */}
        <mesh position={[0, 0.026, 0]}>
          <planeGeometry args={[8, 3.8]} />
          <meshStandardMaterial color="#1d4ed8" wireframe />
        </mesh>
      </group>

      {/* ── Solar Battery Storage (Powerwall Style) ── */}
      {/* Mounted on the left exterior wall of the first floor */}
      <group position={[-5.01, 1.5, 1]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 1.5, 1]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Battery Charge LED Indicator */}
        <mesh position={[-0.11, 0.5, 0]}>
          <boxGeometry args={[0.02, 0.4, 0.05]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* ── Off-Grid Lighting System ── */}
      {/* Solar-powered Warm LED Porch Light */}
      <group position={[3, 3.8, 4.2]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffedd5"
            emissiveIntensity={isNight ? 4 : 0.2}
          />
        </mesh>
        {isNight && (
          <pointLight color="#ffedd5" intensity={6} distance={15} decay={2} position={[0, -0.2, 0]} />
        )}
      </group>

      {/* Interior ambient light visible through the large glass window (1st Floor) */}
      {isNight && (
        <pointLight color="#fed7aa" intensity={5} distance={20} position={[3, 2.25, 2]} />
      )}
      
      {/* Interior ambient light visible through the large glass window (2nd Floor) */}
      {isNight && (
        <pointLight color="#fed7aa" intensity={5} distance={20} position={[2, 5.75, 3]} />
      )}

      {/* ── Physics Colliders ── */}
      {/* So the vehicle can't drive through the house */}
      <RigidBody type="fixed" colliders={false}>
        {/* Base Collider */}
        <CuboidCollider args={[5.5, 2, 4.5]} position={[0, 2, 0]} />
      </RigidBody>
    </group>
  );
}
