// sprites/sprite-stacker.js -- Composite sprites in z-order.

/**
 * Stack multiple canvas layers into a single composite canvas.
 * Layers are drawn in order (first = bottom, last = top).
 *
 * @param {HTMLCanvasElement[]} layers - Array of canvas elements to stack
 * @returns {HTMLCanvasElement|null} Composited canvas, or null if no layers
 */
export function stackSprites(layers) {
  const validLayers = layers.filter(l => l != null);
  if (validLayers.length === 0) return null;

  const width = validLayers[0].width;
  const height = validLayers[0].height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  for (const layer of validLayers) {
    ctx.drawImage(layer, 0, 0);
  }

  return canvas;
}
