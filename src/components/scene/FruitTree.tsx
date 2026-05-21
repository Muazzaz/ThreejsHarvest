/* eslint-disable react-hooks/purity */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PRODUCTS, type FruitType } from '../../lib/products';
import { getTerrainHeight } from '../../lib/terrain';

interface FruitTreeProps {
  type: FruitType;
  x: number;
  z: number;
}

function FruitParticles({ color, count = 8 }: { color: string; count?: number }) {
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.2 + Math.random() * 0.8;
      arr.push([Math.cos(angle) * r, -0.5 + Math.random() * 2, Math.sin(angle) * r]);
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={ref}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function FruitTree({ type, x, z }: FruitTreeProps) {
  const product = PRODUCTS[type];
  const groundY = getTerrainHeight(x, z);
  const isSpecial = product.special;

  // Randomise tree size slightly for natural look
  const scale = useMemo(() => 0.85 + Math.random() * 0.35, []);
  const trunkH = 2.2 * scale;
  const canopyR = isSpecial ? 2.8 * scale : 2.2 * scale;

  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glowRef.current && isSpecial) {
      const t = Math.sin(clock.getElapsedTime() * 1.2) * 0.5 + 0.5;
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + t * 0.5;
    }
  });

  return (
    <group position={[x, groundY, z]}>
      {/* Trunk */}
      <mesh castShadow position={[0, trunkH / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.28, trunkH, 7]} />
        <meshStandardMaterial color={product.trunkColor} roughness={0.95} />
      </mesh>

      {/* Canopy */}
      <mesh ref={isSpecial ? glowRef : undefined} castShadow position={[0, trunkH + canopyR * 0.65, 0]}>
        <icosahedronGeometry args={[canopyR, 1]} />
        <meshStandardMaterial
          color={product.canopyColor}
          roughness={0.8}
          emissive={isSpecial ? '#4ade80' : '#000000'}
          emissiveIntensity={isSpecial ? 0.4 : 0}
        />
      </mesh>

      {/* Second canopy layer for volume */}
      <mesh castShadow position={[0.6, trunkH + canopyR * 0.4, 0.3]}>
        <icosahedronGeometry args={[canopyR * 0.6, 1]} />
        <meshStandardMaterial color={product.canopyColor} roughness={0.9} />
      </mesh>

      {/* Fruit particles hanging from canopy */}
      <group position={[0, trunkH + canopyR * 0.5, 0]}>
        <FruitParticles color={product.fruitColor} count={isSpecial ? 12 : 8} />
      </group>

      {/* Special guava glow ring */}
      {isSpecial && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.8, 3.2, 32]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
