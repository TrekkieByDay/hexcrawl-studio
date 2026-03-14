import { describe, it, expect, beforeEach } from 'vitest';
import { selectFromDeck, validateDeck, validateAllDecks } from '../../src/sprites/probability-deck.js';
import { setSeed } from '../../src/generation/dice.js';

beforeEach(() => {
  setSeed(42);
});

describe('selectFromDeck', () => {
  it('returns an item from the deck', () => {
    const deck = [['a.webp', 0.5], ['b.webp', 0.5]];
    const result = selectFromDeck(deck);
    expect(['a.webp', 'b.webp']).toContain(result);
  });

  it('returns the only item in a single-item deck', () => {
    const deck = [['only.webp', 1.0]];
    for (let i = 0; i < 20; i++) {
      expect(selectFromDeck(deck)).toBe('only.webp');
    }
  });

  it('throws for empty deck', () => {
    expect(() => selectFromDeck([])).toThrow('empty deck');
    expect(() => selectFromDeck(null)).toThrow('empty deck');
  });

  it('respects weight distribution over many rolls', () => {
    setSeed(99);
    const deck = [['rare.webp', 0.1], ['common.webp', 0.9]];
    const counts = { 'rare.webp': 0, 'common.webp': 0 };
    const n = 1000;

    for (let i = 0; i < n; i++) {
      counts[selectFromDeck(deck)]++;
    }

    // Common should be selected much more often than rare
    expect(counts['common.webp']).toBeGreaterThan(counts['rare.webp'] * 3);
    // Rare should still appear
    expect(counts['rare.webp']).toBeGreaterThan(0);
  });

  it('is deterministic with same seed', () => {
    const deck = [['a.webp', 0.33], ['b.webp', 0.34], ['c.webp', 0.33]];

    setSeed(123);
    const results1 = Array.from({ length: 20 }, () => selectFromDeck(deck));

    setSeed(123);
    const results2 = Array.from({ length: 20 }, () => selectFromDeck(deck));

    expect(results1).toEqual(results2);
  });

  it('handles many items in a deck', () => {
    const deck = Array.from({ length: 10 }, (_, i) => [`file${i}.webp`, 0.1]);
    for (let i = 0; i < 50; i++) {
      const result = selectFromDeck(deck);
      expect(result).toMatch(/^file\d+\.webp$/);
    }
  });
});

describe('validateDeck', () => {
  it('valid deck sums to 1.0', () => {
    expect(validateDeck([['a', 0.5], ['b', 0.5]])).toBe(true);
  });

  it('valid deck with small float imprecision', () => {
    expect(validateDeck([['a', 0.1], ['b', 0.2], ['c', 0.7]])).toBe(true);
  });

  it('invalid deck that sums to less than 1.0', () => {
    expect(validateDeck([['a', 0.3], ['b', 0.3]])).toBe(false);
  });

  it('invalid deck that sums to more than 1.0', () => {
    expect(validateDeck([['a', 0.6], ['b', 0.6]])).toBe(false);
  });

  it('empty or null deck is invalid', () => {
    expect(validateDeck([])).toBe(false);
    expect(validateDeck(null)).toBe(false);
  });
});

describe('validateAllDecks', () => {
  it('returns no errors for valid decks', () => {
    const decks = {
      P: [['grass1.webp', 0.5], ['grass2.webp', 0.5]],
      F: [['tree1.webp', 1.0]],
    };
    expect(validateAllDecks(decks)).toEqual([]);
  });

  it('returns errors for invalid decks', () => {
    const decks = {
      P: [['grass1.webp', 0.5], ['grass2.webp', 0.5]],
      BAD: [['x.webp', 0.3]],
    };
    const errors = validateAllDecks(decks);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('BAD');
  });
});
