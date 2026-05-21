import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { getKeys } from '../../hooks/useVehicleControls';
import { useOrchardStore } from '../../store/useOrchardStore';
import { TREE_PLACEMENTS } from '../../lib/products';
import type { FruitType } from '../../lib/products';

const ACCEL          = 22;   // speed units per second forward
const BRAKE          = 36;   // braking deceleration per second
const REVERSE_ACCEL  = 12;   // reverse acceleration speed per second
const DECEL          = 14;   // passive coasting decay per second
const MAX_SPEED      = 11;   // max forward m/s
const MAX_REV_SPEED  = 4.5;  // max reverse m/s
const STEER_VEL      = 1.9;  // steer speed rad/s
const HARVEST_RADIUS = 14;

// Pre-allocated vectors — never create new ones in useFrame
const _forward = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camPos    = new THREE.Vector3();
const _quat      = new THREE.Quaternion();

export default function Vehicle() {
  const chassisRef = useRef<RapierRigidBody>(null);
  const meshRef    = useRef<THREE.Group>(null);
  const { setNearbyFruit, addToCart, setHarvestCooldown } = useOrchardStore();

  useFrame(({ camera }, delta) => {
    const body = chassisRef.current;
    if (!body) return;

    const keys = getKeys();
    const vel  = body.linvel();
    const pos  = body.translation();
    const rot  = body.rotation();  // needed for _quat

    _quat.set(rot.x, rot.y, rot.z, rot.w);
    // Forward direction is -Z in local space
    _forward.set(0, 0, -1).applyQuaternion(_quat);
    _forward.y = 0; // keep on horizontal plane
    _forward.normalize();

    // Current forward speed on the horizontal plane
    let currentFwdSpeed = _forward.x * vel.x + _forward.z * vel.z;

    // ── 1. ENGINE ACCELERATION AND BRAKING ─────────────────────────────────
    if (keys.forward) {
      // Accelerate forward
      currentFwdSpeed = Math.min(currentFwdSpeed + ACCEL * delta, MAX_SPEED);
    } else if (keys.backward) {
      if (currentFwdSpeed > 0.25) {
        // Brake hard (rapid deceleration toward 0)
        currentFwdSpeed = Math.max(currentFwdSpeed - BRAKE * delta, 0);
      } else {
        // Reverse gear
        currentFwdSpeed = Math.max(currentFwdSpeed - REVERSE_ACCEL * delta, -MAX_REV_SPEED);
      }
    } else {
      // Passive coasting friction to stop
      if (currentFwdSpeed > 0.1) {
        currentFwdSpeed = Math.max(currentFwdSpeed - DECEL * delta, 0);
      } else if (currentFwdSpeed < -0.1) {
        currentFwdSpeed = Math.min(currentFwdSpeed + DECEL * delta, 0);
      } else {
        currentFwdSpeed = 0;
      }
    }

    // Calculate final target velocity based on forward speed (perfect traction)
    const targetVelX = _forward.x * currentFwdSpeed;
    const targetVelZ = _forward.z * currentFwdSpeed;

    // Apply direct linear velocity (retaining gravity Y)
    body.setLinvel({ x: targetVelX, y: vel.y, z: targetVelZ }, true);

    // ── 2. STEERING — set angular velocity DIRECTLY (bypasses damping fight)
    {
      let yAngVel = 0;
      if (Math.abs(currentFwdSpeed) > 0.1) {
        const steerSign = currentFwdSpeed >= 0 ? 1 : -1; // flip steer direction when reversing
        if (keys.left)  yAngVel =  STEER_VEL * steerSign;
        if (keys.right) yAngVel = -STEER_VEL * steerSign;
      }
      body.setAngvel({ x: 0, y: yAngVel, z: 0 }, true);
    }

    // ── 7. SYNC VISUAL MESH ─────────────────────────────────────────────────
    if (meshRef.current) {
      meshRef.current.position.set(pos.x, pos.y, pos.z);
      meshRef.current.quaternion.copy(_quat);
    }

    // ── 8. SMOOTH CAMERA FOLLOW ─────────────────────────────────────────────
    _camTarget.set(pos.x, pos.y + 1.5, pos.z);
    _camPos.set(
      pos.x - _forward.x * 12,
      pos.y + 7,
      pos.z - _forward.z * 12
    );
    camera.position.lerp(_camPos, Math.min(delta * 5, 1));
    camera.lookAt(_camTarget);

    // ── 9. PROXIMITY DETECTION ──────────────────────────────────────────────
    let closestFruit: FruitType | null = null;
    let closestDist = HARVEST_RADIUS;
    for (const tree of TREE_PLACEMENTS) {
      const dx = pos.x - tree.x;
      const dz = pos.z - tree.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < closestDist) {
        closestDist = dist;
        closestFruit = tree.type;
      }
    }
    setNearbyFruit(closestFruit);

    // ── 10. HARVEST (Space) ─────────────────────────────────────────────────
    const isCooling = useOrchardStore.getState().harvestCooldown;
    if (keys.harvest && closestFruit && !isCooling) {
      keys.harvest = false;
      addToCart(closestFruit, 1);
      setHarvestCooldown(true);
      setTimeout(() => setHarvestCooldown(false), 1500);
    }
  });

  return (
    <>
      {/* ── Physics chassis ─────────────────────────────────────────────── */}
      <RigidBody
        ref={chassisRef}
        position={[0, 3, 0]}         // spawn well above ground, settles naturally
        linearDamping={0.5}
        angularDamping={0}
        mass={80}
        colliders={false}
        ccd                           // continuous collision detection — prevents tunneling
      >
        <CuboidCollider args={[0.9, 0.45, 1.55]} />
      </RigidBody>

      {/* ── Visual mesh (synced in useFrame) ────────────────────────────── */}
      <group ref={meshRef}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.7, 3.1]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Cabin */}
        <mesh castShadow position={[0, 0.6, -0.15]}>
          <boxGeometry args={[1.35, 0.5, 1.55]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Windshield */}
        <mesh position={[0, 0.63, 0.56]}>
          <boxGeometry args={[1.25, 0.36, 0.05]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.55} />
        </mesh>
        {/* Neon LED front */}
        <mesh position={[0, 0.02, 1.58]}>
          <boxGeometry args={[1.7, 0.07, 0.04]} />
          <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={4} />
        </mesh>
        {/* Neon LED back */}
        <mesh position={[0, 0.02, -1.58]}>
          <boxGeometry args={[1.7, 0.07, 0.04]} />
          <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={4} />
        </mesh>
        {/* Wheels — 4 corners */}
        {([-0.95, 0.95] as number[]).map((sx) =>
          ([1.15, -1.15] as number[]).map((sz) => (
            <mesh
              key={`${sx}-${sz}`}
              position={[sx, -0.27, sz]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.36, 0.36, 0.26, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
          ))
        )}
        {/* Headlights */}
        <pointLight position={[ 0.5, 0.15, 1.7]} color="#fef9c3" intensity={10} distance={14} />
        <pointLight position={[-0.5, 0.15, 1.7]} color="#fef9c3" intensity={10} distance={14} />
      </group>
    </>
  );
}
