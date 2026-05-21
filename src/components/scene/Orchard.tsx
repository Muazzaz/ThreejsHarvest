import FruitTree from './FruitTree';
import { TREE_PLACEMENTS } from '../../lib/products';

export default function Orchard() {
  return (
    <group>
      {TREE_PLACEMENTS.map((tree, i) => (
        <FruitTree key={i} type={tree.type} x={tree.x} z={tree.z} />
      ))}
    </group>
  );
}
