// io/config-manager.js -- Load and validate sprite/rolltable/palette configs.

import { ORIENTATIONS } from '../constants.js';
import { validateAllDecks } from '../sprites/probability-deck.js';
import { validateRollTableConfig } from '../generation/roll-table.js';

/**
 * Validate a sprite config object.
 * Checks required sections, orientation, and probability deck weights.
 *
 * @param {object} config - Raw sprite config
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSpriteConfig(config) {
  const errors = [];

  if (!config.meta) errors.push('Missing "meta" section');
  if (config.meta && !['FLAT', 'POINTY'].includes(config.meta.orientation)) {
    errors.push(`Invalid orientation: "${config.meta.orientation}"`);
  }
  if (!config.tiles) errors.push('Missing "tiles" section');
  if (!config.backfill) errors.push('Missing "backfill" section');
  if (!config.indexing) errors.push('Missing "indexing" section');
  if (!config.ui) errors.push('Missing "ui" section');

  // Validate probability decks in tiles
  if (config.tiles) {
    errors.push(...validateAllDecks(config.tiles));
  }

  // Validate overlay decks if present
  if (config.overlay) {
    errors.push(...validateAllDecks(config.overlay));
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a palette config object.
 * Checks that entries have required fields.
 *
 * @param {object} config - Raw palette config (may have a "colors" wrapper or be flat)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePaletteConfig(config) {
  const errors = [];

  // Support both flat format and { meta, colors } wrapper
  const colors = config.colors || config;

  if (typeof colors !== 'object' || Object.keys(colors).length === 0) {
    errors.push('Palette config has no color entries');
    return { valid: false, errors };
  }

  for (const [key, entry] of Object.entries(colors)) {
    if (key === 'meta') continue; // Skip meta section
    if (!entry.color_hex) errors.push(`Palette entry "${key}" missing "color_hex"`);
    if (!entry.name) errors.push(`Palette entry "${key}" missing "name"`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a rolltable config and return structured result.
 *
 * @param {object} config - Raw rolltable config
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRolltableConfig(config) {
  try {
    validateRollTableConfig(config);
    return { valid: true, errors: [] };
  } catch (e) {
    return { valid: false, errors: [e.message] };
  }
}

/**
 * Parse a JSON string into a config object.
 * @param {string} jsonString
 * @returns {object}
 */
export function parseConfig(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`Failed to parse config JSON: ${e.message}`);
  }
}
