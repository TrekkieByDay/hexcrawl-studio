// hex/grid.js -- HexGrid class: stores values per hex, coordinate lookups.

import { ORIENTATIONS } from '../constants.js';
import {
  cubeSpiral, cubesToAxial, cubeToAxial,
  axialToPixelFlat, axialToPixelPointy,
  axialToOffsetEvenFlat, axialToOffsetEvenPointy,
  axialToOffsetOddFlat,
  cubeDistance, cubeNeighbors, cubeRing, hexCount,
  isInGrid,
} from './coordinates.js';

export class HexGrid {
  /**
   * @param {number} radius - Grid radius in hexes (>= 1).
   * @param {number} hexWidth - Tile width in pixels.
   * @param {string} orientation - 'FLAT' or 'POINTY'.
   * @param {number} [padding=0] - Map padding in pixels.
   * @param {number} [tilePadding=0] - Tile padding in pixels.
   */
  constructor(radius, hexWidth, orientation = ORIENTATIONS.FLAT, padding = 0, tilePadding = 0) {
    if (radius < 1) throw new Error('Grid radius must be >= 1');
    if (hexWidth < 2) throw new Error('Hex width must be >= 2');
    if (![ORIENTATIONS.FLAT, ORIENTATIONS.POINTY].includes(orientation)) {
      throw new Error("Orientation must be 'FLAT' or 'POINTY'");
    }

    this.radius = radius;
    this.hexWidth = hexWidth % 2 !== 0 ? hexWidth + 1 : hexWidth;
    this.tileRadius = this.hexWidth / 2;
    this.orientation = orientation;
    this.padding = padding;
    this.tilePadding = tilePadding;
    this.numHexes = hexCount(radius);

    // Generate all coordinates
    this._origin = [0, 0, 0];
    this._cubes = cubeSpiral(this._origin, 0, radius);
    this._axials = cubesToAxial(this._cubes);

    // Build cube-to-index lookup
    this._cubeToIndex = new Map();
    this._cubes.forEach((c, i) => this._cubeToIndex.set(c.join(','), i));

    // Compute pixel and offset coordinates
    this._pixels = this._computePixels();
    this._offsetEven = this._computeOffsetEven();

    // Shift pixels so min is at (padding, padding)
    this._shiftConstant = this._computeShift();
    this._pixelsShifted = this._pixels.map(([x, y]) => [
      x + this._shiftConstant[0],
      y + this._shiftConstant[1],
    ]);

    // Value storage (index -> value)
    this._hexes = new Map();
    for (let i = 0; i < this.numHexes; i++) {
      this._hexes.set(i, null);
    }
  }

  _computePixels() {
    const fn = this.orientation === ORIENTATIONS.FLAT ? axialToPixelFlat : axialToPixelPointy;
    return this._axials.map(ax => fn(ax, this.tileRadius, this.tilePadding));
  }

  _computeOffsetEven() {
    const fn = this.orientation === ORIENTATIONS.FLAT ? axialToOffsetEvenFlat : axialToOffsetEvenPointy;
    return this._axials.map(fn);
  }

