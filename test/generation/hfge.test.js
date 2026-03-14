import { describe, it, expect, beforeEach } from 'vitest';
import { HexFlowerGameEngine, TERRAIN_TEMPERATE, TERRAIN_ARID, HEX2HFGE, HFGE2HEX } from '../../src/generation/hfge.js';
import { HexGrid } from '../../src/hex/grid.js';
import { setSeed } from '../../src/generation/dice.js';
import { BIOMES } from '../../src/constants.js';
import { hexCount } from '../../src/hex/coordinates.js';

beforeEach(() => {
  setSeed(42);
});

describe('HFGE index mappings', () => {
  it('HEX2HFGE has 19 entries (0-18)', () => {
    expect(Object.keys(HEX2HFGE)).toHaveLength(19);
  });

  it('HFGE2HEX has 19 entries (1-19)', () => {
    expect(Object.keys(HFGE2HEX)).toHaveLength(19);
  });

  it('roundtrips: HEX2HFGE and HFGE2HEX are inverses', () => {
    for (const [hexIdx, hfgeIdx] of Object.entries(HEX2HFGE)) {
      expect(HFGE2HEX[hfgeIdx]).toBe(Number(hexIdx));
    }
  });
});

describe('TERRAIN_TEMPERATE', () => {
  it('has 19 positions', () => {
    expect(Object.keys(TERRAIN_TEMPERATE)).toHaveLength(19);
  });

  it('center (10) is PLAINS', () => {
    expect(TERRAIN_TEMPERATE[10]).toBe(BIOMES.PLAINS);
  });

  it('position 19 is MOUNTAIN', () => {
    expect(TERRAIN_TEMPERATE[19]).toBe(BIOMES.MOUNTAIN);
  });

  it('all values are valid biome codes', () => {
    const validBiomes = Object.values(BIOMES);
    for (const biome of Object.values(TERRAIN_TEMPERATE)) {
      expect(validBiomes).toContain(biome);
    }
  });
});

describe('HexFlowerGameEngine', () => {
  it('constructs with defaults', () => {
    const hfge = new HexFlowerGameEngine();
    expect(hfge.hexCurrent).toBe(10);
    expect(hfge.radius).toBe(2);
  });

  it('nextHex returns a valid HFGE position (1-19)', () => {
    const hfge = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 42);
    for (let i = 0; i < 100; i++) {
      const pos = hfge.nextHex();
      expect(pos).toBeGreaterThanOrEqual(1);
      expect(pos).toBeLessThanOrEqual(19);
    }
  });

  it('is deterministic with same seed', () => {
    setSeed(123);
    const hfge1 = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 123);
    const results1 = Array.from({ length: 20 }, () => hfge1.nextHex());

    setSeed(123);
    const hfge2 = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 123);
    const results2 = Array.from({ length: 20 }, () => hfge2.nextHex());

    expect(results1).toEqual(results2);
  });

  it('different seeds produce different results', () => {
    setSeed(1);
    const hfge1 = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 1);
    const results1 = Array.from({ length: 20 }, () => hfge1.nextHex());

    setSeed(2);
    const hfge2 = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 2);
    const results2 = Array.from({ length: 20 }, () => hfge2.nextHex());

    expect(results1).not.toEqual(results2);
  });

  it('getCurrentBiome returns a valid biome', () => {
    const hfge = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 42);
    hfge.nextHex();
    const biome = hfge.getCurrentBiome();
    expect(Object.values(BIOMES)).toContain(biome);
  });
});

describe('HexFlowerGameEngine.generateTerrain', () => {
  it('populates all hexes in a radius-1 grid', () => {
    const hfge = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 42);
    const grid = new HexGrid(1, 200);
    hfge.generateTerrain(grid);

    for (let i = 0; i < grid.numHexes; i++) {
      expect(grid.get(i)).not.toBeNull();
      expect(Object.values(BIOMES)).toContain(grid.get(i));
    }
  });

  it('populates all hexes in a radius-4 grid', () => {
    const hfge = new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 42);
    const grid = new HexGrid(4, 200);
    hfge.generateTerrain(grid);

    expect(grid.numHexes).toBe(hexCount(4));
    for (let i = 0; i < grid.numHexes; i++) {
      expect(grid.get(i)).not.toBeNull();
    }
  });

  it('is deterministic: same seed produces same terrain', () => {
    const grid1 = new HexGrid(3, 200);
    new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 99).generateTerrain(grid1);

    const grid2 = new HexGrid(3, 200);
    new HexFlowerGameEngine(2, TERRAIN_TEMPERATE, 99).generateTerrain(grid2);

    for (let i = 0; i < grid1.numHexes; i++) {
      expect(grid1.get(i)).toBe(grid2.get(i));
    }
  });

  it('works with arid terrain map', () => {
    const hfge = new HexFlowerGameEngine(2, TERRAIN_ARID, 42);
    const grid = new HexGrid(2, 200);
    hfge.generateTerrain(grid);

    for (let i = 0; i < grid.numHexes; i++) {
      expect(grid.get(i)).not.toBeNull();
    }
  });
});
