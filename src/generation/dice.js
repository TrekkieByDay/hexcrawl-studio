// generation/dice.js -- Dice notation parsing and rolling.

import seedrandom from 'seedrandom';

let rng = Math.random;

/**
 * Set the global RNG seed for deterministic rolls.
 * @param {number|string} seed
 */
export function setSeed(seed) {
  rng = seedrandom(seed);
}

/** Reset to non-deterministic Math.random. */
export function resetRng() {
  rng = Math.random;
}

/** Get a random float in [0, 1) using the current RNG. */
export function random() {
  return rng();
}

/** Get a random integer in [min, max] inclusive. */
export function randomInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Parse dice notation string (e.g. "2d6", "1d20").
 * @param {string} notation - NdS format
 * @returns {{ count: number, sides: number }}
 */
export function parseDice(notation) {
  const match = notation.match(/^(\d+)d(\d+)$/);
  if (!match) throw new Error(`Invalid dice notation: "${notation}"`);
  return { count: Number(match[1]), sides: Number(match[2]) };
}

/**
 * Roll dice from a notation string.
 * @param {string} notation - NdS format (e.g. "2d6")
 * @returns {number} Sum of dice rolled
 */
export function rollDice(notation) {
  const { count, sides } = parseDice(notation);
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += randomInt(1, sides);
  }
  return total;
}

/**
 * Roll a single die with given number of sides.
 * @param {number} sides
 * @returns {number} 1 to sides inclusive
 */
export function rollDie(sides) {
  return randomInt(1, sides);
}

/**
 * Get min and max possible values for a dice notation.
 * @param {string} notation
 * @returns {{ min: number, max: number }}
 */
export function diceRange(notation) {
  const { count, sides } = parseDice(notation);
  return { min: count, max: count * sides };
}
