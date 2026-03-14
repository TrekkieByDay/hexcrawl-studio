// rendering/map-compositor.js -- Per-hex sprite selection + compositing.
// Replaces the monolithic MapBuilder compositing pipeline.

import { loadSprite } from '../sprites/sprite.js';
import { stackSprites } from '../sprites/sprite-stacker.js';
import { selectFromDeck } from '../sprites/probability-deck.js';
import { createLabel } from '../sprites/label.js';

/**
 * For each hex in the map, select sprites from probability decks
 * and composite them into per-layer image data.
 *
 * @param {object} opts
 * @param {import('../hex/grid.js').HexGrid} opts.terrainGrid - Biome codes per hex
 * @param {import('../hex/grid.js').HexGrid} opts.metaInfoGrid - Meta info strings
 * @param {import('../hex/grid.js').HexGrid} opts.poiGrid - POI data
 * @param {import('../hex/grid.js').HexGrid} opts.iconGrid - Icon biome codes
 * @param {import('../hex/grid.js').HexGrid} opts.indexGrid - Index data
 * @param {object} opts.spriteConfig - Sprite configuration
 * @param {string} [opts.basePath=''] - Base path for sprite assets
 * @returns {Promise<object>} Per-hex sprite data organized by layer
 */
export async function compositeMap({
  terrainGrid,
  metaInfoGrid,
  poiGrid,
  iconGrid,
  indexGrid,
  spriteConfig,
  basePath = '',
}) {
  const dir = basePath + (spriteConfig.meta.directory || '');
  const numHexes = terrainGrid.numHexes;

  // Sprite caches to avoid reloading the same images
  const spriteCache = new Map();

  async function getCachedSprite(path) {
    if (!path) return null;
    const fullPath = path.startsWith('data:') ? path : dir + path;
    if (!spriteCache.has(fullPath)) {
      spriteCache.set(fullPath, await loadSprite(fullPath));
    }
    return spriteCache.get(fullPath);
  }

  // Result: per-layer canvas data for each hex
  const layers = {
    backgroundWhite: new Array(numHexes),
    backgroundBlack: new Array(numHexes),
    terrain: new Array(numHexes),
    metaInfo: new Array(numHexes),
    poi: new Array(numHexes),
    icon: new Array(numHexes),
    indexNum: new Array(numHexes),
    indexAxial: new Array(numHexes),
    indexEven: new Array(numHexes),
  };

  // Pre-load shared backfill sprites
  const bgWhite = await getCachedSprite(spriteConfig.backfill?.backfill_white);
  const bgBlack = await getCachedSprite(spriteConfig.backfill?.backfill_black);

  for (let i = 0; i < numHexes; i++) {
    // Backgrounds
    layers.backgroundWhite[i] = bgWhite;
    layers.backgroundBlack[i] = bgBlack;

    // Terrain: select from probability deck based on biome code
    const biome = terrainGrid.get(i);
    if (biome && spriteConfig.tiles[biome]) {
      const filename = selectFromDeck(spriteConfig.tiles[biome]);
      layers.terrain[i] = await getCachedSprite(filename);
    }

    // Meta info overlay
    const meta = metaInfoGrid.get(i);
    if (meta && spriteConfig.overlay && spriteConfig.overlay[meta]) {
      const filename = selectFromDeck(spriteConfig.overlay[meta]);
      layers.metaInfo[i] = await getCachedSprite(filename);
    }

    // POI overlay
    const poi = poiGrid.get(i);
    if (poi && poi.name && spriteConfig.overlay && spriteConfig.overlay[poi.name]) {
      const filename = selectFromDeck(spriteConfig.overlay[poi.name]);
      layers.poi[i] = await getCachedSprite(filename);
    }

    // Icon overlay
    const iconBiome = iconGrid.get(i);
    if (iconBiome && spriteConfig.icons && spriteConfig.icons[iconBiome]) {
      layers.icon[i] = await getCachedSprite(spriteConfig.icons[iconBiome]);
    }

    // Index labels
    const idxData = indexGrid.get(i);
    if (idxData) {
      const fontFamily = 'Arial';
      const fontSize = 15;
      const fontColor = 'white';
      const bgSrc = spriteConfig.indexing?.index_background_black
        ? dir + spriteConfig.indexing.index_background_black
        : null;

      layers.indexNum[i] = await createLabel({
        text: String(idxData.num),
        fontFamily, fontSize, color: fontColor,
        backgroundSrc: bgSrc, padding: 4,
      });

      layers.indexAxial[i] = await createLabel({
        text: `${idxData.axial[0]},${idxData.axial[1]}`,
        fontFamily, fontSize, color: fontColor,
        backgroundSrc: bgSrc, padding: 4,
      });

      layers.indexEven[i] = await createLabel({
        text: `${idxData.even[0]},${idxData.even[1]}`,
        fontFamily, fontSize, color: fontColor,
        backgroundSrc: bgSrc, padding: 4,
      });
    }
  }

  return { layers, spriteCache };
}
