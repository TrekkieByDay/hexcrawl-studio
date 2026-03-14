// store.js -- Pub/sub state store.

/**
 * Create a simple observable store with pub/sub.
 *
 * @param {object} initialState - Default state values
 * @returns {object} Store with get, set, update, subscribe methods
 */
export function createStore(initialState = {}) {
  const state = { ...initialState };
  const subscribers = new Map(); // key -> Set<callback>

  return {
    /** Get a single state value by key. */
    get(key) {
      return state[key];
    },

    /** Set a single state value and notify subscribers. */
    set(key, value) {
      const oldValue = state[key];
      state[key] = value;
      notify(key, value, oldValue);
    },

    /** Batch update multiple keys and notify subscribers once per key. */
    update(updates) {
      const changes = [];
      for (const [key, value] of Object.entries(updates)) {
        const oldValue = state[key];
        state[key] = value;
        changes.push([key, value, oldValue]);
      }
      for (const [key, value, oldValue] of changes) {
        notify(key, value, oldValue);
      }
    },

    /**
     * Subscribe to changes on a specific key.
     * @param {string} key - State key to watch
     * @param {function} callback - Called with (newValue, oldValue)
     * @returns {function} Unsubscribe function
     */
    subscribe(key, callback) {
      if (!subscribers.has(key)) {
        subscribers.set(key, new Set());
      }
      subscribers.get(key).add(callback);

      return () => {
        const subs = subscribers.get(key);
        if (subs) subs.delete(callback);
      };
    },

    /** Get a snapshot of the entire state (shallow copy). */
    getState() {
      return { ...state };
    },

    /** Check if a key exists in the store. */
    has(key) {
      return key in state;
    },
  };

  function notify(key, newValue, oldValue) {
    const subs = subscribers.get(key);
    if (subs) {
      for (const cb of subs) {
        cb(newValue, oldValue);
      }
    }
  }
}
