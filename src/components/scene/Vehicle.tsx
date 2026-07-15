import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef } from 'react';
import * as THREE from 'three';
import { getKeys } from '../../hooks/useVehicleControls';
import type { FruitType } from '../../lib/products';
import { TREE_PLACEMENTS } from '../../lib/products';
import { getTerrainHeight } from '../../lib/terrain';
import { useOrchardStore } from '../../store/useOrchardStore';

const ACCEL = 38;   // speed units per second forward
const BRAKE = 42;   // braking deceleration per second
const REVERSE_ACCEL = 14;   // reverse acceleration speed per second
const DECEL = 15;   // passive coasting decay per second
const MAX_SPEED = 15;   // max forward m/s
const MAX_REV_SPEED = 5.5;  // max reverse m/s
const STEER_VEL = 2.1;  // steer speed rad/s
const HARVEST_RADIUS = 14;

// Pre-allocated vectors — never create new ones in useFrame
const _forward = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _groundNorm = new THREE.Vector3();
const _carRight = new THREE.Vector3();
const _carFwd = new THREE.Vector3();
const _basisMat = new THREE.Matrix4();

export default function Vehicle() {
  const chassisRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  const { setNearbyFruit, addToCart, setHarvestCooldown } = useOrchardStore();

  useFrame(({ camera }, delta) => {
    const body = chassisRef.current;
    if (!body) return;

    const keys = getKeys();
    const vel = body.linvel();
    const pos = body.translation();
    const rot = body.rotation();

    _quat.set(rot.x, rot.y, rot.z, rot.w);
    // Forward direction is -Z in local space
    _forward.set(0, 0, -1).applyQuaternion(_quat);
    _forward.y = 0; // keep on horizontal plane
    _forward.normalize();

    // ── SLOPE DETECTOR (Hill Gravity Effect) ──
    // Samples the terrain height slightly around the vehicle to estimate
    // the slope normal and calculate pitch incline.
    const sampleDist = 0.5;
    const hL = getTerrainHeight(pos.x - sampleDist, pos.z);
    const hR = getTerrainHeight(pos.x + sampleDist, pos.z);
    const hB = getTerrainHeight(pos.x, pos.z - sampleDist);
    const hF = getTerrainHeight(pos.x, pos.z + sampleDist);

    _groundNorm.set(
      (hL - hR) / (2 * sampleDist),
      1.0,
      (hB - hF) / (2 * sampleDist)
    ).normalize();

    // Incline along the forward direction
    const hFront = getTerrainHeight(pos.x + _forward.x * 0.8, pos.z + _forward.z * 0.8);
    const hBack = getTerrainHeight(pos.x - _forward.x * 0.8, pos.z - _forward.z * 0.8);
    const slopeIncline = hFront - hBack; // positive = climbing, negative = descending

    // Tweak gravity multiplier for realistic hill feel
    const hillGravityAccel = slopeIncline * 11.0; // slightly reduced from 14.0 for better climbing feel

    // Current forward speed on the horizontal plane
    let currentFwdSpeed = _forward.x * vel.x + _forward.z * vel.z;

    // ── 1. ENGINE ACCELERATION AND BRAKING (WITH HILL RESISTANCE) ───────────
    if (keys.forward) {
      // Accelerate forward, fought slightly by gravity but with a high guaranteed minimum engine power
      const activeAccel = Math.max(14.0, ACCEL - hillGravityAccel * 0.8);
      const uphillSpeedCap = Math.max(10.5, MAX_SPEED - hillGravityAccel * 0.4);
      currentFwdSpeed = Math.min(
        currentFwdSpeed + activeAccel * delta,
        uphillSpeedCap
      );
    } else if (keys.backward) {
      if (currentFwdSpeed > 0.25) {
        // Brake hard (rapid deceleration toward 0)
        currentFwdSpeed = Math.max(currentFwdSpeed - BRAKE * delta, 0);
      } else {
        // Reverse gear (assisted by hill gravity going down, fought going up)
        const activeReverseAccel = Math.max(6.0, REVERSE_ACCEL + hillGravityAccel * 0.5);
        currentFwdSpeed = Math.max(
          currentFwdSpeed - activeReverseAccel * delta,
          -MAX_REV_SPEED
        );
      }
    } else {
      // Passive coasting friction OR rolling down the hill if slope is steep!
      const rollForce = hillGravityAccel * 1.3;
      if (currentFwdSpeed > 0.1) {
        currentFwdSpeed = Math.max(currentFwdSpeed - (DECEL + rollForce) * delta, -MAX_REV_SPEED);
      } else if (currentFwdSpeed < -0.1) {
        currentFwdSpeed = Math.min(currentFwdSpeed + (DECEL - rollForce) * delta, MAX_SPEED);
      } else {
        // Roll down the hill if slope is steep enough to overcome static friction!
        if (Math.abs(rollForce) > 2.2) {
          currentFwdSpeed -= rollForce * delta;
        } else {
          currentFwdSpeed = 0;
        }
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
        if (keys.left) yAngVel = STEER_VEL * steerSign;
        if (keys.right) yAngVel = -STEER_VEL * steerSign;
      }
      body.setAngvel({ x: 0, y: yAngVel, z: 0 }, true);
    }

    // Snap visual chassis to ground height under the car so it follows terrain curves perfectly
    const visualY = getTerrainHeight(pos.x, pos.z) + 0.38; // 0.38 offset for wheels/chassis alignment

    // ── 7. SYNC VISUAL MESH WITH SLOPE ──────────────────────────────────────
    if (meshRef.current) {
      meshRef.current.position.set(pos.x, visualY, pos.z);

      // Construct lookAt matrix to align visual chassis perfectly with terrain normal and forward dir
      _carRight.crossVectors(_forward, _groundNorm).normalize();
      _carFwd.crossVectors(_groundNorm, _carRight).normalize();

      _basisMat.makeBasis(_carRight, _groundNorm, _carFwd.negate());
      meshRef.current.quaternion.setFromRotationMatrix(_basisMat);
    }

    // ── 8. SMOOTH CAMERA FOLLOW SNAPPED TO HILL HEIGHT ──────────────────────
    _camTarget.set(pos.x, visualY + 1.2, pos.z);
    _camPos.set(
      pos.x - _forward.x * 12,
      visualY + 6.5,
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
        {/* ── LOWER BODY — smooth rounded base ──────────────────────────── */}
        {/* Main body — rounded capsule-like shape */}
        <mesh castShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[1.75, 0.55, 3.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Body side curves (left + right) — gives the slab rounded edges */}
        {([-0.88, 0.88] as number[]).map((sx) => (
          <mesh key={`side-${sx}`} castShadow position={[sx, 0.05, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 3.1, 8, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
          </mesh>
        ))}
        {/* Front bumper — rounded nose */}
        <mesh position={[0, -0.02, 1.55]}>
          <sphereGeometry args={[0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.0, 1.55]}>
          <boxGeometry args={[1.65, 0.45, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Rear bumper */}
        <mesh position={[0, 0.0, -1.55]}>
          <boxGeometry args={[1.65, 0.45, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
        </mesh>

        {/* ── UPPER BODY — hood + cabin ─────────────────────────────────── */}
        {/* Hood — sleek low-profile front */}
        <mesh castShadow position={[0, 0.38, 0.95]}>
          <boxGeometry args={[1.6, 0.12, 1.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.2} />
        </mesh>
        {/* Hood slope — tapers toward front */}
        <mesh castShadow position={[0, 0.34, 1.42]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[1.55, 0.08, 0.4]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.2} />
        </mesh>

        {/* Cabin — rounded top using scaled sphere */}
        <mesh castShadow position={[0, 0.58, -0.2]}>
          <boxGeometry args={[1.45, 0.48, 1.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.25} />
        </mesh>
        {/* Cabin roof — rounded top edge */}
        <mesh position={[0, 0.85, -0.2]}>
          <boxGeometry args={[1.3, 0.06, 1.4]} />
          <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.25} />
        </mesh>

        {/* ── GLASS — windshields ───────────────────────────────────────── */}
        {/* Front windshield — raked angle */}
        <mesh position={[0, 0.6, 0.55]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[1.3, 0.5, 0.04]} />
          <meshStandardMaterial color="#64b5f6" transparent opacity={0.45} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Rear windshield — less raked */}
        <mesh position={[0, 0.6, -0.95]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[1.25, 0.45, 0.04]} />
          <meshStandardMaterial color="#64b5f6" transparent opacity={0.4} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Side windows (left + right) */}
        {([-0.735, 0.735] as number[]).map((sx) => (
          <mesh key={`win-${sx}`} position={[sx, 0.62, -0.2]}>
            <boxGeometry args={[0.04, 0.36, 1.2]} />
            <meshStandardMaterial color="#64b5f6" transparent opacity={0.35} metalness={0.9} roughness={0.1} />
          </mesh>
        ))}

        {/* ── FENDERS / WHEEL ARCHES ────────────────────────────────────── */}
        {([-0.85, 0.85] as number[]).map((sx) =>
          ([1.1, -1.1] as number[]).map((sz) => (
            <mesh key={`arch-${sx}-${sz}`} position={[sx, -0.1, sz]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.38, 0.08, 6, 12, Math.PI]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.3} />
            </mesh>
          ))
        )}
        {/* Side skirts */}
        {([-0.9, 0.9] as number[]).map((sx) => (
          <mesh key={`skirt-${sx}`} position={[sx, -0.18, 0]}>
            <boxGeometry args={[0.06, 0.18, 2.6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.4} />
          </mesh>
        ))}

        {/* ── LIGHTS ────────────────────────────────────────────────────── */}
        {/* Headlights — slim LED strips */}
        {([-0.6, 0.6] as number[]).map((sx) => (
          <mesh key={`hl-${sx}`} position={[sx, 0.2, 1.62]}>
            <boxGeometry args={[0.35, 0.08, 0.04]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
          </mesh>
        ))}
        {/* DRL light bar — thin strip connecting headlights */}
        <mesh position={[0, 0.14, 1.62]}>
          <boxGeometry args={[1.55, 0.03, 0.03]} />
          <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={3} />
        </mesh>
        {/* Taillights — wide LED bars */}
        {([-0.55, 0.55] as number[]).map((sx) => (
          <mesh key={`tl-${sx}`} position={[sx, 0.2, -1.62]}>
            <boxGeometry args={[0.4, 0.08, 0.04]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} />
          </mesh>
        ))}
        {/* Taillight connecting bar */}
        <mesh position={[0, 0.2, -1.63]}>
          <boxGeometry args={[1.5, 0.025, 0.03]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
        </mesh>

        {/* ── GRILLE — front face detail ────────────────────────────────── */}
        <mesh position={[0, 0.08, 1.63]}>
          <boxGeometry args={[1.0, 0.18, 0.03]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.5} />
        </mesh>

        {/* ── ROOF RAILS ───────────────────────────────────────────────── */}
        {([-0.6, 0.6] as number[]).map((sx) => (
          <mesh key={`rail-${sx}`} position={[sx, 0.9, -0.2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.3, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}

        {/* ── SIDE MIRRORS ─────────────────────────────────────────────── */}
        {([-0.85, 0.85] as number[]).map((sx) => (
          <group key={`mirror-${sx}`} position={[sx * 1.1, 0.55, 0.4]}>
            <mesh>
              <boxGeometry args={[0.1, 0.08, 0.14]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
            </mesh>
            <mesh position={[sx > 0 ? 0.04 : -0.04, 0, 0]}>
              <boxGeometry args={[0.02, 0.06, 0.1]} />
              <meshStandardMaterial color="#64b5f6" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        ))}

        {/* ── WHEELS — 4 corners with rims ──────────────────────────────── */}
        {([-0.92, 0.92] as number[]).map((sx) =>
          ([1.1, -1.1] as number[]).map((sz) => (
            <group key={`wheel-${sx}-${sz}`} position={[sx, -0.25, sz]}>
              {/* Tire */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.28, 0.1, 8, 16]} />
                <meshStandardMaterial color="#1a1a2e" roughness={0.95} metalness={0.05} />
              </mesh>
              {/* Rim — shiny alloy */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.22, 0.22, 0.12, 10]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
              </mesh>
              {/* Rim center cap */}
              <mesh rotation={[0, 0, Math.PI / 2]} position={[sx > 0 ? 0.07 : -0.07, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          ))
        )}

        {/* ── HEADLIGHT ILLUMINATION ────────────────────────────────────── */}
        <pointLight position={[0.5, 0.2, 1.8]} color="#fef9c3" intensity={10} distance={14} />
        <pointLight position={[-0.5, 0.2, 1.8]} color="#fef9c3" intensity={10} distance={14} />
      </group>
    </>
  );
}
