import { Html } from '@react-three/drei';
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

  let TreeComponent;
  switch (type) {
    case 'mango':
      TreeComponent = <MangoTree x={x} z={z} groundY={groundY} />;
      break;
    case 'guava':
      TreeComponent = <GuavaTree x={x} z={z} groundY={groundY} isSpecial={product.special} />;
      break;
    case 'papaya':
      TreeComponent = <PapayaTree x={x} z={z} groundY={groundY} />;
      break;
    case 'jujube':
      TreeComponent = <JujubeTree x={x} z={z} groundY={groundY} />;
      break;
    case 'lemon':
      TreeComponent = <LemonTree x={x} z={z} groundY={groundY} />;
      break;
    default:
      TreeComponent = <MangoTree x={x} z={z} groundY={groundY} />;
  }

  return (
    <group>
      {TreeComponent}
      <Html
        position={[x, groundY + 4.5, z]}
        center
        distanceFactor={20}
        zIndexRange={[100, 0]}
      >
        <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-white/40 flex flex-col items-center justify-center pointer-events-none transform scale-75">
          <span className="text-3xl drop-shadow-sm">{product.emoji}</span>
          <span className="text-xs font-bold text-gray-800 whitespace-nowrap mt-1 font-sans tracking-wide uppercase">
            {product.name}
          </span>
        </div>
      </Html>
    </group>
  );
}
