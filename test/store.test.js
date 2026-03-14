import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../src/store.js';

describe('createStore', () => {
  it('creates a store with initial state', () => {
    const store = createStore({ seed: 1000, radius: 4 });
    expect(store.get('seed')).toBe(1000);
    expect(store.get('radius')).toBe(4);
  });

  it('get returns undefined for unknown keys', () => {
    const store = createStore({});
    expect(store.get('missing')).toBeUndefined();
  });

  it('set updates a value', () => {
    const store = createStore({ seed: 1000 });
    store.set('seed', 42);
    expect(store.get('seed')).toBe(42);
  });

  it('set notifies subscribers', () => {
    const store = createStore({ seed: 1000 });
    const callback = vi.fn();
    store.subscribe('seed', callback);

    store.set('seed', 42);
    expect(callback).toHaveBeenCalledWith(42, 1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('update batches multiple changes', () => {
    const store = createStore({ seed: 1000, radius: 4 });
    const seedCb = vi.fn();
    const radiusCb = vi.fn();
    store.subscribe('seed', seedCb);
    store.subscribe('radius', radiusCb);

    store.update({ seed: 42, radius: 10 });

    expect(store.get('seed')).toBe(42);
    expect(store.get('radius')).toBe(10);
    expect(seedCb).toHaveBeenCalledWith(42, 1000);
    expect(radiusCb).toHaveBeenCalledWith(10, 4);
  });

  it('subscribe returns an unsubscribe function', () => {
    const store = createStore({ seed: 1000 });
    const callback = vi.fn();
    const unsub = store.subscribe('seed', callback);

    store.set('seed', 1);
    expect(callback).toHaveBeenCalledTimes(1);

    unsub();
    store.set('seed', 2);
    expect(callback).toHaveBeenCalledTimes(1); // Not called again
  });

  it('supports multiple subscribers on same key', () => {
    const store = createStore({ seed: 1000 });
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    store.subscribe('seed', cb1);
    store.subscribe('seed', cb2);

    store.set('seed', 42);
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it('subscribers on different keys are independent', () => {
    const store = createStore({ seed: 1000, radius: 4 });
    const seedCb = vi.fn();
    const radiusCb = vi.fn();
    store.subscribe('seed', seedCb);
    store.subscribe('radius', radiusCb);

    store.set('seed', 42);
    expect(seedCb).toHaveBeenCalledOnce();
    expect(radiusCb).not.toHaveBeenCalled();
  });

  it('getState returns a snapshot', () => {
    const store = createStore({ seed: 1000, radius: 4 });
    const snap = store.getState();
    expect(snap).toEqual({ seed: 1000, radius: 4 });

    // Mutating snapshot does not affect store
    snap.seed = 999;
    expect(store.get('seed')).toBe(1000);
  });

  it('has checks key existence', () => {
    const store = createStore({ seed: 1000 });
    expect(store.has('seed')).toBe(true);
    expect(store.has('missing')).toBe(false);
  });

  it('can store complex values', () => {
    const store = createStore({ selectedHexes: new Set() });
    const newSet = new Set([1, 2, 3]);
    store.set('selectedHexes', newSet);
    expect(store.get('selectedHexes')).toBe(newSet);
    expect(store.get('selectedHexes').size).toBe(3);
  });
});
