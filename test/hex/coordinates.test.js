import { describe, it, expect } from 'vitest';
import {
  cubeToAxial, axialToCube, cubesToAxial, axialsToCubes,
  cubeRound,
  axialToPixelFlat, axialToPixelPointy,
  pixelToCubeFlat, pixelToCubePointy,
  cubeToPixelFlat, cubeToPixelPointy,
  axialToOffsetEvenFlat, axialToOffsetOddFlat, axialToOffsetEvenPointy,
  cubeDistance,
  cubeNeighbor, cubeNeighbors,
  cubeLine,
  cubeRing, cubeSpiral, cubeDisk,
  hexCount, radiusFromHexCount,
  isOnEdge, isInGrid,
} from '../../src/hex/coordinates.js';
import { NE, E, SE, SW, W, NW } from '../../src/hex/directions.js';

// ── Cube <-> Axial ─────────────────────────────────────────────────

describe('cubeToAxial / axialToCube', () => {
  it('converts origin', () => {
    expect(cubeToAxial([0, 0, 0])).toEqual([0, 0]);
    expect(axialToCube([0, 0])).toEqual([0, 0, 0]);
  });

  it('roundtrips arbitrary coordinates', () => {
    const cube = [3, -5, 2];
    expect(axialToCube(cubeToAxial(cube))).toEqual(cube);
  });

  it('batch converts', () => {
    const cubes = [[1, -1, 0], [0, 0, 0], [-1, 0, 1]];
    const axials = cubesToAxial(cubes);
    expect(axials).toEqual([[1, 0], [0, 0], [-1, 1]]);
    expect(axialsToCubes(axials)).toEqual(cubes);
  });
});

// ── Cube rounding ──────────────────────────────────────────────────

describe('cubeRound', () => {
  it('rounds exact coords to themselves', () => {
    expect(cubeRound([1, -1, 0])).toEqual([1, -1, 0]);
  });

  it('rounds fractional coords preserving x+y+z=0', () => {
    const result = cubeRound([1.1, -1.4, 0.3]);
    expect(result[0] + result[1] + result[2]).toBe(0);
  });

  it('rounds coords near boundary correctly', () => {
    const result = cubeRound([0.5, -0.9, 0.4]);
    expect(result[0] + result[1] + result[2]).toBe(0);
  });
});

// ── Pixel conversions ──────────────────────────────────────────────

describe('axialToPixel / pixelToCube', () => {
  it('origin maps to pixel (0,0) for both orientations', () => {
    expect(axialToPixelFlat([0, 0], 100)).toEqual([0, 0]);
    expect(axialToPixelPointy([0, 0], 100)).toEqual([0, 0]);
  });

  it('flat-top roundtrips through pixel', () => {
    const cube = [2, -1, -1];
    const px = cubeToPixelFlat(cube, 100);
    const back = pixelToCubeFlat(px, 100);
    expect(back).toEqual(cube);
  });

  it('pointy-top roundtrips through pixel', () => {
    const cube = [1, -2, 1];
    const px = cubeToPixelPointy(cube, 100);
    const back = pixelToCubePointy(px, 100);
    expect(back).toEqual(cube);
  });

  it('accounts for padding in flat-top', () => {
    const px1 = axialToPixelFlat([1, 0], 100, 0);
    const px2 = axialToPixelFlat([1, 0], 100, 5);
    // With padding, pixel positions are further apart
    expect(px2[0]).toBeGreaterThan(px1[0]);
  });
});

// ── Offset conversions ─────────────────────────────────────────────

describe('axialToOffset', () => {
  it('origin maps to (0,0) for even-flat', () => {
    expect(axialToOffsetEvenFlat([0, 0])).toEqual([0, 0]);
  });

  it('origin maps to (0,0) for odd-flat', () => {
    expect(axialToOffsetOddFlat([0, 0])).toEqual([0, 0]);
  });

  it('origin maps to (0,0) for even-pointy', () => {
    expect(axialToOffsetEvenPointy([0, 0])).toEqual([0, 0]);
  });
});

// ── Distance ───────────────────────────────────────────────────────

