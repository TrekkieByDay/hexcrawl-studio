// hex/directions.js -- Direction vectors for cube coordinates.

/** Cube-coordinate direction vectors for the six hex neighbors. */
export const NE = [0, -1, 1];
export const NW = [-1, 0, 1];
export const W  = [-1, 1, 0];
export const SW = [0, 1, -1];
export const SE = [1, 0, -1];
export const E  = [1, -1, 0];

/**
 * All six directions in clockwise order starting from NW.
 * Matches the original codebase ordering used by ring/spiral algorithms.
 */
export const DIRECTIONS = [NW, NE, E, SE, SW, W];

/** Map from direction vector (JSON key) to human-readable name. */
export const DIR_NAMES = {
  [JSON.stringify(NE)]: 'NE',
  [JSON.stringify(NW)]: 'NW',
  [JSON.stringify(W)]: 'W',
  [JSON.stringify(SW)]: 'SW',
  [JSON.stringify(SE)]: 'SE',
  [JSON.stringify(E)]: 'E',
};
