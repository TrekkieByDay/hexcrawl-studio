// rendering/color-layer.js -- Generate color overlay from palette + terrain data.

/**
 * Convert a hex color string to RGBA with opacity.
 * @param {string} hex - e.g. "#228B22"
 * @param {number} opacity - 0.0 to 1.0
 * @returns {string} RGBA color string
 */
export function hexToRGBA(hex, opacity) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate a hex-shaped color tile canvas.
 *
 * @param {string} colorHex - Hex color (e.g. "#228B22")
 * @param {number} width - Tile width in pixels
 * @param {string} orientation - 'FLAT' or 'POINTY'
 * @param {number} [opacity=0.5] - Fill opacity
 * @returns {HTMLCanvasElement}
 */
export function generateColorTile(colorHex, width, orientation = 'FLAT', opacity = 0.5) {
  const radius = width / 2;
  const canvas = document.createElement('canvas');

  if (orientation === 'POINTY') {
    canvas.width = Math.sqrt(3) / 2 * width;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = Math.sqrt(3) / 2 * width;
  }

  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width / 2, canvas.height / 2);

  const angleOffset = orientation === 'POINTY' ? Math.PI / 6 : 0;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (2 * Math.PI / 6) * i + angleOffset;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = hexToRGBA(colorHex, opacity);
  ctx.fill();

  return canvas;
}

/**
 * Generate color tile canvases for all hexes based on terrain and palette.
 *
 * @param {object} opts
 * @param {import('../hex/grid.js').HexGrid} opts.terrainGrid - Biome codes per hex
 * @param {object} opts.paletteConfig - Palette config (with colors section)
 * @param {number} opts.hexWidth - Tile width
 * @param {string} opts.orientation - 'FLAT' or 'POINTY'
 * @param {number} [opts.opacity=0.5] - Default opacity
 * @returns {(HTMLCanvasElement|null)[]} Per-hex color tile canvases
 */
export function generateColorLayer({
  terrainGrid,
  paletteConfig,
  hexWidth,
  orientation,
  opacity = 0.5,
}) {
  const colors = paletteConfig.colors || paletteConfig;
  const tileCache = new Map();
  const result = new Array(terrainGrid.numHexes);

  for (let i = 0; i < terrainGrid.numHexes; i++) {
    const biome = terrainGrid.get(i);
    const colorEntry = colors[biome];

    if (!colorEntry || !colorEntry.color_hex) {
      result[i] = null;
      continue;
    }

    const cacheKey = `${colorEntry.color_hex}_${opacity}`;
    if (!tileCache.has(cacheKey)) {
      tileCache.set(cacheKey, generateColorTile(colorEntry.color_hex, hexWidth, orientation, opacity));
    }
    result[i] = tileCache.get(cacheKey);
  }

  return result;
}
