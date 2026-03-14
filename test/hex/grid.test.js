import { describe, it, expect } from 'vitest';
import { HexGrid } from '../../src/hex/grid.js';
import { hexCount } from '../../src/hex/coordinates.js';

describe('HexGrid constructor', () => {
  it('creates grid with correct hex count', () => {
    const grid = new HexGrid(2, 200);
    expect(grid.numHexes).toBe(19);
    expect(grid.length).toBe(19);
  });

  it('hex count matches formula for various radii', () => {
    for (const r of [1, 2, 3, 5, 10]) {
      const grid = new HexGrid(r, 100);
      expect(grid.numHexes).toBe(hexCount(r));
    }
  });

  it('rounds odd hex width up to even', () => {
    const grid = new HexGrid(1, 201);
    expect(grid.hexWidth).toBe(202);
  });

  it('throws for radius < 1', () => {
    expect(() => new HexGrid(0, 100)).toThrow('Grid radius must be >= 1');
  });

  it('throws for invalid orientation', () => {
    expect(() => new HexGrid(1, 100, 'INVALID')).toThrow('Orientation');
  });

  it('supports both orientations', () => {
    expect(() => new HexGrid(2, 200, 'FLAT')).not.toThrow();
    expect(() => new HexGrid(2, 200, 'POINTY')).not.toThrow();
  });
});

describe('HexGrid get/set', () => {
  it('all values start as null', () => {
    const grid = new HexGrid(1, 100);
    for (let i = 0; i < grid.numHexes; i++) {
      expect(grid.get(i)).toBeNull();
    }
  });

  it('set and get a value', () => {
    const grid = new HexGrid(1, 100);
    grid.set(0, 'P');
    expect(grid.get(0)).toBe('P');
  });

  it('clear resets all values to null', () => {
    const grid = new HexGrid(1, 100);
    grid.set(0, 'F');
    grid.set(3, 'M');
    grid.clear();
    for (let i = 0; i < grid.numHexes; i++) {
      expect(grid.get(i)).toBeNull();
    }
  });

  it('entries returns all key-value pairs', () => {
    const grid = new HexGrid(1, 100);
    grid.set(0, 'A');
    grid.set(1, 'B');
    const entries = grid.entries();
    expect(entries).toHaveLength(7);
    expect(entries[0]).toEqual([0, 'A']);
    expect(entries[1]).toEqual([1, 'B']);
  });
});

describe('HexGrid coordinate lookups', () => {
  it('index 0 is at origin cube [0,0,0]', () => {
    const grid = new HexGrid(2, 200);
    expect(grid.getCube(0)).toEqual([0, 0, 0]);
  });

  it('index 0 is at axial [0,0]', () => {
    const grid = new HexGrid(2, 200);
    expect(grid.getAxial(0)).toEqual([0, 0]);
  });

  it('findIndex reverses getCube', () => {
    const grid = new HexGrid(3, 200);
    for (let i = 0; i < grid.numHexes; i++) {
      const cube = grid.getCube(i);
      expect(grid.findIndex(cube)).toBe(i);
    }
  });

  it('pixel coordinates are numbers', () => {
    const grid = new HexGrid(2, 200);
    const px = grid.getPixel(0);
    expect(typeof px[0]).toBe('number');
    expect(typeof px[1]).toBe('number');
  });

  it('shifted pixels have no negative values', () => {
    const grid = new HexGrid(3, 200, 'FLAT', 10);
    for (let i = 0; i < grid.numHexes; i++) {
      const [x, y] = grid.getPixelShifted(i);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('HexGrid spatial queries', () => {
  it('center hex has 6 neighbors in radius 2 grid', () => {
    const grid = new HexGrid(2, 200);
    const neighbors = grid.getNeighborIndices(0);
    expect(neighbors).toHaveLength(6);
  });

  it('edge hex has fewer than 6 in-grid neighbors', () => {
    const grid = new HexGrid(1, 200);
    // Index 1 is on the edge of a radius-1 grid
    const neighbors = grid.getNeighborIndices(1);
    expect(neighbors.length).toBeLessThan(6);
  });

  it('distance from center to itself is 0', () => {
    const grid = new HexGrid(2, 200);
    expect(grid.getDistance(0, 0)).toBe(0);
  });

  it('distance from center to ring-1 hex is 1', () => {
    const grid = new HexGrid(2, 200);
    const neighbors = grid.getNeighborIndices(0);
    for (const n of neighbors) {
      expect(grid.getDistance(0, n)).toBe(1);
    }
  });

  it('getRingIndices returns correct count', () => {
    const grid = new HexGrid(3, 200);
    const ring2 = grid.getRingIndices(0, 2);
    expect(ring2).toHaveLength(12);
  });
});

describe('HexGrid findIndexByPixel', () => {
  it('finds center hex at its own pixel position', () => {
    const grid = new HexGrid(2, 200);
    const [cx, cy] = grid.getPixelShifted(0);
    expect(grid.findIndexByPixel(cx, cy)).toBe(0);
  });

  it('finds nearest hex to a slightly offset position', () => {
    const grid = new HexGrid(2, 200);
    const [cx, cy] = grid.getPixelShifted(3);
    // Slightly offset should still find the same hex
    expect(grid.findIndexByPixel(cx + 1, cy + 1)).toBe(3);
  });
});

describe('HexGrid bounds', () => {
  it('returns bounds with width and height', () => {
    const grid = new HexGrid(2, 200);
    const bounds = grid.getPixelBounds();
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.minX).toBeDefined();
    expect(bounds.maxX).toBeGreaterThanOrEqual(bounds.minX);
  });
});

describe('HexGrid serialization', () => {
  it('roundtrips via toJSON/fromJSON', () => {
    const grid = new HexGrid(2, 200, 'FLAT', 5, 3);
    grid.set(0, 'F');
    grid.set(5, 'M');

    const data = grid.toJSON();
    const restored = HexGrid.fromJSON(data);

    expect(restored.radius).toBe(2);
    expect(restored.hexWidth).toBe(200);
    expect(restored.orientation).toBe('FLAT');
    expect(restored.get(0)).toBe('F');
    expect(restored.get(5)).toBe('M');
    expect(restored.numHexes).toBe(19);
  });
});
