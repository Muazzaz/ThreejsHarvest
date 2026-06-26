import * as THREE from 'three';

// ─────────────────────────────────────────────────────
// Shared types for connected branching
// ─────────────────────────────────────────────────────
export type Vec3 = [number, number, number];

export interface BranchSegment {
  start: Vec3;
  end: Vec3;
  radiusStart: number;
  radiusEnd: number;
}

export interface TreeBranchData {
  branches: BranchSegment[];
  leafTipPositions: Vec3[];  // where to place leaf clusters
  fruitPositions: Vec3[];    // where to hang fruits
}

/**
 * Compute the midpoint, quaternion and length needed to render a
 * cylinder between two arbitrary 3D points.
 */
export function computeCylinderTransform(
  start: Vec3,
  end: Vec3,
): { position: Vec3; quaternion: THREE.Quaternion; length: number } {
  const s = new THREE.Vector3(...start);
  const e = new THREE.Vector3(...end);
  const mid = s.clone().add(e).multiplyScalar(0.5);
  const dir = e.clone().sub(s);
  const len = dir.length();
  dir.normalize();

  const quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  quat.setFromUnitVectors(up, dir);

  return {
    position: mid.toArray() as Vec3,
    quaternion: quat,
    length: len,
  };
}

/**
 * Compute the endpoint of a branch given start point, horizontal angle,
 * elevation angle, and length.
 */
export function branchEndpoint(
  start: Vec3,
  horizontalAngle: number,
  elevationAngle: number,
  length: number,
): Vec3 {
  const cosEl = Math.cos(elevationAngle);
  return [
    start[0] + Math.cos(horizontalAngle) * cosEl * length,
    start[1] + Math.sin(elevationAngle) * length,
    start[2] + Math.sin(horizontalAngle) * cosEl * length,
  ];
}

/**
 * Generate a full connected branching structure for a generic tree.
 * Returns branch segments and the tip positions where leaves should attach.
 */
