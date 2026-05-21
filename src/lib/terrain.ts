import { createNoise2D } from 'simplex-noise';

export const TERRAIN_SIZE = 200;
export const TERRAIN_SEGMENTS = 63;
export const HEIGHT_SCALE = 0; // Flat for v1

// Keep the noise instance for future use, but height is 0 for now
const _noise2D = createNoise2D();
void _noise2D; // suppress unused warning

export function getTerrainHeight(_x: number, _z: number): number {
  return 0; // Flat terrain — v1
}

export function generateHeights(): Float32Array {
  const n = TERRAIN_SEGMENTS + 1;
  return new Float32Array(n * n); // all zeros
}
