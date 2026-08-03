import { RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import * as THREE from 'three';
import { TERRAIN_SEGMENTS, TERRAIN_SIZE, getTerrainHeight } from '../../lib/terrain';
import { SNAKE_ROAD_PATH_1, SNAKE_ROAD_PATH_2 } from './OrchardRoads';

function createTerrainTexture(S: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const size = 2048; // High resolution for crisp roads
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Base grass color
  ctx.fillStyle = '#3a7d44';
  ctx.fillRect(0, 0, size, size);
  
  // Coordinate mapper: Terrain is S x S (-S/2 to S/2)
  // X: -S/2 -> 0, +S/2 -> size
  // Z: -S/2 -> 0, +S/2 -> size
  // Note: Three.js PlaneGeometry with rotateX(-Math.PI/2) has Z axis pointing backwards (-Z is forward). 
  // We map coordinates accordingly.
  const mapCoordX = (val: number) => ((val + S / 2) / S) * size;
  const mapCoordZ = (val: number) => ((val + S / 2) / S) * size;
  
  // Generate a realistic, abstract noise pattern for the road (dirt/gravel)
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 128;
  patternCanvas.height = 128;
  const pCtx = patternCanvas.getContext('2d')!;
  
  // Base dirt color
  pCtx.fillStyle = '#655340';
  pCtx.fillRect(0, 0, 128, 128);
  
  // Add random gravel / abstract noise
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const r = Math.random() * 1.5 + 0.5;
    const type = Math.random();
    if (type < 0.3) {
      pCtx.fillStyle = 'rgba(255, 255, 255, 0.12)'; // light sand/pebbles
    } else if (type < 0.6) {
      pCtx.fillStyle = 'rgba(0, 0, 0, 0.18)'; // dark dirt/shadows
    } else {
      pCtx.fillStyle = 'rgba(139, 115, 85, 0.35)'; // medium brown variation
    }
    pCtx.beginPath();
    pCtx.arc(x, y, r, 0, Math.PI * 2);
    pCtx.fill();
  }
  
  const roadPattern = ctx.createPattern(patternCanvas, 'repeat')!;

  // Soften the road edges with a drop shadow to blend naturally into the grass
  ctx.shadowColor = '#3e3020';
  ctx.shadowBlur = 12;

  // Draw Roundabout
  ctx.beginPath();
  ctx.arc(mapCoordX(0), mapCoordZ(0), (9.0 / S) * size, 0, Math.PI * 2);
  ctx.fillStyle = roadPattern;
  ctx.fill();
  
  ctx.lineWidth = (5.2 / S) * size;
  ctx.strokeStyle = roadPattern;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const drawPath = (path: [number, number][], closed: boolean) => {
    const points3D = path.map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(points3D, closed, 'centripetal', 0.5);
    const pts = curve.getSpacedPoints(400);
    
    ctx.beginPath();
    ctx.moveTo(mapCoordX(pts[0].x), mapCoordZ(pts[0].z));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(mapCoordX(pts[i].x), mapCoordZ(pts[i].z));
    }
    if (closed) ctx.closePath();
    ctx.stroke();
  };

  drawPath(SNAKE_ROAD_PATH_1, true);
  drawPath(SNAKE_ROAD_PATH_2, true);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // PlaneGeometry has standard UVs. To match top-down view properly:
  texture.flipY = true;
  return texture;
}

export default function Terrain() {
  const S = TERRAIN_SIZE;
  const terrainMap = useMemo(() => createTerrainTexture(S), [S]);

  // Generate the rolling hills geometry dynamically using our noise function
  const visualGeometry = useMemo(() => {
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

  // Generate a much lower resolution geometry for physics to prevent sluggishness
  const physicsGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(S, S, 16, 16);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);
    }
    return geo;
  }, [S]);

  return (
    <group>
      {/* ── Main rolling hills ── */}
      {/* Visual mesh (high poly) */}
      <mesh receiveShadow geometry={visualGeometry}>
        <meshStandardMaterial
          map={terrainMap}
          color="#ffffff"
          roughness={0.75}
          metalness={0.1}
          flatShading={false}
        />
      </mesh>
      
      {/* Physics mesh (low poly) */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={physicsGeometry} visible={false} />
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
