import { describe, it, expect } from 'vitest';
import { generateMapData } from '../../src/generation/terrain-roller.js';
import { TERRAIN_TEMPERATE, TERRAIN_ARID } from '../../src/generation/hfge.js';
import { BIOMES } from '../../src/constants.js';
import { hexCount } from '../../src/hex/coordinates.js';

// Minimal valid rolltable config
const ROLLTABLE_CONFIG = {
  meta: { algorithm: 'Test' },
  SECTIONS: {
    TERRAIN: {
      dice: '2d6', cols: 1, 'col headers': [],
      rolls: { '2': ['Desert'], '3': ['Swamp'], '4-6': ['Grassland'], '7-8': ['Forest'], '9-10': ['River'], '11': ['Ocean'], '12': ['Mountain'] },
    },
    'NEW HEX': {
      dice: '2d6', cols: 1, 'col headers': [],
      rolls: { '2-3': ['Current terrain +1 step'], '4-8': ['Same as current terrain'], '9-11': ['Current terrain +2 steps'], '12': ['Roll a new hex terrain'] },
    },
    'META INFO 1': {
      dice: '1d6', cols: 1, 'col headers': [],
      rolls: { '1': ['Safe'], '2-3': ['Unsafe'], '4-5': ['Risky'], '6': ['Deadly'] },
    },
    'POI CHECK': {
      dice: '1d6', cols: 1, 'col headers': [],
      rolls: { '1': ['Yes'], '2-6': ['No'] },
    },
    'POINTS OF INTEREST': {
      dice: '1d6', cols: 2, 'col headers': ['Location', 'Development'],
      rolls: { '1': ['Tower', 'Disaster!'], '2': ['Keep', 'Tomb'], '3-4': ['Village', 'Ruins'], '5': ['Temple', 'Oracle'], '6': ['Cave', 'Treasure'] },
    },
    'MAJOR EVENT': {
      dice: '1d8', cols: 1, 'col headers': [],
      rolls: { '1': ['Volcano'], '2': ['Fire'], '3': ['Earthquake'], '4': ['Storm'], '5': ['Flood'], '6': ['War'], '7': ['Pestilence'], '8': ['Magic'] },
    },
  },
  'BIOME SYMBOLS': { Desert: 'D', Forest: 'F', Grassland: 'P', Mountain: 'M', Swamp: 'S' },
};

describe('generateMapData', () => {
  const params = {
    seed: 42,
    radius: 3,
    hexWidth: 200,
    rolltableConfig: ROLLTABLE_CONFIG,
  };

  it('returns all expected grids', () => {
    const result = generateMapData(params);
    expect(result.terrainGrid).toBeDefined();
    expect(result.metaInfoGrid).toBeDefined();
    expect(result.poiGrid).toBeDefined();
    expect(result.iconGrid).toBeDefined();
    expect(result.indexGrid).toBeDefined();
  });

  it('all grids have correct hex count', () => {
    const result = generateMapData(params);
    const expected = hexCount(3);
    expect(result.terrainGrid.numHexes).toBe(expected);
    expect(result.metaInfoGrid.numHexes).toBe(expected);
    expect(result.poiGrid.numHexes).toBe(expected);
    expect(result.iconGrid.numHexes).toBe(expected);
    expect(result.indexGrid.numHexes).toBe(expected);
  });

  it('every hex has a terrain biome code', () => {
    const result = generateMapData(params);
    const validBiomes = Object.values(BIOMES);
    for (let i = 0; i < result.terrainGrid.numHexes; i++) {
      expect(validBiomes).toContain(result.terrainGrid.get(i));
    }
  });

  it('every hex has a meta info value', () => {
    const result = generateMapData(params);
    const validMeta = ['Safe', 'Unsafe', 'Risky', 'Deadly'];
    for (let i = 0; i < result.metaInfoGrid.numHexes; i++) {
      expect(validMeta).toContain(result.metaInfoGrid.get(i));
    }
  });

  it('POI grid has null or {name, development} per hex', () => {
    const result = generateMapData(params);
    for (let i = 0; i < result.poiGrid.numHexes; i++) {
      const poi = result.poiGrid.get(i);
      if (poi !== null) {
        expect(poi).toHaveProperty('name');
        expect(poi).toHaveProperty('development');
      }
    }
  });

  it('icon grid matches terrain grid biome codes', () => {
    const result = generateMapData(params);
    for (let i = 0; i < result.iconGrid.numHexes; i++) {
      expect(result.iconGrid.get(i)).toBe(result.terrainGrid.get(i));
    }
  });

  it('index grid has num, axial, even per hex', () => {
    const result = generateMapData(params);
    for (let i = 0; i < result.indexGrid.numHexes; i++) {
      const idx = result.indexGrid.get(i);
      expect(idx.num).toBe(i);
      expect(idx.axial).toHaveLength(2);
      expect(idx.even).toHaveLength(2);
    }
  });

  it('is deterministic: same seed produces identical output', () => {
    const result1 = generateMapData(params);
    const result2 = generateMapData(params);

    for (let i = 0; i < result1.terrainGrid.numHexes; i++) {
      expect(result1.terrainGrid.get(i)).toBe(result2.terrainGrid.get(i));
      expect(result1.metaInfoGrid.get(i)).toBe(result2.metaInfoGrid.get(i));
      expect(result1.iconGrid.get(i)).toBe(result2.iconGrid.get(i));
    }
  });

  it('different seeds produce different terrain', () => {
    const result1 = generateMapData({ ...params, seed: 1 });
    const result2 = generateMapData({ ...params, seed: 2 });

    let same = true;
    for (let i = 0; i < result1.terrainGrid.numHexes; i++) {
      if (result1.terrainGrid.get(i) !== result2.terrainGrid.get(i)) {
        same = false;
        break;
      }
    }
    expect(same).toBe(false);
  });

  it('works with arid terrain map', () => {
    const result = generateMapData({ ...params, terrainMap: TERRAIN_ARID });
    for (let i = 0; i < result.terrainGrid.numHexes; i++) {
      expect(result.terrainGrid.get(i)).not.toBeNull();
    }
  });

  it('works at radius 5 (91 hexes)', () => {
    const result = generateMapData({ ...params, radius: 5 });
    expect(result.terrainGrid.numHexes).toBe(hexCount(5));
    for (let i = 0; i < result.terrainGrid.numHexes; i++) {
      expect(result.terrainGrid.get(i)).not.toBeNull();
    }
  });
});
