// hex/coordinates.js -- Pure functions for hex coordinate math.
// Cube coordinates [x, y, z] where x + y + z = 0.
// Axial coordinates [q, r] where q = x, r = z.

import { DIRECTIONS } from './directions.js';

// ── Conversion matrices (precomputed) ──────────────────────────────

const SQRT3 = Math.sqrt(3);

// Axial-to-pixel matrices: multiply by (radius + padding)
const MAT_AX2PX_FLAT = {
  a: 3 / 2,    b: 0,
  c: SQRT3 / 2, d: SQRT3,
};
const MAT_AX2PX_POINTY = {
  a: SQRT3,     b: SQRT3 / 2,
  c: 0,         d: 3 / 2,
};

// Pixel-to-axial (inverse matrices)
const MAT_PX2AX_FLAT = invert2x2(MAT_AX2PX_FLAT);
const MAT_PX2AX_POINTY = invert2x2(MAT_AX2PX_POINTY);

function invert2x2({ a, b, c, d }) {
  const det = a * d - b * c;
  return { a: d / det, b: -b / det, c: -c / det, d: a / det };
}

// ── Cube <-> Axial ─────────────────────────────────────────────────

/** Convert a single cube coord [x,y,z] to axial [q,r]. */
export function cubeToAxial([x, , z]) {
  return [x, z];
}

/** Convert an array of cube coords to axial coords. */
export function cubesToAxial(cubes) {
  return cubes.map(cubeToAxial);
}

/** Convert a single axial [q,r] to cube [x,y,z]. */
export function axialToCube([q, r]) {
  const y = -q - r;
  return [q, y === 0 ? 0 : y, r];
}

/** Convert an array of axial coords to cube coords. */
export function axialsToCubes(axials) {
  return axials.map(axialToCube);
}

// ── Cube rounding ──────────────────────────────────────────────────

/** Round a fractional cube coordinate to the nearest integer cube coordinate. */
export function cubeRound([fx, fy, fz]) {
  let rx = Math.round(fx);
  let ry = Math.round(fy);
  let rz = Math.round(fz);

  const xDiff = Math.abs(rx - fx);
  const yDiff = Math.abs(ry - fy);
  const zDiff = Math.abs(rz - fz);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return [rx, ry, rz];
}

/** Round an array of fractional cube coordinates. */
export function cubesRound(coords) {
  return coords.map(cubeRound);
}

// ── Axial <-> Pixel ────────────────────────────────────────────────

/** Convert a single axial [q,r] to pixel [x,y] for flat-top orientation. */
export function axialToPixelFlat([q, r], radius, padding = 0) {
  const s = radius + padding;
  return [
    s * (MAT_AX2PX_FLAT.a * q + MAT_AX2PX_FLAT.b * r),
    s * (MAT_AX2PX_FLAT.c * q + MAT_AX2PX_FLAT.d * r),
  ];
}

/** Convert a single axial [q,r] to pixel [x,y] for pointy-top orientation. */
export function axialToPixelPointy([q, r], radius, padding = 0) {
  const s = radius + padding;
  return [
    s * (MAT_AX2PX_POINTY.a * q + MAT_AX2PX_POINTY.b * r),
    s * (MAT_AX2PX_POINTY.c * q + MAT_AX2PX_POINTY.d * r),
  ];
}

/** Convert an array of axial coords to pixel coords (flat-top). */
export function axialsToPixelsFlat(axials, radius, padding = 0) {
  return axials.map(ax => axialToPixelFlat(ax, radius, padding));
}

/** Convert an array of axial coords to pixel coords (pointy-top). */
export function axialsToPixelsPointy(axials, radius, padding = 0) {
  return axials.map(ax => axialToPixelPointy(ax, radius, padding));
}

/** Convert a pixel [x,y] to cube coordinate (flat-top). Rounds to nearest hex. */
export function pixelToCubeFlat([px, py], radius, padding = 0) {
  const s = radius + padding;
  const q = (MAT_PX2AX_FLAT.a * px + MAT_PX2AX_FLAT.b * py) / s;
  const r = (MAT_PX2AX_FLAT.c * px + MAT_PX2AX_FLAT.d * py) / s;
  return cubeRound(axialToCube([q, r]));
}

/** Convert a pixel [x,y] to cube coordinate (pointy-top). Rounds to nearest hex. */
export function pixelToCubePointy([px, py], radius, padding = 0) {
  const s = radius + padding;
  const q = (MAT_PX2AX_POINTY.a * px + MAT_PX2AX_POINTY.b * py) / s;
  const r = (MAT_PX2AX_POINTY.c * px + MAT_PX2AX_POINTY.d * py) / s;
  return cubeRound(axialToCube([q, r]));
}

// ── Cube <-> Pixel (convenience) ───────────────────────────────────

/** Convert a single cube coord to pixel (flat-top). */
export function cubeToPixelFlat(cube, radius, padding = 0) {
  return axialToPixelFlat(cubeToAxial(cube), radius, padding);
}

/** Convert a single cube coord to pixel (pointy-top). */
export function cubeToPixelPointy(cube, radius, padding = 0) {
  return axialToPixelPointy(cubeToAxial(cube), radius, padding);
}

