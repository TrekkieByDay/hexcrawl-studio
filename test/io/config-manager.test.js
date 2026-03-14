import { describe, it, expect } from 'vitest';
import { validateSpriteConfig, validatePaletteConfig, validateRolltableConfig, parseConfig } from '../../src/io/config-manager.js';

describe('validateSpriteConfig', () => {
  const VALID_SPRITE_CONFIG = {
    meta: { orientation: 'FLAT', size: '200px', directory: './assets/' },
    tiles: {
      P: [['grass1.webp', 0.5], ['grass2.webp', 0.5]],
      F: [['tree1.webp', 1.0]],
    },
    overlay: {
      Safe: [['safe.webp', 1.0]],
    },
    icons: { P: 'icon_p.webp' },
    ui: { select_blue: 'select.webp' },
    indexing: { index_background_white: 'idx_w.webp', index_background_black: 'idx_b.webp' },
    backfill: { backfill_white: 'bf_w.webp', backfill_black: 'bf_b.webp' },
  };

  it('accepts a valid config', () => {
    const result = validateSpriteConfig(VALID_SPRITE_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects config missing meta', () => {
    const config = { ...VALID_SPRITE_CONFIG, meta: undefined };
    const result = validateSpriteConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('meta'))).toBe(true);
  });

  it('rejects config with invalid orientation', () => {
    const config = { ...VALID_SPRITE_CONFIG, meta: { orientation: 'DIAGONAL' } };
    const result = validateSpriteConfig(config);
    expect(result.valid).toBe(false);
  });

  it('rejects config missing tiles', () => {
    const config = { ...VALID_SPRITE_CONFIG, tiles: undefined };
    const result = validateSpriteConfig(config);
    expect(result.valid).toBe(false);
  });

  it('reports invalid deck weights', () => {
    const config = {
      ...VALID_SPRITE_CONFIG,
      tiles: { BAD: [['x.webp', 0.3]] },
    };
    const result = validateSpriteConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('BAD'))).toBe(true);
  });
});

describe('validatePaletteConfig', () => {
  it('accepts valid palette', () => {
    const config = {
      colors: {
        P: { name: 'plains', color_hex: '#A2CD5A', color_name: 'Yellow Green' },
        F: { name: 'forest', color_hex: '#228B22', color_name: 'Forest Green' },
      },
    };
    const result = validatePaletteConfig(config);
    expect(result.valid).toBe(true);
  });

  it('accepts flat format (no colors wrapper)', () => {
    const config = {
      P: { name: 'plains', color_hex: '#A2CD5A' },
    };
    const result = validatePaletteConfig(config);
    expect(result.valid).toBe(true);
  });

  it('rejects entry missing color_hex', () => {
    const config = {
      colors: {
        P: { name: 'plains' },
      },
    };
    const result = validatePaletteConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('color_hex'))).toBe(true);
  });

  it('rejects empty config', () => {
    const result = validatePaletteConfig({});
    expect(result.valid).toBe(false);
  });
});

describe('validateRolltableConfig', () => {
  const VALID_ROLLTABLE = {
    SECTIONS: {
      TERRAIN: { dice: '2d6', rolls: { '2': ['Desert'], '3': ['Swamp'], '4-6': ['Grassland'], '7-8': ['Forest'], '9-10': ['River'], '11': ['Ocean'], '12': ['Mountain'] } },
      'NEW HEX': { dice: '2d6', rolls: { '2-3': ['Step +1'], '4-8': ['Same'], '9-11': ['Step +2'], '12': ['Reroll'] } },
      'META INFO 1': { dice: '1d6', rolls: { '1': ['Safe'], '2-3': ['Unsafe'], '4-5': ['Risky'], '6': ['Deadly'] } },
      'POI CHECK': { dice: '1d6', rolls: { '1': ['Yes'], '2-6': ['No'] } },
      'POINTS OF INTEREST': { dice: '1d6', cols: 2, rolls: { '1': ['Tower', 'Disaster'], '2': ['Keep', 'Tomb'], '3-4': ['Village', 'Ruins'], '5': ['Temple', 'Oracle'], '6': ['Cave', 'Treasure'] } },
    },
  };

  it('accepts valid rolltable', () => {
    const result = validateRolltableConfig(VALID_ROLLTABLE);
    expect(result.valid).toBe(true);
  });

  it('rejects rolltable missing required section', () => {
    const config = { SECTIONS: { TERRAIN: VALID_ROLLTABLE.SECTIONS.TERRAIN } };
    const result = validateRolltableConfig(config);
    expect(result.valid).toBe(false);
  });
});

describe('parseConfig', () => {
  it('parses valid JSON', () => {
    const result = parseConfig('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('throws for invalid JSON', () => {
    expect(() => parseConfig('not json')).toThrow('Failed to parse');
  });
});
