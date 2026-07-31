import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PRODUCTS, type FruitType } from '../../lib/products';
import { getTerrainHeight } from '../../lib/terrain';

// ── GLOBAL SHARED GEOMETRIES & MATERIALS ─────────────────────────────
// Sharing geometries across all trees drastically reduces memory and draw call overhead
const trunkGeo = new THREE.CylinderGeometry(1, 1.4, 1, 7);
trunkGeo.translate(0, 0.5, 0); // Origin at base for easy scaling
const canopyGeo = new THREE.IcosahedronGeometry(1, 1); // Low-poly stylized look
const fruitGeo = new THREE.SphereGeometry(1, 8, 8); // Simple fruit geometry

const trunkMat = new THREE.MeshStandardMaterial({ 
  color: '#4a3828', 
  roughness: 0.9, 
  flatShading: true 
});

const fruitMats: Record<string, THREE.MeshStandardMaterial> = {};

// ─────────────────────────────────────────────────────────────────────

interface FruitTreeProps {
  type: FruitType;
  x: number;
  z: number;
}

export default function FruitTree({ type, x, z }: FruitTreeProps) {
  const product = PRODUCTS[type];
  const groundY = getTerrainHeight(x, z);
  const canopyRef = useRef<THREE.Mesh>(null);

  // Initialize fruit material once per color
  if (!fruitMats[product.fruitColor]) {
    fruitMats[product.fruitColor] = new THREE.MeshStandardMaterial({
      color: product.fruitColor,
      roughness: 0.4,
    });
  }

  // Generate deterministic low-poly tree properties based on position
  const { height, canopySize, fruits, seed, canopyColor } = useMemo(() => {
    // Simple hash for deterministic randomness
    const seedVal = Math.floor(Math.abs(x * 73 + z * 137) % 1000);
    const rng = seedVal / 1000;
    
    let h = 2.0 + rng * 1.5;
    let s = 1.6 + rng * 0.6;
    
    if (type === 'papaya') { h = 4.0; s = 1.0; }
    if (type === 'guava') { h = 2.2; s = 1.5; }
    if (type === 'lemon') { h = 1.8; s = 1.3; }
    
    // Generate fruit positions
    const fCount = 4 + Math.floor(rng * 5);
    const fArr = [];
    for(let i = 0; i < fCount; i++) {
       const angle = (i / fCount) * Math.PI * 2 + rng;
       const radius = s * 0.8;
       const fx = Math.cos(angle) * radius;
       const fz = Math.sin(angle) * radius;
       let fy = h + s * 0.1 + Math.sin(i * seedVal) * 0.6;
       
       if (type === 'papaya') {
          // Papayas cluster directly on the upper trunk under the canopy
          fy = h - 0.2;
          fArr.push([Math.cos(angle) * 0.4, fy + (i % 2) * 0.3, Math.sin(angle) * 0.4]);
       } else {
          fArr.push([fx, fy, fz]);
       }
    }
    
    return {
       height: h,
       canopySize: s,
       fruits: fArr,
       seed: seedVal,
       canopyColor: new THREE.Color(product.canopyColor).offsetHSL(0, 0, (rng - 0.5) * 0.1)
    };
  }, [x, z, type, product]);

  // Gentle idle sway animation for the canopy to keep the world feeling alive
  useFrame(({ clock }) => {
    if (canopyRef.current) {
      const t = clock.getElapsedTime();
      canopyRef.current.rotation.z = Math.sin(t * 0.5 + seed) * 0.02;
      canopyRef.current.rotation.x = Math.cos(t * 0.4 + seed) * 0.02;
    }
  });

  return (
    <group position={[x, groundY, z]}>
      {/* ── Trunk ── */}
      <mesh 
        geometry={trunkGeo} 
        material={trunkMat} 
        scale={[0.25, height, 0.25]} 
        castShadow 
        receiveShadow 
      />
      
      {/* ── Canopy ── */}
      <mesh 
        ref={canopyRef}
        geometry={canopyGeo} 
        position={[0, height + canopySize * 0.2, 0]} 
        scale={[canopySize, canopySize * 0.85, canopySize]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={canopyColor} roughness={0.8} flatShading={true} />
      </mesh>
      
      {/* ── Fruits ── */}
      <group>
        {fruits.map((fPos, i) => (
          <mesh 
            key={i} 
            geometry={fruitGeo} 
            material={fruitMats[product.fruitColor]}
            position={fPos as any} 
            scale={type === 'papaya' ? 0.2 : 0.12} 
            castShadow 
          />
        ))}
      </group>
    </group>
  );
}