/** Convert an array of cube coords to pixel coords (flat-top). */
export function cubesToPixelsFlat(cubes, radius, padding = 0) {
  return cubes.map(c => cubeToPixelFlat(c, radius, padding));
}

/** Convert an array of cube coords to pixel coords (pointy-top). */
export function cubesToPixelsPointy(cubes, radius, padding = 0) {
  return cubes.map(c => cubeToPixelPointy(c, radius, padding));
}

// ── Axial <-> Offset (even-column flat-top) ────────────────────────

/** Convert axial [q,r] to offset-even [col,row] for flat-top. */
export function axialToOffsetEvenFlat([q, r]) {
  const col = q;
  const row = r + (q + (Math.abs(q) % 2)) / 2;
  return [row, col];
}

/** Convert an array of axial coords to offset-even coords (flat-top). */
export function axialsToOffsetEvenFlat(axials) {
  return axials.map(axialToOffsetEvenFlat);
}

/** Convert axial [q,r] to offset-odd [col,row] for flat-top. */
export function axialToOffsetOddFlat([q, r]) {
  const col = q;
  const row = r + (q - (Math.abs(q) % 2)) / 2;
  return [row, col];
}

/** Convert an array of axial coords to offset-odd coords (flat-top). */
export function axialsToOffsetOddFlat(axials) {
  return axials.map(axialToOffsetOddFlat);
}

/** Convert axial [q,r] to offset-even [row,col] for pointy-top. */
export function axialToOffsetEvenPointy([q, r]) {
  const col = q + Math.floor((Math.abs(r) % 2) / 2);
  const row = r;
  return [row, col];
}

/** Convert an array of axial coords to offset-even coords (pointy-top). */
export function axialsToOffsetEvenPointy(axials) {
  return axials.map(axialToOffsetEvenPointy);
}

// ── Distance ───────────────────────────────────────────────────────

/** Manhattan distance between two cube coordinates. */
export function cubeDistance(a, b) {
  return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 2;
}

// ── Neighbors ──────────────────────────────────────────────────────

/** Get the cube coordinate of a neighbor in the given direction. */
export function cubeNeighbor(cube, direction) {
  return [cube[0] + direction[0], cube[1] + direction[1], cube[2] + direction[2]];
}

/** Get all six neighbors of a cube coordinate. */
export function cubeNeighbors(cube) {
  return DIRECTIONS.map(dir => cubeNeighbor(cube, dir));
}

// ── Line drawing ───────────────────────────────────────────────────

/** Linear interpolation between two values. */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Return all hexes on the line from start to end (inclusive). */
export function cubeLine(start, end) {
  const dist = cubeDistance(start, end);
  if (dist === 0) return [start];

  const results = [];
  for (let i = 0; i <= dist; i++) {
    const t = i / dist;
    results.push(cubeRound([
      lerp(start[0], end[0], t),
      lerp(start[1], end[1], t),
      lerp(start[2], end[2], t),
    ]));
  }
  return results;
}

// ── Ring & Spiral ──────────────────────────────────────────────────

/**
 * Return all hexes on a ring of given radius around center.
 * Uses the standard algorithm: start at a corner, walk each of 6 edges.
 */
export function cubeRing(center, radius) {
  if (radius < 0) return [];
  if (radius === 0) return [center];

  const results = [];
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < radius; k++) {
      const dirA = DIRECTIONS[(i + 5) % 6];
      const dirB = DIRECTIONS[i];
      const x = dirA[0] * (radius - k) + dirB[0] * k + center[0];
      const y = dirA[1] * (radius - k) + dirB[1] * k + center[1];
      const z = dirA[2] * (radius - k) + dirB[2] * k + center[2];
      results.push([x, y, z]);
    }
  }
  return results;
}

/**
 * Return all hexes in a spiral from radiusStart to radiusEnd (inclusive).
 * For a full disk (including center), use radiusStart = 0.
 */
export function cubeSpiral(center, radiusStart, radiusEnd) {
  const results = [];
  for (let r = radiusStart; r <= radiusEnd; r++) {
    results.push(...cubeRing(center, r));
  }
  return results;
}

/** Return all hexes within radius of center (a filled disk). */
export function cubeDisk(center, radius) {
  return cubeSpiral(center, 0, radius);
}

// ── Hex count formula ──────────────────────────────────────────────

/** Number of hexes in a hex grid of given radius (including center). */
export function hexCount(radius) {
  if (radius < 0) return 0;
  if (radius === 0) return 1;
  return 1 + 3 * radius * (radius + 1);
}

/** Estimate the radius needed for a given hex count. */
export function radiusFromHexCount(count) {
  return Math.ceil(Math.sqrt((count - 1) / 3 + 0.25) - 0.5);
}

// ── Edge/boundary checks ──────────────────────────────────────────

/** Check if a cube coordinate is on the edge ring of a grid with given radius. */
export function isOnEdge(cube, radius, center = [0, 0, 0]) {
  return cubeDistance(cube, center) === radius;
}

/** Check if a cube coordinate is within a grid of given radius centered at origin. */
export function isInGrid(cube, radius, center = [0, 0, 0]) {
  return cubeDistance(cube, center) <= radius;
}
