// generation/hfge.js -- Hex Flower Game Engine: terrain maps, d12 navigation, wrapping.

import { BIOMES } from '../constants.js';
import { HexGrid } from '../hex/grid.js';
import { cubeRing, cubeNeighbor, isOnEdge, isInGrid } from '../hex/coordinates.js';
import { rollDie, randomInt, setSeed } from './dice.js';

// ── HFGE index mappings ────────────────────────────────────────────
// The hex flower uses positions 1-19 on a radius-2 hex grid.
// These maps convert between hex-grid indices (0-18) and HFGE positions (1-19).

const HEX2HFGE = { 0:10, 1:7, 2:12, 3:15, 4:13, 5:8, 6:5, 7:4, 8:9, 9:14, 10:17, 11:19, 12:18, 13:16, 14:11, 15:6, 16:3, 17:1, 18:2 };
const HFGE2HEX = { 1:17, 2:18, 3:16, 4:7, 5:6, 6:15, 7:1, 8:5, 9:8, 10:0, 11:14, 12:2, 13:4, 14:9, 15:3, 16:13, 17:10, 18:12, 19:11 };

// ── d12 direction mapping ──────────────────────────────────────────
// Maps d12 roll (2-12) to cube direction vectors for navigation on the flower.
const DIRECTION_HFGE = {
  2:  [-1, 0, 1],   // NW
  3:  [-1, 0, 1],   // NW
  4:  [1, -1, 0],   // E
  5:  [1, -1, 0],   // E
  6:  [1, 0, -1],   // SE (cube)
  7:  [1, 0, -1],   // SE (cube)
  8:  [0, 1, -1],   // SW
  9:  [0, 1, -1],   // SW
  10: [-1, 1, 0],   // W
  11: [-1, 1, 0],   // W
  12: [0, -1, 1],   // NE
};

// ── Edge wrapping table ────────────────────────────────────────────
// Key: "hfgeIndex,dx,dy,dz" -> [targetHfgeIndex, shouldWrap]
const WRAP_DICT = {
  '19,0,-1,1': [1, false], '18,0,-1,1': [3, true], '16,0,-1,1': [6, true],
  '14,0,-1,1': [4, true], '17,0,-1,1': [2, true],
  '1,0,1,-1': [9, false], '3,0,1,-1': [18, true], '6,0,1,-1': [16, true],
  '4,0,1,-1': [14, true], '2,0,1,-1': [17, true],
  '19,-1,0,1': [16, false], '17,-1,0,1': [11, true], '14,-1,0,1': [6, true],
  '9,-1,0,1': [3, true], '4,-1,0,1': [1, true],
  '16,1,0,-1': [19, true], '11,1,0,-1': [17, true], '6,1,0,-1': [14, true],
  '3,1,0,-1': [9, true], '1,1,0,-1': [4, true],
  '19,1,-1,0': [14, false], '18,1,-1,0': [9, true], '16,1,-1,0': [4, true],
  '11,1,-1,0': [2, true], '6,1,-1,0': [1, true],
  '14,-1,1,0': [19, true], '9,-1,1,0': [18, true], '4,-1,1,0': [16, true],
  '2,-1,1,0': [11, true], '1,-1,1,0': [6, true],
};

// ── Terrain maps ───────────────────────────────────────────────────
// Map HFGE position (1-19) to biome code.

export const TERRAIN_TEMPERATE = {
  1: BIOMES.PLAINS, 2: BIOMES.PLAINS, 3: BIOMES.PLAINS,
  4: BIOMES.PLAINS_SWAMP, 5: BIOMES.PLAINS, 6: BIOMES.PLAINS_FOREST,
  7: BIOMES.PLAINS_SWAMP, 8: BIOMES.PLAINS_FOREST,
  9: BIOMES.SWAMP, 10: BIOMES.PLAINS, 11: BIOMES.FOREST,
  12: BIOMES.SWAMP, 13: BIOMES.FOREST,
  14: BIOMES.HILLS_SWAMP, 15: BIOMES.HILLS, 16: BIOMES.HILLS_FOREST,
  17: BIOMES.HILLS, 18: BIOMES.HILLS,
  19: BIOMES.MOUNTAIN,
};

export const TERRAIN_ARID = {
  1: BIOMES.PLAINS, 2: BIOMES.PLAINS, 3: BIOMES.PLAINS,
  4: BIOMES.PLAINS_DESERT, 5: BIOMES.PLAINS, 6: BIOMES.PLAINS_FOREST,
  7: BIOMES.PLAINS_DESERT, 8: BIOMES.PLAINS_FOREST,
  9: BIOMES.DESERT, 10: BIOMES.SPECIAL, 11: BIOMES.FOREST,
  12: BIOMES.DESERT, 13: BIOMES.FOREST,
  14: BIOMES.HILLS_DESERT, 15: BIOMES.HILLS, 16: BIOMES.HILLS_FOREST,
  17: BIOMES.HILLS, 18: BIOMES.HILLS,
  19: BIOMES.MOUNTAIN,
};

