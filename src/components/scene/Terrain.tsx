import { RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import * as THREE from 'three';
import { TERRAIN_SEGMENTS, TERRAIN_SIZE, getTerrainHeight } from '../../lib/terrain';

export default function Terrain() {
  const S = TERRAIN_SIZE;

  // Generate the rolling hills geometry dynamically using our noise function
  const hillsGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(S, S, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    geo.rotateX(-Math.PI / 2); // align plane with the ground plane (XZ)

    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);
    }

    geo.computeVertexNormals(); // update light reflections for smooth 3D curves
    return geo;
  }, [S]);

  return (
    <group>
      {/* ── Main rolling hills (physics trimesh + visual mesh) ── */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh receiveShadow geometry={hillsGeometry}>
          <meshStandardMaterial
            color="#3a7d44"
            roughness={0.72}
            metalness={0.1}
            flatShading={false}
          />
        </mesh>
      </RigidBody>

      {/* ── Boundary wall slabs (solid, invisible physics boundaries) ── */}
      {/* North */}
      <RigidBody type="fixed">
        <mesh position={[0, 15, -S / 2 - 0.5]}>
          <boxGeometry args={[S + 2, 40, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      {/* South */}
      <RigidBody type="fixed">
        <mesh position={[0, 15, S / 2 + 0.5]}>
          <boxGeometry args={[S + 2, 40, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      {/* West */}
      <RigidBody type="fixed">
        <mesh position={[-S / 2 - 0.5, 15, 0]}>
          <boxGeometry args={[1, 40, S + 2]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      {/* East */}
      <RigidBody type="fixed">
        <mesh position={[S / 2 + 0.5, 15, 0]}>
          <boxGeometry args={[1, 40, S + 2]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

    </group>
  );
}
