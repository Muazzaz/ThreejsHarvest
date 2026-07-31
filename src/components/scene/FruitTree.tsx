import { PRODUCTS, type FruitType } from '../../lib/products';
import { getTerrainHeight } from '../../lib/terrain';
import GuavaTree from './GuavaTree';
import JujubeTree from './JujubeTree';
import LemonTree from './LemonTree';
import MangoTree from './MangoTree';
import PapayaTree from './PapayaTree';

interface FruitTreeProps {
  type: FruitType;
  x: number;
  z: number;
}

export default function FruitTree({ type, x, z }: FruitTreeProps) {
  const product = PRODUCTS[type];
  const groundY = getTerrainHeight(x, z);

  switch (type) {
    case 'mango':
      return <MangoTree x={x} z={z} groundY={groundY} />;
    case 'guava':
      return <GuavaTree x={x} z={z} groundY={groundY} isSpecial={product.special} />;
    case 'papaya':
      return <PapayaTree x={x} z={z} groundY={groundY} />;
    case 'jujube':
      return <JujubeTree x={x} z={z} groundY={groundY} />;
    case 'lemon':
      return <LemonTree x={x} z={z} groundY={groundY} />;
    default:
      return <MangoTree x={x} z={z} groundY={groundY} />;
  }
}
