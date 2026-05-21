import { RigidBody } from '@react-three/rapier';
import { TERRAIN_SIZE } from '../../lib/terrain';

// Ground is a solid 0.5m-thick box slab so Rapier auto-generates
// a perfect CuboidCollider with zero configuration needed.
// Top surface sits exactly at y = 0.

export default function Terrain() {
  const S = TERRAIN_SIZE;

  return (
    <group>
      {/* ── Main ground slab (physics + visual) ── */}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[S, 0.5, S]} />
          <meshLambertMaterial color="#3a7d44" />
        </mesh>
      </RigidBody>

      {/* ── Subtle grid overlay for depth / scale ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[S, S, 24, 24]} />
        <meshBasicMaterial color="#2d6935" wireframe transparent opacity={0.15} />
      </mesh>

      {/* ── Boundary wall slabs (solid, invisible) ── */}
      {/* North */}
      <RigidBody type="fixed">
        <mesh position={[0, 5, -S / 2 - 0.5]}>
          <boxGeometry args={[S + 2, 10, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      {/* South */}
      <RigidBody type="fixed">
        <mesh position={[0, 5, S / 2 + 0.5]}>
          <boxGeometry args={[S + 2, 10, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      {/* West */}
      <RigidBody type="fixed">
        <mesh position={[-S / 2 - 0.5, 5, 0]}>
          <boxGeometry args={[1, 10, S + 2]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      {/* East */}
      <RigidBody type="fixed">
        <mesh position={[S / 2 + 0.5, 5, 0]}>
          <boxGeometry args={[1, 10, S + 2]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

      {/* ── Decorative start pad ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[5, 32]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