export function generateBranchTree(
  trunkHeight: number,
  canopyRadius: number,
  seed: number,
  options: {
    mainBranchCount?: number;
    subBranchCount?: number;
    twigCount?: number;
    /** How far up the trunk main branches start (0-1 fraction) */
    branchStartMin?: number;
    branchStartMax?: number;
    /** Elevation angle range (radians from horizontal, 0 = horizontal, PI/2 = straight up) */
    elevationMin?: number;
    elevationMax?: number;
    /** Main branch length relative to canopy radius */
    lengthMin?: number;
    lengthMax?: number;
    /** Main branch radius */
    mainRadiusBot?: number;
    mainRadiusTop?: number;
    subRadiusBot?: number;
    subRadiusTop?: number;
    twigRadiusBot?: number;
    twigRadiusTop?: number;
    /** Sub-branch angle spread from parent direction */
    subAngleSpread?: number;
    /** Sub-branch elevation change */
    subElevationDelta?: number;
  } = {},
): TreeBranchData {
  const rng = seededRandom(seed);
  const branches: BranchSegment[] = [];
  const leafTipPositions: Vec3[] = [];
  const fruitPositions: Vec3[] = [];

  const {
    mainBranchCount = 5 + Math.floor(rng() * 3),
    subBranchCount = 2 + Math.floor(rng() * 2),
    twigCount = 1 + Math.floor(rng() * 2),
    branchStartMin = 0.35,
    branchStartMax = 0.65,
    elevationMin = 0.25,
    elevationMax = 0.7,
    lengthMin = 0.45,
    lengthMax = 0.85,
    mainRadiusBot = 0.1,
    mainRadiusTop = 0.045,
    subRadiusBot = 0.045,
    subRadiusTop = 0.02,
    twigRadiusBot = 0.02,
    twigRadiusTop = 0.008,
    subAngleSpread = 1.0,
    subElevationDelta = 0.4,
  } = options;

  for (let i = 0; i < mainBranchCount; i++) {
    const angle = (i / mainBranchCount) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    const startY = trunkHeight * (branchStartMin + rng() * (branchStartMax - branchStartMin));
    const elevation = elevationMin + rng() * (elevationMax - elevationMin);
    const length = canopyRadius * (lengthMin + rng() * (lengthMax - lengthMin));

    const start: Vec3 = [0, startY, 0];
    const end = branchEndpoint(start, angle, elevation, length);

    branches.push({
      start,
      end,
      radiusStart: mainRadiusBot + rng() * 0.03,
      radiusEnd: mainRadiusTop + rng() * 0.015,
    });

    // Sub-branches forking from the main branch
    let hasSubBranches = false;
    const actualSubCount = subBranchCount + Math.floor(rng() * 2);
    for (let j = 0; j < actualSubCount; j++) {
      hasSubBranches = true;
      // Sub-branch starts partway along the parent
      const frac = 0.35 + rng() * 0.55;
      const subStart: Vec3 = [
        start[0] + (end[0] - start[0]) * frac,
        start[1] + (end[1] - start[1]) * frac,
        start[2] + (end[2] - start[2]) * frac,
      ];

      const subAngle = angle + (rng() - 0.5) * subAngleSpread;
      const subElevation = elevation + (rng() - 0.5) * subElevationDelta;
      const subLength = length * (0.35 + rng() * 0.3);
      const subEnd = branchEndpoint(subStart, subAngle, subElevation, subLength);

      branches.push({
        start: subStart,
        end: subEnd,
        radiusStart: subRadiusBot + rng() * 0.015,
        radiusEnd: subRadiusTop + rng() * 0.008,
      });

      // Twigs from sub-branch tips
      let hasSubTwigs = false;
      const actualTwigCount = twigCount + Math.floor(rng() * 2);
      for (let k = 0; k < actualTwigCount; k++) {
        hasSubTwigs = true;
        const twigFrac = 0.5 + rng() * 0.45;
        const twigStart: Vec3 = [
          subStart[0] + (subEnd[0] - subStart[0]) * twigFrac,
          subStart[1] + (subEnd[1] - subStart[1]) * twigFrac,
          subStart[2] + (subEnd[2] - subStart[2]) * twigFrac,
        ];
        const twigAngle = subAngle + (rng() - 0.5) * 1.2;
        const twigElevation = subElevation + (rng() - 0.5) * 0.5;
        const twigLength = subLength * (0.3 + rng() * 0.3);
        const twigEnd = branchEndpoint(twigStart, twigAngle, twigElevation, twigLength);

        branches.push({
          start: twigStart,
          end: twigEnd,
          radiusStart: twigRadiusBot + rng() * 0.005,
          radiusEnd: twigRadiusTop + rng() * 0.003,
        });

        // Leaf cluster at twig tip
        leafTipPositions.push(twigEnd);
        if (rng() > 0.6) fruitPositions.push(twigEnd);
      }

      // Leaf cluster at sub-branch tip too
      if (!hasSubTwigs) {
        leafTipPositions.push(subEnd);
      } else {
        leafTipPositions.push(subEnd);
      }
      if (rng() > 0.5) fruitPositions.push(subEnd);
    }

    // Leaf cluster at main branch tip
    leafTipPositions.push(end);
    if (!hasSubBranches && rng() > 0.3) fruitPositions.push(end);
  }

  return { branches, leafTipPositions, fruitPositions };
}

