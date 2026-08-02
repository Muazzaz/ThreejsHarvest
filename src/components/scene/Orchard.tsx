import { useMemo } from 'react';
import * as THREE from 'three';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import { getTerrainHeight } from '../../lib/terrain';
import { TREE_PLACEMENTS } from '../../lib/products';
import FruitTree from './FruitTree';
import { SNAKE_ROAD_PATH_1, SNAKE_ROAD_PATH_2 } from './OrchardRoads';

export default function Orchard() {
  const filteredTrees = useMemo(() => {
    const road1Curve = new THREE.CatmullRomCurve3(
      SNAKE_ROAD_PATH_1.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      true, 'centripetal', 0.5
    );
    const road2Curve = new THREE.CatmullRomCurve3(
      SNAKE_ROAD_PATH_2.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      true, 'centripetal', 0.5
    );
    
    // Sample points along the curve to easily measure distance
    const pts1 = road1Curve.getSpacedPoints(400);
    const pts2 = road2Curve.getSpacedPoints(400);

    return TREE_PLACEMENTS.filter((tree) => {
      // 1. Check distance to roundabout center at (0,0)
      const distToCenter = Math.hypot(tree.x, tree.z);
      if (distToCenter < 14.0) return false; // Roundabout radius is roughly 9.5 + margin

      const treePt = new THREE.Vector3(tree.x, 0, tree.z);
      
      // 2. Check distance to Road 1
      for (const p of pts1) {
        if (p.distanceTo(treePt) < 5.0) return false;
      }
      
      // 3. Check distance to Road 2
      for (const p of pts2) {
        if (p.distanceTo(treePt) < 5.0) return false;
      }

      return true; // Tree is safe to plant
    });
  }, []);

  return (
    <group>
      {filteredTrees.map((tree, i) => {
        const groundY = getTerrainHeight(tree.x, tree.z);
        return (
          <group key={`tree-${tree.type}-${i}`}>
            <FruitTree type={tree.type} x={tree.x} z={tree.z} />
            {/* Invisible trunk collider so the car can't drive through */}
            <RigidBody type="fixed" position={[tree.x, groundY + 1.2, tree.z]} colliders={false}>
              <CylinderCollider args={[1.2, 0.35]} />
            </RigidBody>
          </group>
        );
      })}
    </group>
  );
}