describe('cubeDistance', () => {
  it('distance from origin to itself is 0', () => {
    expect(cubeDistance([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('distance to adjacent hex is 1', () => {
    expect(cubeDistance([0, 0, 0], [1, -1, 0])).toBe(1);
  });

  it('distance across grid', () => {
    expect(cubeDistance([3, -3, 0], [-3, 3, 0])).toBe(6);
  });

  it('is symmetric', () => {
    const a = [2, -1, -1];
    const b = [-1, 3, -2];
    expect(cubeDistance(a, b)).toBe(cubeDistance(b, a));
  });
});

// ── Neighbors ──────────────────────────────────────────────────────

describe('cubeNeighbor / cubeNeighbors', () => {
  it('NE neighbor of origin', () => {
    expect(cubeNeighbor([0, 0, 0], NE)).toEqual([0, -1, 1]);
  });

  it('origin has 6 neighbors', () => {
    const neighbors = cubeNeighbors([0, 0, 0]);
    expect(neighbors).toHaveLength(6);
    neighbors.forEach(n => {
      expect(n[0] + n[1] + n[2]).toBe(0);
      expect(cubeDistance([0, 0, 0], n)).toBe(1);
    });
  });
});

// ── Line drawing ───────────────────────────────────────────────────

describe('cubeLine', () => {
  it('line from hex to itself is single element', () => {
    expect(cubeLine([0, 0, 0], [0, 0, 0])).toEqual([[0, 0, 0]]);
  });

  it('line between adjacent hexes has 2 elements', () => {
    const line = cubeLine([0, 0, 0], [1, -1, 0]);
    expect(line).toHaveLength(2);
  });

  it('line length equals distance + 1', () => {
    const start = [0, 0, 0];
    const end = [3, -3, 0];
    const line = cubeLine(start, end);
    expect(line).toHaveLength(cubeDistance(start, end) + 1);
  });

  it('all hexes on line satisfy x+y+z=0', () => {
    const line = cubeLine([0, 0, 0], [2, -3, 1]);
    line.forEach(h => expect(h[0] + h[1] + h[2]).toBe(0));
  });
});

// ── Ring & Spiral ──────────────────────────────────────────────────

describe('cubeRing', () => {
  it('ring of radius 0 is just the center', () => {
    expect(cubeRing([0, 0, 0], 0)).toEqual([[0, 0, 0]]);
  });

  it('ring of negative radius is empty', () => {
    expect(cubeRing([0, 0, 0], -1)).toEqual([]);
  });

  it('ring of radius 1 has 6 hexes', () => {
    const ring = cubeRing([0, 0, 0], 1);
    expect(ring).toHaveLength(6);
    ring.forEach(h => {
      expect(h[0] + h[1] + h[2]).toBe(0);
      expect(cubeDistance([0, 0, 0], h)).toBe(1);
    });
  });

  it('ring of radius r has 6*r hexes', () => {
    for (let r = 1; r <= 5; r++) {
      expect(cubeRing([0, 0, 0], r)).toHaveLength(6 * r);
    }
  });

  it('all hexes on ring are at correct distance', () => {
    const r = 3;
    const ring = cubeRing([0, 0, 0], r);
    ring.forEach(h => expect(cubeDistance([0, 0, 0], h)).toBe(r));
  });
});

describe('cubeSpiral / cubeDisk', () => {
  it('spiral from 0 to r gives all hexes in disk', () => {
    const disk = cubeDisk([0, 0, 0], 2);
    expect(disk).toHaveLength(hexCount(2));
  });

  it('spiral from 1 to 2 excludes center', () => {
    const spiral = cubeSpiral([0, 0, 0], 1, 2);
    expect(spiral).toHaveLength(6 + 12); // ring1 + ring2
    const hasOrigin = spiral.some(h => h[0] === 0 && h[1] === 0 && h[2] === 0);
    expect(hasOrigin).toBe(false);
  });
});

// ── Hex count ──────────────────────────────────────────────────────

describe('hexCount', () => {
  it('radius 0 = 1 hex', () => expect(hexCount(0)).toBe(1));
  it('radius 1 = 7 hexes', () => expect(hexCount(1)).toBe(7));
  it('radius 2 = 19 hexes', () => expect(hexCount(2)).toBe(19));
  it('radius 4 = 61 hexes', () => expect(hexCount(4)).toBe(61));
  it('radius 40 = 4921 hexes', () => expect(hexCount(40)).toBe(4921));
  it('negative radius = 0', () => expect(hexCount(-1)).toBe(0));
});

describe('radiusFromHexCount', () => {
  it('roundtrips for exact counts', () => {
    for (let r = 0; r <= 10; r++) {
      expect(radiusFromHexCount(hexCount(r))).toBe(r);
    }
  });
});

// ── Edge/boundary checks ──────────────────────────────────────────

describe('isOnEdge / isInGrid', () => {
  it('origin is not on edge of radius > 0', () => {
    expect(isOnEdge([0, 0, 0], 2)).toBe(false);
  });

  it('origin is on edge of radius 0', () => {
    expect(isOnEdge([0, 0, 0], 0)).toBe(true);
  });

  it('origin is in grid', () => {
    expect(isInGrid([0, 0, 0], 5)).toBe(true);
  });

  it('hex at radius distance is on edge', () => {
    expect(isOnEdge([2, -2, 0], 2)).toBe(true);
  });

  it('hex outside radius is not in grid', () => {
    expect(isInGrid([5, -5, 0], 3)).toBe(false);
  });
});
