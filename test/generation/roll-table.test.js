import { describe, it, expect, beforeEach } from 'vitest';
import { validateRollTableConfig, matchRoll, rollOnSection, rollOnSectionMultiCol, getBiomeSymbol } from '../../src/generation/roll-table.js';
import { setSeed } from '../../src/generation/dice.js';

// Minimal valid config for testing
const VALID_CONFIG = {
  meta: { algorithm: 'Test' },
  SECTIONS: {
    TERRAIN: {
      dice: '2d6',
      cols: 1,
      'col headers': [],
      rolls: {
        '2': ['Desert'],
        '3': ['Swamp'],
        '4-6': ['Grassland'],
        '7-8': ['Forest||Jungle'],
        '9-10': ['River||Coast||Lake'],
        '11': ['Ocean'],
        '12': ['Mountain'],
      },
    },
    'NEW HEX': {
      dice: '2d6',
      cols: 1,
      'col headers': [],
      rolls: {
        '2-3': ['Current terrain +1 step'],
        '4-8': ['Same as current terrain'],
        '9-11': ['Current terrain +2 steps'],
        '12': ['Roll a new hex terrain'],
      },
    },
    'META INFO 1': {
      dice: '1d6',
      cols: 1,
      'col headers': [],
      rolls: {
        '1': ['Safe'],
        '2-3': ['Unsafe'],
        '4-5': ['Risky'],
        '6': ['Deadly'],
      },
    },
    'POI CHECK': {
      dice: '1d6',
      cols: 1,
      'col headers': [],
      rolls: {
        '1': ['Yes'],
        '2-6': ['No'],
      },
    },
    'POINTS OF INTEREST': {
      dice: '1d6',
      cols: 2,
      'col headers': ['Location', 'Development'],
      rolls: {
        '1': ['Small tower', 'Disaster!'],
        '2': ['Keep', 'Tomb'],
        '3-4': ['Village', 'Ruins'],
        '5': ['Temple', 'Oracle'],
        '6': ['Cave', 'Treasure'],
      },
    },
  },
  'BIOME SYMBOLS': {
    Desert: 'D',
    Forest: 'F',
    Grassland: 'P',
    Mountain: 'M',
    Swamp: 'S',
  },
};

beforeEach(() => {
  setSeed(42);
});

describe('validateRollTableConfig', () => {
  it('accepts a valid config', () => {
    expect(() => validateRollTableConfig(VALID_CONFIG)).not.toThrow();
  });

  it('throws if SECTIONS missing', () => {
    expect(() => validateRollTableConfig({})).toThrow('missing SECTIONS');
  });

  it('throws if a required section is missing', () => {
    const config = {
      SECTIONS: {
        TERRAIN: VALID_CONFIG.SECTIONS.TERRAIN,
        'NEW HEX': VALID_CONFIG.SECTIONS['NEW HEX'],
        // Missing META INFO 1, POI CHECK, POINTS OF INTEREST
      },
    };
    expect(() => validateRollTableConfig(config)).toThrow('META INFO 1');
  });
});

describe('matchRoll', () => {
  const rolls = {
    '1': ['Safe'],
    '2-3': ['Unsafe'],
    '4-5': ['Risky'],
    '6': ['Deadly'],
  };

  it('matches exact value', () => {
    expect(matchRoll(rolls, 1)).toBe('Safe');
    expect(matchRoll(rolls, 6)).toBe('Deadly');
  });

  it('matches range', () => {
    expect(matchRoll(rolls, 2)).toBe('Unsafe');
    expect(matchRoll(rolls, 3)).toBe('Unsafe');
    expect(matchRoll(rolls, 4)).toBe('Risky');
  });

  it('returns null for unmatched', () => {
    expect(matchRoll(rolls, 7)).toBeNull();
  });

  it('handles alternation (||)', () => {
    const altRolls = { '1': ['A||B||C'] };
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(matchRoll(altRolls, 1));
    }
    // Should produce at least 2 different values
    expect(results.size).toBeGreaterThanOrEqual(2);
    // All values should be one of A, B, C
    for (const r of results) {
      expect(['A', 'B', 'C']).toContain(r);
    }
  });
});

describe('rollOnSection', () => {
  it('returns a valid terrain result', () => {
    const validTerrains = ['Desert', 'Swamp', 'Grassland', 'Forest', 'Jungle',
      'River', 'Coast', 'Lake', 'Ocean', 'Mountain'];
    for (let i = 0; i < 50; i++) {
      const result = rollOnSection(VALID_CONFIG, 'TERRAIN');
      expect(validTerrains).toContain(result);
    }
  });

  it('returns a valid meta info result', () => {
    const validMeta = ['Safe', 'Unsafe', 'Risky', 'Deadly'];
    for (let i = 0; i < 50; i++) {
      const result = rollOnSection(VALID_CONFIG, 'META INFO 1');
      expect(validMeta).toContain(result);
    }
  });

  it('throws for unknown section', () => {
    expect(() => rollOnSection(VALID_CONFIG, 'NONEXISTENT')).toThrow();
  });
});

describe('rollOnSectionMultiCol', () => {
  it('returns array with correct number of columns', () => {
    const result = rollOnSectionMultiCol(VALID_CONFIG, 'POINTS OF INTEREST');
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('string');
    expect(typeof result[1]).toBe('string');
  });
});

describe('getBiomeSymbol', () => {
  it('maps terrain name to biome code', () => {
    expect(getBiomeSymbol('Forest', VALID_CONFIG)).toBe('F');
    expect(getBiomeSymbol('Desert', VALID_CONFIG)).toBe('D');
  });

  it('returns terrain name if no mapping exists', () => {
    expect(getBiomeSymbol('Unknown', VALID_CONFIG)).toBe('Unknown');
  });
});
