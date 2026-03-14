// rendering/layer-manager.js -- Create, cache, invalidate, reorder layer canvases.

import { LAYERS, LAYER_ORDER } from '../constants.js';
import { renderLayer } from './layer-renderer.js';

/**
 * Manages the set of rendered layer canvases for the map.
 * Each layer is an independent canvas that can be individually re-rendered.
 */
export class LayerManager {
  constructor() {
    this._layers = new Map();
    this._visibility = new Map();

    // Initialize all layers as visible
    for (const layer of LAYER_ORDER) {
      this._visibility.set(layer, true);
    }
    // Index layers: only one visible at a time
    this._visibility.set(LAYERS.INDEX_AXIAL, false);
    this._visibility.set(LAYERS.INDEX_NUM, false);
  }

  /** Store a rendered layer canvas. */
  setLayer(layerName, canvas) {
    this._layers.set(layerName, canvas);
  }

  /** Get a rendered layer canvas. */
  getLayer(layerName) {
    return this._layers.get(layerName) || null;
  }

  /** Invalidate (clear) a layer so it will be re-rendered. */
  invalidate(layerName) {
    this._layers.delete(layerName);
  }

  /** Invalidate all layers. */
  invalidateAll() {
    this._layers.clear();
  }

  /** Set layer visibility. */
  setVisible(layerName, visible) {
    this._visibility.set(layerName, visible);
  }

  /** Check if a layer is visible. */
  isVisible(layerName) {
    return this._visibility.get(layerName) ?? false;
  }

  /** Get all layers in render order (bottom to top), filtered to visible. */
  getVisibleLayers() {
    return LAYER_ORDER
      .filter(name => this._visibility.get(name) && this._layers.has(name))
      .map(name => ({ name, canvas: this._layers.get(name) }));
  }

  /** Get all layers in render order. */
  getAllLayers() {
    return LAYER_ORDER
      .filter(name => this._layers.has(name))
      .map(name => ({ name, canvas: this._layers.get(name) }));
  }

  /**
   * Render all layers from composited hex data and store them.
   *
   * @param {object} opts
   * @param {import('../hex/grid.js').HexGrid} opts.grid
   * @param {object} opts.compositorLayers - Output from compositeMap()
   * @param {number} opts.canvasWidth
   * @param {number} opts.canvasHeight
   * @param {number} [opts.borderScale=1] - Scale for background-black layer
   * @param {Set} [opts.excludeIndices] - Deleted hex indices
   */
  renderAll({ grid, compositorLayers, canvasWidth, canvasHeight, borderScale = 1, excludeIndices = null }) {
    const layerMapping = {
      [LAYERS.BACKGROUND_BLACK]: { data: compositorLayers.backgroundBlack, scale: borderScale },
      [LAYERS.BACKGROUND_WHITE]: { data: compositorLayers.backgroundWhite },
      [LAYERS.TERRAIN]: { data: compositorLayers.terrain },
      [LAYERS.INDEX_EVEN]: { data: compositorLayers.indexEven },
      [LAYERS.INDEX_AXIAL]: { data: compositorLayers.indexAxial },
      [LAYERS.INDEX_NUM]: { data: compositorLayers.indexNum },
      [LAYERS.META_INFO]: { data: compositorLayers.metaInfo },
      [LAYERS.ICON]: { data: compositorLayers.icon },
      [LAYERS.POI]: { data: compositorLayers.poi },
    };

    for (const [layerName, { data, scale }] of Object.entries(layerMapping)) {
      if (data) {
        this.setLayer(layerName, renderLayer({
          grid,
          hexCanvases: data,
          canvasWidth,
          canvasHeight,
          scale: scale || 1,
          excludeIndices,
        }));
      }
    }
  }
}
