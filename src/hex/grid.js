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
