// sprites/probability-deck.js -- Weighted random selection from sprite decks.

import { random } from '../generation/dice.js';

/**
 * Select an item from a probability deck using weighted random selection.
 *
 * A deck is an array of [item, weight] pairs where weights are individual
 * probabilities that sum to 1.0 (e.g. [["file.webp", 0.3], ["file2.webp", 0.7]]).
 *
 * @param {Array<[string, number]>} deck - Array of [item, weight] pairs
 * @returns {string} The selected item
 */
export function selectFromDeck(deck) {
  if (!deck || deck.length === 0) {
    throw new Error('Cannot select from empty deck');
  }

  const roll = random();
  let cumulative = 0;

  for (const [item, weight] of deck) {
    cumulative += weight;
    if (roll < cumulative) {
      return item;
    }
  }

  // Floating point safety: return last item if roll rounds to exactly 1.0
  return deck[deck.length - 1][0];
}

/**
 * Validate that a probability deck's weights sum to ~1.0.
 *
 * @param {Array<[string, number]>} deck
 * @param {number} [tolerance=0.01] - Acceptable deviation from 1.0
 * @returns {boolean}
 */
export function validateDeck(deck) {
  if (!deck || deck.length === 0) return false;

  const total = deck.reduce((sum, [, weight]) => sum + weight, 0);
  return Math.abs(total - 1.0) < 0.01;
}

/**
 * Validate all decks in a tiles/overlay config section.
 * Returns an array of error messages (empty if all valid).
 *
 * @param {object} decks - e.g. { "P": [["file", 0.5], ...], "F": [...] }
 * @returns {string[]} Error messages
 */
export function validateAllDecks(decks) {
  const errors = [];
  for (const [key, deck] of Object.entries(decks)) {
    if (!validateDeck(deck)) {
      const total = deck.reduce((sum, [, w]) => sum + w, 0);
      errors.push(`Deck "${key}" weights sum to ${total.toFixed(4)}, expected ~1.0`);
    }
  }
  return errors;
}
