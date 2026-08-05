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
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.2, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* ── GROUND FLOOR ── */}
      {/* Carport Open Space (Left): x = -6 to 0 */}
      {/* Left Pillar */}
      <mesh position={[-5.8, 1.85, -1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 3.5, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* Living Space (Right): x = 0 to 6 */}
      <mesh position={[3, 1.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 3.5, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
      {/* Front Glass Door / Window for Living Space */}
      <mesh position={[3, 1.85, 4.01]}>
        <boxGeometry args={[5, 3.0, 0.05]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Ground Floor Planter Box */}
      <mesh position={[3, 0.3, 4.5]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.4, 0.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>
      {/* Plants in Planter */}
      {[1.5, 2.5, 3.5, 4.5].map((px) => (
        <mesh key={`plant-${px}`} position={[px, 0.6, 4.5]} castShadow>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#a855f7" roughness={0.8} /> {/* Purple flowers */}
        </mesh>
      ))}

      {/* ── FIRST FLOOR (SECOND STORY) ── */}
      {/* Slab / Carport Ceiling (Cantilever) */}
      <mesh position={[0, 3.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.3, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* Left Balcony Space (Over Carport): x = -6 to 0 */}
      {/* Balcony Back Wall (Glass Doors) */}
      <mesh position={[-3, 5.65, 0]}>
        <boxGeometry args={[6, 3.4, 0.05]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Balcony Ceiling Accent (Wood) */}
      <mesh position={[-3, 7.34, 2]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.05, 4]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      {/* Balcony Right Wall (Wood Accent) */}
      <mesh position={[-0.1, 5.65, 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3.4, 4]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      {/* Glass Railing */}
      <mesh position={[-3, 4.4, 3.9]} castShadow>
        <boxGeometry args={[6, 1.2, 0.05]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.4} roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Railing Handrail (Black) */}
      <mesh position={[-3, 5.0, 3.9]}>
        <boxGeometry args={[6, 0.05, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      
      {/* Second Story Main Room (Right): x = 0 to 6 */}
      <mesh position={[3, 5.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 3.4, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
      {/* Second Story Front Glass Window */}
      <mesh position={[3, 5.65, 4.01]}>
        <boxGeometry args={[5, 3.0, 0.05]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Side Louvers Accent (Right side of window) */}
      {[5.0, 5.5, 6.0, 6.5].map((ly) => (
        <mesh key={`louver-${ly}`} position={[5.8, ly, 4.2]} castShadow>
          <boxGeometry args={[0.8, 0.05, 0.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
      ))}

      {/* ── FLAT CEILING / ROOF BASE ── */}
      <mesh position={[0, 7.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.2, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* ── SLOPED SOLAR ROOF ── */}
      {/* Mounted on top of the flat structure, sloping up towards the back */}
      <group position={[0, 8.2, -1]} rotation={[Math.PI / 12, 0, 0]}>
        {/* Support structure */}
        <mesh position={[0, -0.1, 0]} castShadow>
           <boxGeometry args={[12.5, 0.2, 9]} />
           <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.7} />
        </mesh>
        {/* Solar Panels (Glossy Dark Blue) */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[12, 0.05, 8.5]} />
          <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Grid lines simulating photovoltaic cells */}
        <mesh position={[0, 0.076, 0]}>
          <planeGeometry args={[12, 8.5]} />
          <meshStandardMaterial color="#38bdf8" wireframe />
        </mesh>
      </group>

      {/* ── SOLAR BATTERY STORAGE ── */}
      <group position={[-5.8, 1.5, 1]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 1.8, 1.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* LED Indicator */}
        <mesh position={[-0.11, 0.6, 0]}>
          <boxGeometry args={[0.02, 0.4, 0.05]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* ── OFF-GRID LIGHTING SYSTEM ── */}
      {/* Modern Wall Sconce - Carport */}
      <group position={[-5.6, 2.0, 1.8]}>
        <mesh>
          <boxGeometry args={[0.1, 0.4, 0.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.06, 0, 0]}>
          <planeGeometry args={[0.01, 0.3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffedd5" emissiveIntensity={isNight ? 4 : 0.2} />
        </mesh>
        {isNight && <pointLight color="#ffedd5" intensity={2} distance={8} decay={2} position={[0.2, 0, 0]} />}
      </group>

      {/* Modern Wall Sconce - Balcony */}
      <group position={[-0.2, 5.5, 1.8]}>
        <mesh>
          <boxGeometry args={[0.1, 0.4, 0.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.06, 0, 0]}>
          <planeGeometry args={[0.01, 0.3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffedd5" emissiveIntensity={isNight ? 4 : 0.2} />
        </mesh>
        {isNight && <pointLight color="#ffedd5" intensity={2} distance={8} decay={2} position={[-0.2, 0, 0]} />}
      </group>

      {/* Interior ambient light - Ground Floor */}
      {isNight && <pointLight color="#fed7aa" intensity={4} distance={20} position={[3, 2.25, 2]} />}
      
      {/* Interior ambient light - Second Floor */}
      {isNight && <pointLight color="#fed7aa" intensity={4} distance={20} position={[3, 5.65, 2]} />}
      {/* Interior ambient light - Balcony Room */}
      {isNight && <pointLight color="#fed7aa" intensity={2} distance={15} position={[-3, 5.65, -2]} />}

      {/* ── PHYSICS COLLIDERS ── */}
      <RigidBody type="fixed" colliders={false}>
        {/* Main Building Base (Right side) */}
        <CuboidCollider args={[3.2, 2, 4]} position={[3, 2, 0]} />
        {/* Carport Pillar */}
        <CuboidCollider args={[0.5, 2, 3]} position={[-5.8, 2, -1]} />
      </RigidBody>
    </group>
  );
}
