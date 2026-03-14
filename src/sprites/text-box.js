// sprites/text-box.js -- Wrapped text rendering onto a canvas.

/**
 * Create a canvas with word-wrapped text, optionally on a background.
 *
 * @param {object} opts
 * @param {string} opts.text - Text content
 * @param {string} opts.fontFamily - CSS font family
 * @param {number} opts.fontSize - Font size in pixels
 * @param {string} opts.color - Text fill color
 * @param {number} [opts.width] - Fixed width (auto if omitted)
 * @param {number} [opts.height] - Fixed height (auto if omitted)
 * @param {number} [opts.padding=10] - Padding around text
 * @param {string} [opts.backgroundColor='transparent'] - Background fill color
 * @returns {HTMLCanvasElement}
 */
export function createTextBox({
  text,
  fontFamily,
  fontSize,
  color,
  width = null,
  height = null,
  padding = 10,
  backgroundColor = 'transparent',
}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;

  const maxLineWidth = width ? width - 2 * padding : Infinity;
  const lines = wrapText(ctx, text, maxLineWidth);

  const lineHeight = fontSize + padding;
  const totalHeight = lines.length * lineHeight - padding;

  canvas.width = width || Math.max(...lines.map(l => ctx.measureText(l).width)) + 2 * padding;
  canvas.height = height || totalHeight + 2 * padding;

  // Re-set font after resize (canvas reset clears it)
  ctx.font = `${fontSize}px ${fontFamily}`;

  if (backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = color;
  ctx.textAlign = 'center';

  let y = padding + fontSize;
  for (const line of lines) {
    ctx.fillText(line, canvas.width / 2, y);
    y += lineHeight;
  }

  return canvas;
}

/**
 * Word-wrap text to fit within maxWidth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}