  _computeShift() {
    let minX = Infinity, minY = Infinity;
    for (const [x, y] of this._pixels) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    }
    return [this.padding - minX, this.padding - minY];
  }

  // ── Value access ───────────────────────────────────────────────

  get(index) { return this._hexes.get(index); }
  set(index, value) { this._hexes.set(index, value); }
  has(index) { return this._hexes.has(index); }
  delete(index) { this._hexes.delete(index); }

  entries() { return [...this._hexes.entries()]; }
  keys() { return [...this._hexes.keys()]; }
  values() { return [...this._hexes.values()]; }

  get length() { return this._hexes.size; }

  clear() {
    for (const key of this._hexes.keys()) {
      this._hexes.set(key, null);
    }
  }

  // ── Coordinate lookups (by index) ──────────────────────────────

  getCube(index) { return this._cubes[index]; }
  getAxial(index) { return this._axials[index]; }
  getPixel(index) { return this._pixels[index]; }
  getPixelShifted(index) { return this._pixelsShifted[index]; }
  getOffsetEven(index) { return this._offsetEven[index]; }

  // ── Reverse lookups ────────────────────────────────────────────

  /** Find the index of a hex by its cube coordinate. Returns undefined if not found. */
  findIndex(cube) {
    return this._cubeToIndex.get(cube.join(','));
  }

  /** Find the closest hex index to a pixel position (in shifted coords). */
  findIndexByPixel(x, y) {
    let minDist = Infinity;
    let minIdx = 0;
    for (let i = 0; i < this._pixelsShifted.length; i++) {
      const dx = this._pixelsShifted[i][0] - x;
      const dy = this._pixelsShifted[i][1] - y;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }
    return minIdx;
  }

  // ── Spatial queries ────────────────────────────────────────────

  /** Get indices of all neighbors of the hex at given index that are within the grid. */
  getNeighborIndices(index) {
    const cube = this._cubes[index];
    return cubeNeighbors(cube)
      .map(n => this._cubeToIndex.get(n.join(',')))
      .filter(i => i !== undefined);
  }

  /** Get indices of all hexes on a ring of given radius around the hex at index. */
  getRingIndices(index, ringRadius) {
    const cube = this._cubes[index];
    return cubeRing(cube, ringRadius)
      .map(c => this._cubeToIndex.get(c.join(',')))
      .filter(i => i !== undefined);
  }

  /** Get cube distance between two hexes by their indices. */
  getDistance(indexA, indexB) {
    return cubeDistance(this._cubes[indexA], this._cubes[indexB]);
  }

  // ── Bounds ─────────────────────────────────────────────────────

  /** Get the bounding box of shifted pixel coordinates. */
  getPixelBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of this._pixelsShifted) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    return {
      minX, minY, maxX, maxY,
      width: maxX - minX + this.hexWidth,
      height: maxY - minY + this.hexWidth,
    };
  }

  // ── ASCII output ────────────────────────────────────────────────

  /**
   * Render the grid as an ASCII hex map.
   * Values are laid out on a staggered grid based on axial coordinates.
   * An optional transform function can convert stored values before display
   * (e.g., biome codes to ASCII art symbols).
   *
   * @param {object} [opts]
   * @param {function} [opts.transform] - (value, index) => string to display
   * @param {number} [opts.cellWidth=4] - Character width per cell
   * @param {boolean} [opts.showDetails=false] - Append per-hex coordinate details
   * @returns {string}
   */
  toString({ transform, cellWidth = 4, showDetails = false } = {}) {
    if (this._hexes.size === 0) return 'Empty HexGrid';

    const fmt = (val, idx) => {
      const display = transform ? transform(val, idx) : String(val ?? '.');
      return display.slice(0, cellWidth).padEnd(cellWidth);
    };

    // Determine axial bounds
    let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
    for (const [q, r] of this._axials) {
      if (q < minQ) minQ = q;
      if (q > maxQ) maxQ = q;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
    }

    const cols = maxQ - minQ + 1;
    const rows = maxR - minR + 1;
    const empty = ' '.repeat(cellWidth);

    // Build a 2D text grid (axial q -> column, axial r -> row)
    const textGrid = Array.from({ length: rows }, () => Array(cols).fill(empty));

    for (let i = 0; i < this.numHexes; i++) {
      const [q, r] = this._axials[i];
      textGrid[r - minR][q - minQ] = fmt(this._hexes.get(i), i);
    }

    // Stagger rows: offset each row by (r * cellWidth/2) spaces for hex layout
    const lines = textGrid.map((row, r) => {
      const indent = ' '.repeat(r * Math.floor(cellWidth / 2));
      return indent + row.join('');
    });

    const header = `HexGrid: ${this.orientation}, radius=${this.radius}, hexes=${this.numHexes}`;
    let output = header + '\n' + lines.join('\n');

    if (showDetails) {
      output += '\n' + '='.repeat(60) + '\n';
      for (let i = 0; i < this.numHexes; i++) {
        const ax = this._axials[i];
        const cu = this._cubes[i];
        const oe = this._offsetEven[i];
        const val = this._hexes.get(i);
        output += `Idx ${String(i).padStart(3)}: Ax(${ax[0]},${ax[1]}) Cu(${cu[0]},${cu[1]},${cu[2]}) OE(${oe[0]},${oe[1]}) Val: ${val}\n`;
      }
    }

    return output;
  }

  /**
   * Render using BIOMES_ART symbols for a visual terrain map.
   * @param {object} artMap - Biome code -> ASCII art string (e.g. BIOMES_ART)
   * @param {object} [opts] - Additional toString options
   * @returns {string}
   */
  toArtString(artMap, opts = {}) {
    return this.toString({
      ...opts,
      cellWidth: opts.cellWidth || 4,
      transform: (val) => (artMap && artMap[val]) || String(val ?? '.'),
    });
  }

  // ── Serialization ──────────────────────────────────────────────

  toJSON() {
    const hexEntries = [];
    for (const [k, v] of this._hexes) {
      hexEntries.push([k, v]);
    }
    return {
      radius: this.radius,
      hexWidth: this.hexWidth,
      orientation: this.orientation,
      padding: this.padding,
      tilePadding: this.tilePadding,
      hexes: hexEntries,
    };
  }

  static fromJSON(data) {
    const grid = new HexGrid(data.radius, data.hexWidth, data.orientation, data.padding, data.tilePadding);
    for (const [k, v] of data.hexes) {
      grid.set(k, v);
    }
    return grid;
  }
}
