import { Sky, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense, useEffect, useState } from 'react';
import { useVehicleControls } from '../../hooks/useVehicleControls';
import { getTimeConfig, type TimeConfig } from '../../lib/timeOfDay';
import { useOrchardStore } from '../../store/useOrchardStore';
import Orchard from './Orchard';
import OrchardRoads from './OrchardRoads';
import Terrain from './Terrain';
import Vehicle from './Vehicle';

function SceneContent({ timeConfig }: { timeConfig: TimeConfig }) {
  useVehicleControls(); // register key listeners

  return (
    <Physics gravity={[0, -20, 0]} timeStep={1 / 60}>
      {/* Lighting */}
      <ambientLight intensity={timeConfig.ambientLightIntensity} />
      <directionalLight
        position={timeConfig.sunPosition}
        intensity={timeConfig.directionalLightIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        color={timeConfig.directionalLightColor}
      />
      <hemisphereLight
        args={[timeConfig.hemisphereSky, timeConfig.hemisphereGround, timeConfig.hemisphereIntensity]}
      />

      {/* Sky atmosphere */}
      <Sky
        distance={4500}
        sunPosition={timeConfig.sunPosition}
        inclination={0.5}
        azimuth={0.25}
        rayleigh={timeConfig.skyRayleigh}
        turbidity={timeConfig.skyTurbidity}
      />

      {/* Night / Sunset Stars */}
      {timeConfig.starsVisible && (
        <Stars
          radius={120}
          depth={50}
          count={timeConfig.starsCount}
          factor={4}
          saturation={0.5}
          fade
          speed={1}
        />
      )}

      {/* Dynamic Fog */}
      <fog attach="fog" args={[timeConfig.fogColor, timeConfig.fogNear, timeConfig.fogFar]} />

      {/* Scene objects */}
      <Terrain />
      <OrchardRoads />
      <Orchard />
      <Vehicle headlightsIntensity={timeConfig.headlightsIntensity} isNight={timeConfig.isNight} />
    </Physics>
  );
}

export default function OrchadCanvas() {
  const timeMode = useOrchardStore((s) => s.timeMode);
  const [timeConfig, setTimeConfig] = useState(() => getTimeConfig(timeMode));

  useEffect(() => {
    const update = () => setTimeConfig(getTimeConfig(timeMode));
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [timeMode]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 12, 20], fov: 60, near: 0.5, far: 350 }}
      gl={{ antialias: false, toneMapping: 5 /* ACESFilmic */, powerPreference: 'high-performance' }}
      style={{ width: '100vw', height: '100vh', background: timeConfig.canvasBackground }}
    >
      <Suspense fallback={null}>
        <SceneContent timeConfig={timeConfig} />
      </Suspense>
    </Canvas>
  );
}