export const TERRAIN_TEMPERATE_NO_SPECIAL = {
  ...TERRAIN_TEMPERATE,
  10: BIOMES.PLAINS_FOREST,
};

export const TERRAIN_ARID_NO_SPECIAL = {
  ...TERRAIN_ARID,
  10: BIOMES.DESERT,
};

// ── HexFlowerGameEngine class ──────────────────────────────────────

export class HexFlowerGameEngine {
  /**
   * @param {number} radius - Flower radius (always 2 for standard HFGE)
   * @param {object} terrainMap - HFGE position -> biome code mapping
   * @param {number|string} seed - RNG seed
   * @param {number} [start=10] - Starting HFGE position (center of flower)
   */
  constructor(radius = 2, terrainMap = TERRAIN_TEMPERATE, seed = 1, start = 10) {
    this.radius = radius;
    this.terrainMap = terrainMap;
    this.seed = seed;
    this.hexCurrent = start;

    // Build internal flower grid for coordinate lookups
    this._flower = new HexGrid(radius, 20, 'FLAT');
    for (const [hexIdx, hfgeIdx] of Object.entries(HEX2HFGE)) {
      this._flower.set(Number(hexIdx), terrainMap[hfgeIdx]);
    }
  }

  /** Get the cube coordinate of an HFGE position on the internal flower grid. */
  _getCoordCube(hfgeIdx) {
    const hexIdx = HFGE2HEX[hfgeIdx];
    return this._flower.getCube(hexIdx);
  }

  /**
   * Advance the flower by one step: roll 2d6, navigate, handle wrapping.
   * Updates this.hexCurrent and returns the new HFGE position.
   * @returns {number} The new HFGE position (1-19)
   */
  nextHex() {
    const roll = rollDie(6) + rollDie(6);
    const direction = DIRECTION_HFGE[roll];

    const currentCube = this._getCoordCube(this.hexCurrent);
    const nextCube = cubeNeighbor(currentCube, direction);
    const onEdge = isOnEdge(currentCube, this.radius);
    const nextInFlower = isInGrid(nextCube, this.radius);

    let nextHfge;
    if (!nextInFlower && onEdge) {
      // Need to wrap
      const wrapKey = `${this.hexCurrent},${direction.join(',')}`;
      const wrapEntry = WRAP_DICT[wrapKey];
      if (!wrapEntry) {
        throw new Error(`Missing wrap entry for key: ${wrapKey}`);
      }
      nextHfge = wrapEntry[0];
    } else {
      const nextHexIdx = this._flower.findIndex(nextCube);
      nextHfge = HEX2HFGE[nextHexIdx];
    }

    this.hexCurrent = nextHfge;
    return nextHfge;
  }

  /** Get the biome code for the current HFGE position. */
  getCurrentBiome() {
    return this.terrainMap[this.hexCurrent];
  }

  /** Get the biome code for a given HFGE position. */
  getBiome(hfgeIdx) {
    return this.terrainMap[hfgeIdx];
  }

  /**
   * Generate terrain for a full hex grid by walking rings outward.
   * Each hex's terrain is determined by navigating the flower from a
   * neighbor's current HFGE position.
   *
   * @param {HexGrid} grid - The map grid to populate
   * @returns {HexGrid} The populated grid
   */
  generateTerrain(grid) {
    setSeed(this.seed);

    // Center hex
    const startPos = this.nextHex();
    grid.set(0, this.terrainMap[startPos]);

    // Walk rings outward
    for (let r = 1; r <= grid.radius; r++) {
      const ring = cubeRing([0, 0, 0], r);
      for (const cube of ring) {
        const idx = grid.findIndex(cube);
        if (idx === undefined) continue;

        // Find a filled neighbor to seed the flower position
        const neighborIndices = grid.getNeighborIndices(idx);
        const filledNeighbors = neighborIndices.filter(n => grid.get(n) !== null);

        if (filledNeighbors.length > 0) {
          const chosenNeighbor = filledNeighbors[randomInt(0, filledNeighbors.length - 1)];
          // Look up the biome of the chosen neighbor and find a matching HFGE position
          const neighborBiome = grid.get(chosenNeighbor);
          this.hexCurrent = this._findHfgeForBiome(neighborBiome);
        }

        const pos = this.nextHex();
        grid.set(idx, this.terrainMap[pos]);
      }
    }

    return grid;
  }

  /** Find any HFGE position that maps to the given biome. */
  _findHfgeForBiome(biome) {
    for (const [pos, b] of Object.entries(this.terrainMap)) {
      if (b === biome) return Number(pos);
    }
    return 10; // fallback to center
  }
}

// Export index mappings for external use
export { HEX2HFGE, HFGE2HEX };
