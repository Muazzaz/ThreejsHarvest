import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef, useEffect } from 'react';
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

interface VehicleProps {
  headlightsIntensity?: number;
  isNight?: boolean;
}

function HeadlightSpot({
  position,
  targetPosition,
  intensity,
  angle = 0.55,
  penumbra = 0.7,
  distance = 42,
}: {
  position: [number, number, number];
  targetPosition: [number, number, number];
  intensity: number;
  angle?: number;
  penumbra?: number;
  distance?: number;
}) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <>
      <group ref={targetRef} position={targetPosition} />
      <spotLight
        ref={spotRef}
        position={position}
        color="#fffbeb"
        intensity={intensity}
        distance={distance}
        angle={angle}
        penumbra={penumbra}
        castShadow={false}
      />
    </>
  );
}

export default function Vehicle({ headlightsIntensity = 8, isNight = false }: VehicleProps) {
  const chassisRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const frontWheelRefs = useRef<(THREE.Group | null)[]>([null, null]);
  const wheelAngle = useRef(0);
  const steerAngle = useRef(0);
  const orbitAngle = useRef(0);
  const orbitPitch = useRef(0);
  const isOrbiting = useRef(false);
  const { setNearbyFruit, addToCart, setHarvestCooldown } = useOrchardStore();

  // ── Ctrl+Mouse orbit controls ─────────────────────────────────────────────
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey) isOrbiting.current = true;
    };
    const onMouseUp = () => { isOrbiting.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isOrbiting.current) return;
      orbitAngle.current += e.movementX * 0.005;
      orbitPitch.current = Math.max(-0.3, Math.min(0.5, orbitPitch.current - e.movementY * 0.004));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') document.body.style.cursor = 'grab';
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        isOrbiting.current = false;
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

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

    // Snap visual chassis to road/ground height under the car so it follows terrain and road surface
    const visualY = getTerrainHeight(pos.x, pos.z) + 0.06 + 0.58; // 0.06m road elevation + 0.58m tire radius offset

    // ── 7. SYNC VISUAL MESH WITH SLOPE ──────────────────────────────────────
    if (meshRef.current) {
      meshRef.current.position.set(pos.x, visualY, pos.z);

      // Construct lookAt matrix to align visual chassis perfectly with terrain normal and forward dir
      _carRight.crossVectors(_forward, _groundNorm).normalize();
      _carFwd.crossVectors(_groundNorm, _carRight).normalize();

      _basisMat.makeBasis(_carRight, _groundNorm, _carFwd.negate());
      meshRef.current.quaternion.setFromRotationMatrix(_basisMat);
    }

    // ── WHEEL SPIN — rotate wheels based on forward speed ────────────────
    const WHEEL_RADIUS = 0.38; // torus outer radius (0.26 + 0.12)
    wheelAngle.current -= (currentFwdSpeed / WHEEL_RADIUS) * delta;
    for (const wRef of wheelRefs.current) {
      if (wRef) wRef.rotation.x = wheelAngle.current;
    }

    // ── FRONT WHEEL STEERING VISUAL ───────────────────────────────────
    const MAX_STEER_ANGLE = 0.4;
    let targetSteer = 0;
    if (keys.left) targetSteer = MAX_STEER_ANGLE;
    if (keys.right) targetSteer = -MAX_STEER_ANGLE;
    steerAngle.current += (targetSteer - steerAngle.current) * Math.min(delta * 10, 1);
    for (const fwRef of frontWheelRefs.current) {
      if (fwRef) fwRef.rotation.y = steerAngle.current;
    }

    // ── 8. SMOOTH CAMERA FOLLOW WITH ORBIT ───────────────────────────────
    // Smoothly decay orbit back to 0 when not orbiting
    if (!isOrbiting.current) {
      orbitAngle.current *= 0.92;
      orbitPitch.current *= 0.92;
    }

    const CAM_DIST = 12;
    const CAM_HEIGHT = 6.5;
    // Compute orbit-rotated camera offset relative to car forward
    const camAngle = Math.atan2(-_forward.x, -_forward.z) + orbitAngle.current;
    const heightOffset = CAM_HEIGHT + orbitPitch.current * 8;

    _camTarget.set(pos.x, visualY + 1.2, pos.z);
    _camPos.set(
      pos.x + Math.sin(camAngle) * CAM_DIST,
      visualY + heightOffset,
      pos.z + Math.cos(camAngle) * CAM_DIST
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
        <group rotation={[0, Math.PI, 0]}>
          {/* ── BODY — clean sculpted panels ───────────────────────────────── */}
          {/* Lower body — the main slab */}
          <mesh castShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[1.7, 0.5, 3.0]} />
            <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.35} />
          </mesh>

          {/* Hood — slightly narrower, slopes down at front */}
          <mesh castShadow position={[0, 0.36, 0.7]}>
            <boxGeometry args={[1.6, 0.08, 1.4]} />
            <meshStandardMaterial color="#2d3748" metalness={0.65} roughness={0.3} />
          </mesh>

          {/* Cabin — set back, tapered */}
          <mesh castShadow position={[0, 0.58, -0.25]}>
            <boxGeometry args={[1.4, 0.42, 1.4]} />
            <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Roof — slightly smaller for taper effect */}
          <mesh position={[0, 0.82, -0.25]}>
            <boxGeometry args={[1.3, 0.05, 1.3]} />
            <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Rear deck / trunk — behind cabin */}
          <mesh position={[0, 0.36, -1.1]}>
            <boxGeometry args={[1.6, 0.08, 0.6]} />
            <meshStandardMaterial color="#2d3748" metalness={0.65} roughness={0.3} />
          </mesh>

          {/* ── WINDSHIELDS ───────────────────────────────────────────────── */}
          {/* Front windshield — angled */}
          <mesh position={[0, 0.58, 0.46]} rotation={[-0.45, 0, 0]}>
            <planeGeometry args={[1.28, 0.48]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} metalness={0.8} roughness={0.1} side={2} />
          </mesh>
          {/* Rear windshield */}
          <mesh position={[0, 0.58, -0.96]} rotation={[0.35, 0, 0]}>
            <planeGeometry args={[1.2, 0.42]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.45} metalness={0.8} roughness={0.1} side={2} />
          </mesh>
          {/* Side windows */}
          {([-0.71, 0.71] as number[]).map((sx) => (
            <mesh key={`sw-${sx}`} position={[sx, 0.6, -0.25]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.15, 0.34]} />
              <meshStandardMaterial color="#87CEEB" transparent opacity={0.35} metalness={0.8} roughness={0.1} side={2} />
            </mesh>
          ))}

          {/* ── WHEELS ─────────────────────────────────────────────── */}
          {([-0.88, 0.88] as number[]).map((sx, si) =>
            ([1.0, -1.0] as number[]).map((sz, zi) => {
              const isFront = zi === 0;
              return (
              <group key={`w-${sx}-${sz}`} position={[sx, -0.2, sz]}>
                {/* Steer wrapper — only front wheels rotate on Y */}
                <group ref={isFront ? (el) => { frontWheelRefs.current[si] = el; } : undefined}>
                  {/* Spin group — rotates around X axis (the axle) */}
                  <group ref={(el) => { wheelRefs.current[si * 2 + zi] = el; }}>
                    {/* Tire */}
                    <mesh rotation={[0, Math.PI / 2, 0]}>
                      <torusGeometry args={[0.26, 0.12, 8, 16]} />
                      <meshStandardMaterial color="#111827" roughness={0.92} />
                    </mesh>
                    {/* Rim */}
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.2, 0.2, 0.16, 12]} />
                      <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.15} />
                    </mesh>
                  </group>
                </group>
              </group>
              );
            })
          )}

          {/* ── HEADLIGHTS ────────────────────────────────────────────────── */}
          {([-0.6, 0.6] as number[]).map((sx) => (
            <mesh key={`hl-${sx}`} position={[sx, 0.18, 1.52]}>
              <boxGeometry args={[0.3, 0.1, 0.04]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#fef08a"
                emissiveIntensity={isNight ? 6 : 2}
              />
            </mesh>
          ))}
          {/* DRL accent strip */}
          <mesh position={[0, 0.1, 1.52]}>
            <boxGeometry args={[1.5, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#e2e8f0"
              emissiveIntensity={isNight ? 3.5 : 2}
            />
          </mesh>

          {/* ── TAILLIGHTS ────────────────────────────────────────────────── */}
          {([-0.6, 0.6] as number[]).map((sx) => (
            <mesh key={`tl-${sx}`} position={[sx, 0.18, -1.52]}>
              <boxGeometry args={[0.3, 0.08, 0.04]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 4 : 2} />
            </mesh>
          ))}
          <mesh position={[0, 0.18, -1.53]}>
            <boxGeometry args={[1.5, 0.025, 0.03]} />
            <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={isNight ? 2.5 : 1.2} />
          </mesh>

          {/* ── GRILLE ────────────────────────────────────────────────────── */}
          <mesh position={[0, 0.02, 1.52]}>
            <boxGeometry args={[1.1, 0.2, 0.03]} />
            <meshStandardMaterial color="#111827" roughness={0.5} metalness={0.4} />
          </mesh>

          {/* ── HEADLIGHT ILLUMINATION ────────────────────────────────────── */}
          {/* Subtle bulb glow right at the headlight housing */}
          <pointLight
            position={[0, 0.2, 1.65]}
            color="#fffebc"
            intensity={isNight ? 4 : 1.5}
            distance={4}
          />

          {/* Clean forward headlight projection beam for night driving */}
          {isNight && (
            <>
              {/* Left headlight beam */}
              <HeadlightSpot
                position={[0.55, 0.25, 1.6]}
                targetPosition={[0.55, -1.2, 35]}
                intensity={headlightsIntensity * 4}
                angle={0.55}
                penumbra={0.8}
                distance={40}
              />
              {/* Right headlight beam */}
              <HeadlightSpot
                position={[-0.55, 0.25, 1.6]}
                targetPosition={[-0.55, -1.2, 35]}
                intensity={headlightsIntensity * 4}
                angle={0.55}
                penumbra={0.8}
                distance={40}
              />
            </>
          )}
        </group>
      </group>
    </>
  );
}
