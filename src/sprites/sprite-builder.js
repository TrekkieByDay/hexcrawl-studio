// sprites/sprite-builder.js -- Position sprites with offsets, produce composite.

/**
 * SpriteBuilder composites multiple sprite canvases at specified positions
 * onto a single output canvas.
 */
export class SpriteBuilder {
  constructor() {
    this.layers = [];
  }

  /**
   * Add a sprite layer at a given position.
   * @param {HTMLCanvasElement} canvas - The sprite canvas
   * @param {{ x: number, y: number }} [position={ x: 0, y: 0 }] - Draw offset
   */
  addLayer(canvas, position = { x: 0, y: 0 }) {
    if (canvas) {
      this.layers.push({ canvas, position });
    }
  }

  /** Remove a layer by index. */
  removeLayer(index) {
    if (index >= 0 && index < this.layers.length) {
      this.layers.splice(index, 1);
    }
  }

  /** Clear all layers. */
  clearAll() {
    this.layers = [];
  }

  /**
   * Composite all layers into a single canvas.
   * Uses the first layer's dimensions as the output size.
   * @returns {HTMLCanvasElement|null}
   */
  getComposite() {
    if (this.layers.length === 0) return null;

    const { width, height } = this.layers[0].canvas;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (const { canvas: layerCanvas, position } of this.layers) {
      ctx.drawImage(layerCanvas, position.x, position.y);
    }

    return canvas;
  }
}
