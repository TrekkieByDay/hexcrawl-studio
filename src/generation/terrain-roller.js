// generation/terrain-roller.js -- Orchestrator: populate all data grids from HFGE + roll tables.

import { HexGrid } from '../hex/grid.js';
import { HexFlowerGameEngine, TERRAIN_TEMPERATE } from './hfge.js';
import { setSeed, rollDice } from './dice.js';
import { rollOnSection, rollOnSectionMultiCol, matchRoll, getBiomeSymbol } from './roll-table.js';

/**
 * Generate a complete map data model from a seed and configuration.
 *
 * Returns an object with all the data grids needed for rendering:
 * - terrainGrid: HexGrid<BiomeCode>
 * - metaInfoGrid: HexGrid<string>
 * - poiGrid: HexGrid<{name, development} | null>
 * - iconGrid: HexGrid<BiomeCode>
 * - indexGrid: HexGrid<{num, axial, even}>
 *
 * @param {object} params
 * @param {number} params.seed - RNG seed
 * @param {number} params.radius - Grid radius
 * @param {number} params.hexWidth - Tile width in pixels
 * @param {string} [params.orientation='FLAT'] - Hex orientation
 * @param {number} [params.tilePadding=3] - Tile padding
 * @param {number} [params.mapPadding=0] - Map padding
 * @param {object} [params.terrainMap] - HFGE terrain mapping
 * @param {object} params.rolltableConfig - Roll table configuration
 * @returns {object} Map data model with all grids
 */
export function generateMapData({
  seed,
  radius,
  hexWidth,
  orientation = 'FLAT',
  tilePadding = 3,
  mapPadding = 0,
  terrainMap = TERRAIN_TEMPERATE,
  rolltableConfig,
}) {
  // Set seed for deterministic generation
  setSeed(seed);

  // Create the base grid and generate HFGE terrain
  const terrainGrid = new HexGrid(radius, hexWidth, orientation, mapPadding, tilePadding);
  const hfge = new HexFlowerGameEngine(2, terrainMap, seed);
  hfge.generateTerrain(terrainGrid);

  // Create parallel grids for other data
  const metaInfoGrid = new HexGrid(radius, hexWidth, orientation, mapPadding, tilePadding);
  const poiGrid = new HexGrid(radius, hexWidth, orientation, mapPadding, tilePadding);
  const iconGrid = new HexGrid(radius, hexWidth, orientation, mapPadding, tilePadding);
  const indexGrid = new HexGrid(radius, hexWidth, orientation, mapPadding, tilePadding);

  // Populate each hex
  for (let i = 0; i < terrainGrid.numHexes; i++) {
    const biome = terrainGrid.get(i);

    // Meta info (danger rating)
    metaInfoGrid.set(i, rollOnSection(rolltableConfig, 'META INFO 1'));

    // POI check and data
    const poiCheck = rollOnSection(rolltableConfig, 'POI CHECK');
    if (poiCheck === 'Yes') {
      const poiResult = rollOnSectionMultiCol(rolltableConfig, 'POINTS OF INTEREST');
      poiGrid.set(i, {
        name: poiResult[0] || null,
        development: poiResult[1] || null,
      });
    } else {
      poiGrid.set(i, null);
    }

    // Icon uses the terrain biome code
    iconGrid.set(i, biome);

    // Index data: sequential number, axial coords, even-offset coords
    indexGrid.set(i, {
      num: i,
      axial: terrainGrid.getAxial(i),
      even: terrainGrid.getOffsetEven(i),
    });
  }

  return {
    terrainGrid,
    metaInfoGrid,
    poiGrid,
    iconGrid,
    indexGrid,
  };
}
