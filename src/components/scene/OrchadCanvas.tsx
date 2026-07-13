import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { useVehicleControls } from '../../hooks/useVehicleControls';
import ModernElements from './ModernElements';
import Orchard from './Orchard';
import Terrain from './Terrain';
import Vehicle from './Vehicle';

function SceneContent() {
  useVehicleControls(); // register key listeners

  return (
    <Physics gravity={[0, -20, 0]} timeStep={1 / 60}>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[80, 120, 60]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        color="#fff8e7"
      />
      <hemisphereLight args={['#87ceeb', '#4a7c59', 0.4]} />

      {/* Sky atmosphere */}
      <Sky
        distance={4500}
        sunPosition={[100, 40, 80]}
        inclination={0.5}
        azimuth={0.25}
        rayleigh={0.8}
        turbidity={6}
      />
      <fog attach="fog" args={['#a8d5a2', 100, 280]} />

      {/* Scene objects */}
      <Terrain />
      <Orchard />
      <ModernElements />
      <Vehicle />
    </Physics>
  );
}

export default function OrchadCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 12, 20], fov: 60, near: 0.5, far: 350 }}
      gl={{ antialias: false, toneMapping: 5 /* ACESFilmic */, powerPreference: 'high-performance' }}
      style={{ width: '100vw', height: '100vh', background: '#87ceeb' }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
