// rendering/layer-renderer.js -- Render one HexGrid of image data to a full-map canvas.

/**
 * Render per-hex canvas data onto a single full-map canvas.
 * Each hex's canvas is drawn at its shifted pixel position.
 *
 * @param {object} opts
 * @param {import('../hex/grid.js').HexGrid} opts.grid - The hex grid (for pixel positions)
 * @param {(HTMLCanvasElement|null)[]} opts.hexCanvases - Per-hex canvas data
 * @param {number} opts.canvasWidth - Output canvas width
 * @param {number} opts.canvasHeight - Output canvas height
 * @param {number} [opts.scale=1] - Scale factor for hex drawing (used for border layer)
 * @param {Set} [opts.excludeIndices] - Indices to skip (deleted hexes)
 * @returns {HTMLCanvasElement}
 */
export function renderLayer({
  grid,
  hexCanvases,
  canvasWidth,
  canvasHeight,
  scale = 1,
  excludeIndices = null,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  const hexWidth = grid.hexWidth;
  const hexHeight = Math.sqrt(3) / 2 * hexWidth;

  for (let i = 0; i < grid.numHexes; i++) {
    if (excludeIndices && excludeIndices.has(i)) continue;

    const hexCanvas = hexCanvases[i];
    if (!hexCanvas) continue;

    const [x, y] = grid.getPixelShifted(i);

    if (scale !== 1) {
      // Scale drawing around the hex center
      const scaledWidth = hexWidth * scale;
      const scaledHeight = hexHeight * scale;
      const offsetX = x - (scaledWidth - hexWidth) / 2;
      const offsetY = y - (scaledHeight - hexHeight) / 2;
      ctx.drawImage(hexCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
    } else {
      ctx.drawImage(hexCanvas, x, y, hexWidth, hexHeight);
    }
  }

  return canvas;
}
