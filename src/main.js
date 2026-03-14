// HexCrawl Studio - Entry Point
// Phase 2: Minimal test page -- generates map data and renders stacked layer canvases.

import { generateMapData } from './generation/terrain-roller.js';
import { compositeMap } from './rendering/map-compositor.js';
import { LayerManager } from './rendering/layer-manager.js';
import { generateColorLayer } from './rendering/color-layer.js';
import { renderLayer } from './rendering/layer-renderer.js';
import { LAYERS } from './constants.js';
import { defaultSpriteConfig } from './config/default-sprites.js';
import { defaultRolltableConfig } from './config/default-rolltable.js';
import { defaultPaletteConfig } from './config/default-palette.js';
import { TERRAIN_TEMPERATE } from './generation/hfge.js';

const btnGenerate = document.getElementById('btn-generate');
const statusEl = document.getElementById('status');
const mapStack = document.getElementById('map-stack');

btnGenerate.addEventListener('click', () => generateMap());

async function generateMap() {
  btnGenerate.disabled = true;
  statusEl.textContent = 'Generating map data...';

  try {
    const seed = Number(document.getElementById('seed').value) || 1000;
    const radius = Number(document.getElementById('radius').value) || 4;
    const hexWidth = Number(document.getElementById('hexWidth').value) || 200;

    // Phase 1: Generate map data model
    const mapData = generateMapData({
      seed,
      radius,
      hexWidth,
      orientation: 'FLAT',
      tilePadding: 3,
      mapPadding: 10,
      terrainMap: TERRAIN_TEMPERATE,
      rolltableConfig: defaultRolltableConfig,
    });

    statusEl.textContent = `Map data generated (${mapData.terrainGrid.numHexes} hexes). Compositing sprites...`;

    // Phase 2: Composite sprites per hex
    const { layers: compositorLayers } = await compositeMap({
      terrainGrid: mapData.terrainGrid,
      metaInfoGrid: mapData.metaInfoGrid,
      poiGrid: mapData.poiGrid,
      iconGrid: mapData.iconGrid,
      indexGrid: mapData.indexGrid,
      spriteConfig: defaultSpriteConfig,
      basePath: '',
    });

    // Generate color layer
    const colorCanvases = generateColorLayer({
      terrainGrid: mapData.terrainGrid,
      paletteConfig: defaultPaletteConfig,
      hexWidth,
      orientation: 'FLAT',
      opacity: 0.5,
    });

    statusEl.textContent = 'Rendering layers...';

    // Calculate canvas dimensions from grid bounds
    const bounds = mapData.terrainGrid.getPixelBounds();
    const canvasWidth = Math.ceil(bounds.width + 20);
    const canvasHeight = Math.ceil(bounds.height + 20);

    // Render individual layers
    const borderScale = (2 * 6 + hexWidth) / hexWidth; // 6px border
    const layerManager = new LayerManager();
    layerManager.renderAll({
      grid: mapData.terrainGrid,
      compositorLayers,
      canvasWidth,
      canvasHeight,
      borderScale,
    });

    // Render color layer separately
    const colorCanvas = renderLayer({
      grid: mapData.terrainGrid,
      hexCanvases: colorCanvases,
      canvasWidth,
      canvasHeight,
    });
    layerManager.setLayer(LAYERS.COLOR, colorCanvas);

    // Mount canvases into DOM
    mapStack.innerHTML = '';
    const visibleLayers = layerManager.getVisibleLayers();

    for (const { name, canvas } of visibleLayers) {
      canvas.id = `map-layer-${name}`;
      canvas.style.imageRendering = 'auto';
      mapStack.appendChild(canvas);
    }

    // Size the stack container to match first canvas
    if (visibleLayers.length > 0) {
      mapStack.style.width = `${canvasWidth}px`;
      mapStack.style.height = `${canvasHeight}px`;
    }

    statusEl.textContent = `Map rendered: ${mapData.terrainGrid.numHexes} hexes, ${visibleLayers.length} layers`;

  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    btnGenerate.disabled = false;
  }
}