// ─────────────────────────────────────────────────────
// Utility: seeded pseudo-random for deterministic trees
// ─────────────────────────────────────────────────────
export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─────────────────────────────────────────────────────
// Bark texture — procedural canvas-based
// ─────────────────────────────────────────────────────
function createBarkTexture(
  baseColor = '#3d3028',
  mossAmount = 8,
  repeatU = 2,
  repeatV = 4,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const rng = seededRandom(42);

  // Vertical grooves
  for (let i = 0; i < 80; i++) {
    const x = rng() * size;
    const w = 1 + rng() * 3;
    const brightness = 20 + rng() * 35;
    ctx.strokeStyle = `rgba(${brightness}, ${brightness * 0.8}, ${brightness * 0.6}, ${0.3 + rng() * 0.4})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    let cy = 0;
    ctx.moveTo(x, cy);
    while (cy < size) {
      cy += 4 + rng() * 8;
      const dx = (rng() - 0.5) * 6;
      ctx.lineTo(x + dx, cy);
    }
    ctx.stroke();
  }

  // Horizontal cracks
  for (let i = 0; i < 40; i++) {
    const y = rng() * size;
    const startX = rng() * size * 0.5;
    const endX = startX + 30 + rng() * 100;
    ctx.strokeStyle = `rgba(${15 + rng() * 20}, ${10 + rng() * 15}, ${8 + rng() * 10}, ${0.3 + rng() * 0.3})`;
    ctx.lineWidth = 0.5 + rng() * 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y + (rng() - 0.5) * 8);
    ctx.stroke();
  }

  // Dark patches/knots
  for (let i = 0; i < 15; i++) {
    const px = rng() * size;
    const py = rng() * size;
    const pr = 5 + rng() * 15;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    grad.addColorStop(0, `rgba(20, 15, 10, ${0.4 + rng() * 0.3})`);
    grad.addColorStop(1, 'rgba(20, 15, 10, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }

  // Moss / lichen patches
  for (let i = 0; i < mossAmount; i++) {
    const px = rng() * size;
    const py = rng() * size;
    const pr = 8 + rng() * 20;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    grad.addColorStop(0, `rgba(60, 80, 40, ${0.15 + rng() * 0.15})`);
    grad.addColorStop(1, 'rgba(60, 80, 40, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatU, repeatV);
  return tex;
}

// ─────────────────────────────────────────────────────
// Bark normal map — procedural
// ─────────────────────────────────────────────────────
function createBarkNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, size, size);

  const rng = seededRandom(7);

  for (let i = 0; i < 100; i++) {
    const x = rng() * size;
    const w = 1 + rng() * 4;
    const direction = rng() > 0.5 ? 160 : 96;
    ctx.strokeStyle = `rgb(${direction}, 128, 240)`;
    ctx.lineWidth = w;
    ctx.beginPath();
    let cy = 0;
    ctx.moveTo(x, cy);
    while (cy < size) {
      cy += 3 + rng() * 6;
      ctx.lineTo(x + (rng() - 0.5) * 5, cy);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return tex;
}

// ─────────────────────────────────────────────────────
// Leaf texture — customizable procedural
// ─────────────────────────────────────────────────────
export function createLeafTexture(
  baseColor = '#1a5c1a',
  glossColor = 'rgba(120, 200, 120, 0.25)',
  veinColor = '#2a7a2a',
  shape: 'lanceolate' | 'oval' | 'palmate' | 'narrow' = 'lanceolate',
): THREE.CanvasTexture {
  const w = 128, h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = baseColor;
  ctx.beginPath();

  switch (shape) {
    case 'oval':
      ctx.moveTo(w / 2, 8);
      ctx.bezierCurveTo(w * 0.95, h * 0.25, w * 0.95, h * 0.75, w / 2, h - 8);
      ctx.bezierCurveTo(w * 0.05, h * 0.75, w * 0.05, h * 0.25, w / 2, 8);
      break;
    case 'palmate':
      // Broad leaf with lobes (for papaya)
      ctx.moveTo(w / 2, 10);
      ctx.bezierCurveTo(w * 0.9, h * 0.15, w * 0.95, h * 0.35, w * 0.8, h * 0.45);
      ctx.bezierCurveTo(w * 0.95, h * 0.55, w * 0.85, h * 0.75, w / 2, h - 10);
      ctx.bezierCurveTo(w * 0.15, h * 0.75, w * 0.05, h * 0.55, w * 0.2, h * 0.45);
      ctx.bezierCurveTo(w * 0.05, h * 0.35, w * 0.1, h * 0.15, w / 2, 10);
      break;
    case 'narrow':
      ctx.moveTo(w / 2, 5);
      ctx.bezierCurveTo(w * 0.72, h * 0.15, w * 0.72, h * 0.5, w / 2, h - 5);
      ctx.bezierCurveTo(w * 0.28, h * 0.5, w * 0.28, h * 0.15, w / 2, 5);
      break;
    default: // lanceolate
      ctx.moveTo(w / 2, 5);
      ctx.bezierCurveTo(w * 0.85, h * 0.2, w * 0.9, h * 0.5, w / 2, h - 5);
      ctx.bezierCurveTo(w * 0.1, h * 0.5, w * 0.15, h * 0.2, w / 2, 5);
      break;
  }
  ctx.closePath();
  ctx.fill();

  // Glossy gradient overlay
  const glossGrad = ctx.createLinearGradient(0, 0, w, h * 0.4);
  glossGrad.addColorStop(0, glossColor);
  glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  glossGrad.addColorStop(1, 'rgba(40, 80, 40, 0.15)');
  ctx.fillStyle = glossGrad;
  ctx.fill();

  // Midrib
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 10);
  ctx.lineTo(w / 2, h - 10);
  ctx.stroke();

  // Lateral veins
  ctx.strokeStyle = `${veinColor}88`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const y = 25 + i * ((h - 50) / 12);
    const spread = 15 + (1 - Math.abs(y / h - 0.5) * 2) * 30;
    ctx.beginPath();
    ctx.moveTo(w / 2, y);
    ctx.quadraticCurveTo(w / 2 + spread * 0.5, y - 4, w / 2 + spread, y + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2, y);
    ctx.quadraticCurveTo(w / 2 - spread * 0.5, y - 4, w / 2 - spread, y + 6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

// ─────────────────────────────────────────────────────
// Smooth bark texture (for papaya-like trees)
// ─────────────────────────────────────────────────────
function createSmoothBarkTexture(baseColor = '#8a9a7a'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const rng = seededRandom(88);

  // Subtle horizontal ring marks (like papaya trunk scars)
  for (let i = 0; i < 60; i++) {
    const y = rng() * size;
    ctx.strokeStyle = `rgba(${100 + rng() * 60}, ${110 + rng() * 50}, ${90 + rng() * 40}, ${0.15 + rng() * 0.2})`;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rng() - 0.5) * 3);
    ctx.stroke();
  }

  // Leaf scar marks (diamond shapes)
  for (let i = 0; i < 30; i++) {
    const px = rng() * size;
    const py = rng() * size;
    const sz = 3 + rng() * 6;
    ctx.fillStyle = `rgba(${60 + rng() * 40}, ${70 + rng() * 40}, ${50 + rng() * 30}, ${0.2 + rng() * 0.15})`;
    ctx.beginPath();
    ctx.moveTo(px, py - sz);
    ctx.lineTo(px + sz * 0.6, py);
    ctx.lineTo(px, py + sz);
    ctx.lineTo(px - sz * 0.6, py);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

// ─────────────────────────────────────────────────────
// Singleton texture cache
// ─────────────────────────────────────────────────────
const textureCache = new Map<string, THREE.CanvasTexture>();

function getCached(key: string, factory: () => THREE.CanvasTexture): THREE.CanvasTexture {
  if (!textureCache.has(key)) {
    textureCache.set(key, factory());
  }
  return textureCache.get(key)!;
}

export function getBarkTexture(baseColor?: string) {
  const key = `bark_${baseColor || 'default'}`;
  return getCached(key, () => createBarkTexture(baseColor));
}

export function getSmoothBarkTexture(baseColor?: string) {
  const key = `smoothbark_${baseColor || 'default'}`;
  return getCached(key, () => createSmoothBarkTexture(baseColor));
}

export function getBarkNormal() {
  return getCached('barkNormal', createBarkNormalMap);
}

export function getLeafTexture(
  baseColor?: string,
  glossColor?: string,
  veinColor?: string,
  shape?: 'lanceolate' | 'oval' | 'palmate' | 'narrow',
) {
  const key = `leaf_${baseColor || 'def'}_${shape || 'def'}`;
  return getCached(key, () => createLeafTexture(baseColor, glossColor, veinColor, shape));
}
