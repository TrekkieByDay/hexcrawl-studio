import { describe, it, expect, beforeEach } from 'vitest';
import { parseDice, rollDice, rollDie, diceRange, setSeed, randomInt } from '../../src/generation/dice.js';

beforeEach(() => {
  setSeed(42);
});

describe('parseDice', () => {
  it('parses 1d6', () => {
    expect(parseDice('1d6')).toEqual({ count: 1, sides: 6 });
  });

  it('parses 2d6', () => {
    expect(parseDice('2d6')).toEqual({ count: 2, sides: 6 });
  });

  it('parses 1d20', () => {
    expect(parseDice('1d20')).toEqual({ count: 1, sides: 20 });
  });

  it('throws for invalid notation', () => {
    expect(() => parseDice('d6')).toThrow();
    expect(() => parseDice('abc')).toThrow();
    expect(() => parseDice('2d')).toThrow();
  });
});

describe('diceRange', () => {
  it('1d6 ranges from 1 to 6', () => {
    expect(diceRange('1d6')).toEqual({ min: 1, max: 6 });
  });

  it('2d6 ranges from 2 to 12', () => {
    expect(diceRange('2d6')).toEqual({ min: 2, max: 12 });
  });

  it('3d8 ranges from 3 to 24', () => {
    expect(diceRange('3d8')).toEqual({ min: 3, max: 24 });
  });
});

describe('rollDice', () => {
  it('1d6 result is between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice('1d6');
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('2d6 result is between 2 and 12', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice('2d6');
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    }
  });

  it('is deterministic with same seed', () => {
    setSeed(123);
    const rolls1 = Array.from({ length: 10 }, () => rollDice('2d6'));
    setSeed(123);
    const rolls2 = Array.from({ length: 10 }, () => rollDice('2d6'));
    expect(rolls1).toEqual(rolls2);
  });

  it('different seeds produce different results', () => {
    setSeed(1);
    const rolls1 = Array.from({ length: 20 }, () => rollDice('2d6'));
    setSeed(2);
    const rolls2 = Array.from({ length: 20 }, () => rollDice('2d6'));
    // Extremely unlikely to be identical
    expect(rolls1).not.toEqual(rolls2);
  });
});

describe('rollDie', () => {
  it('rolls within bounds', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie(6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });
});

describe('randomInt', () => {
  it('stays within bounds', () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInt(3, 7);
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(7);
    }
  });
});
