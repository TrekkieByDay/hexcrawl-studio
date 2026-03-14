// generation/roll-table.js -- Load, validate, and roll on roll tables.

import { rollDice, diceRange, random } from './dice.js';
import { REQUIRED_SECTIONS } from '../constants.js';

/**
 * Parse and validate a roll table config object.
 * @param {object} config - Raw rolltable config
 * @returns {object} The validated config
 */
export function validateRollTableConfig(config) {
  if (!config.SECTIONS) {
    throw new Error('Roll table config missing SECTIONS');
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!config.SECTIONS[section]) {
      throw new Error(`Roll table config missing required section: "${section}"`);
    }
  }

  // Validate coverage for each section
  for (const [name, section] of Object.entries(config.SECTIONS)) {
    validateSectionCoverage(name, section);
  }

  return config;
}

/**
 * Check that a section's roll ranges cover every possible dice outcome.
 */
function validateSectionCoverage(sectionName, section) {
  const { min, max } = diceRange(section.dice);
  const covered = new Set();

  for (const key of Object.keys(section.rolls)) {
    if (key.includes('-')) {
      const [low, high] = key.split('-').map(Number);
      for (let i = low; i <= high; i++) covered.add(i);
    } else {
      covered.add(Number(key));
    }
  }

  for (let i = min; i <= max; i++) {
    if (!covered.has(i)) {
      console.warn(`Roll value ${i} not covered in section "${sectionName}"`);
    }
  }
}

/**
 * Look up a roll result in a section's rolls table.
 * Handles single values ("7") and ranges ("4-6").
 * Handles "||" alternation by picking randomly.
 *
 * @param {object} rolls - The rolls object { "2-3": ["result"], ... }
 * @param {number} roll - The dice roll value
 * @returns {string|null} The matched result string, or null if not found
 */
export function matchRoll(rolls, roll) {
  for (const [key, value] of Object.entries(rolls)) {
    let matches = false;

    if (key.includes('-')) {
      const [low, high] = key.split('-').map(Number);
      matches = roll >= low && roll <= high;
    } else {
      matches = Number(key) === roll;
    }

    if (matches) {
      // value[0] may contain "||" for alternation
      const result = value[0];
      if (result.includes('||')) {
        const options = result.split('||');
        return options[Math.floor(random() * options.length)];
      }
      return result;
    }
  }
  return null;
}

/**
 * Roll on a specific section of a roll table config.
 * @param {object} config - Full rolltable config
 * @param {string} sectionName - e.g. "TERRAIN", "META INFO 1"
 * @returns {string|null}
 */
export function rollOnSection(config, sectionName) {
  const section = config.SECTIONS[sectionName];
  if (!section) throw new Error(`Section "${sectionName}" not found`);

  const roll = rollDice(section.dice);
  return matchRoll(section.rolls, roll);
}

/**
 * Roll on a multi-column section (e.g. POINTS OF INTEREST).
 * Returns all columns for the matched roll.
 *
 * @param {object} config - Full rolltable config
 * @param {string} sectionName
 * @returns {string[]} Array of column values
 */
export function rollOnSectionMultiCol(config, sectionName) {
  const section = config.SECTIONS[sectionName];
  if (!section) throw new Error(`Section "${sectionName}" not found`);

  const roll = rollDice(section.dice);

  for (const [key, value] of Object.entries(section.rolls)) {
    let matches = false;
    if (key.includes('-')) {
      const [low, high] = key.split('-').map(Number);
      matches = roll >= low && roll <= high;
    } else {
      matches = Number(key) === roll;
    }

    if (matches) {
      return value.map(v => {
        if (v.includes('||')) {
          const options = v.split('||');
          return options[Math.floor(random() * options.length)];
        }
        return v;
      });
    }
  }

  return [];
}

/**
 * Look up a biome symbol from the config's BIOME SYMBOLS section.
 * @param {string} terrainName - e.g. "Forest"
 * @param {object} config - Full rolltable config
 * @returns {string} Biome code (e.g. "F")
 */
export function getBiomeSymbol(terrainName, config) {
  return (config['BIOME SYMBOLS'] && config['BIOME SYMBOLS'][terrainName]) || terrainName;
}
