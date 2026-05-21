import { createNoise2D } from "simplex-noise";

export const TERRAIN_SIZE = 200;
export const TERRAIN_SEGMENTS = 70; // high segment count for smooth hills
export const HEIGHT_SCALE = 5.0; // maximum height of Khagrachari hills

const noise2D = createNoise2D();

export function getTerrainHeight(x: number, z: number): number {
  // Smooth rolling hill noise
  const n1 = noise2D(x * 0.012, z * 0.012) * 1.0;
  const n2 = noise2D(x * 0.035, z * 0.035) * 0.3;
  const rawHeight = n1 + n2;

  // Flatten the spawn region at the center (x=0, z=0) so the vehicle spawns safely
  const dist = Math.sqrt(x * x + z * z);
  const flattenFactor = Math.min(1, Math.max(0, (dist - 10) / 22)); // smooth ramp from 0 to 1 between 10m and 32m

  return rawHeight * HEIGHT_SCALE * flattenFactor;
}

export function generateHeights(): Float32Array {
  const n = TERRAIN_SEGMENTS + 1;
  const heights = new Float32Array(n * n);
  const step = TERRAIN_SIZE / TERRAIN_SEGMENTS;
  const half = TERRAIN_SIZE / 2;

  for (let i = 0; i < n; i++) {
    const z = i * step - half;
    for (let j = 0; j < n; j++) {
      const x = j * step - half;
      heights[i * n + j] = getTerrainHeight(x, z);
    }
  }
  return heights;
}
