// sprites/label.js -- Render text label on background sprite.

import { loadSprite } from './sprite.js';

/**
 * Create a label canvas: text rendered on an optional background sprite.
 *
 * @param {object} opts
 * @param {string} opts.text - Label text
 * @param {string} opts.fontFamily - CSS font family name
 * @param {number} opts.fontSize - Font size in pixels
 * @param {string} opts.color - Text fill color (CSS)
 * @param {string|null} [opts.backgroundSrc] - Path to background sprite image
 * @param {number} [opts.padding=10] - Padding around text
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function createLabel({
  text,
  fontFamily,
  fontSize,
  color,
  backgroundSrc = null,
  padding = 10,
}) {
  // Measure text
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = `${fontSize}px ${fontFamily}`;
  const textMetrics = measureCtx.measureText(String(text));
  const textWidth = textMetrics.width;

  if (backgroundSrc) {
    // Draw text centered on the background sprite
    const bgCanvas = await loadSprite(backgroundSrc);
    if (!bgCanvas) {
      return createTextOnlyLabel(text, fontFamily, fontSize, color, textWidth, padding);
    }

    const ctx = bgCanvas.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text), bgCanvas.width / 2, bgCanvas.height / 2);

    return bgCanvas;
  }

  return createTextOnlyLabel(text, fontFamily, fontSize, color, textWidth, padding);
}

function createTextOnlyLabel(text, fontFamily, fontSize, color, textWidth, padding) {
  const canvas = document.createElement('canvas');
  canvas.width = textWidth + 2 * padding;
  canvas.height = fontSize + 2 * padding;

  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), canvas.width / 2, canvas.height / 2);

  return canvas;
}
