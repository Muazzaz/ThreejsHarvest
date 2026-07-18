import { CylinderCollider, RigidBody } from '@react-three/rapier';
import { getTerrainHeight } from '../../lib/terrain';
import { TREE_PLACEMENTS } from '../../lib/products';
import FruitTree from './FruitTree';

export default function Orchard() {
  return (
    <group>
      {TREE_PLACEMENTS.map((tree, i) => {
        const groundY = getTerrainHeight(tree.x, tree.z);
        return (
          <group key={i}>
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
