// constants.js -- All enums, layer names, biome codes, limits, key codes.

/** Biome type codes used across terrain grids and sprite configs. */
export const BIOMES = {
  PLAINS: 'P',
  PLAINS_DESERT: 'PD',
  PLAINS_FOREST: 'PF',
  PLAINS_SWAMP: 'PS',
  FOREST: 'F',
  MOUNTAIN: 'M',
  DESERT: 'D',
  SWAMP: 'S',
  HILLS: 'H',
  HILLS_DESERT: 'HD',
  HILLS_FOREST: 'HF',
  HILLS_SWAMP: 'HS',
  SPECIAL: 'X',
  SAME: 'SAME',
};

/** ASCII art representations per biome (used in console/debug output). */
export const BIOMES_ART = {
  P: '```',
  PD: '`.`',
  PF: '`|`',
  PS: '`~`',
  F: '|||',
  M: '/\\',
  D: '`.`',
  S: '~~~',
  H: 'nnn',
  HD: 'n.n',
  HF: 'n|n',
  HS: 'n~n',
  X: '-X-',
};

/** Canvas layer identifiers (bottom to top render order). */
export const LAYERS = {
  BACKGROUND_BLACK: 'background-black',
  BACKGROUND_WHITE: 'background-white',
  COLOR: 'color',
  TERRAIN: 'terrain',
  INDEX_EVEN: 'index-even',
  INDEX_AXIAL: 'index-axial',
  INDEX_NUM: 'index-num',
  META_INFO: 'meta-info',
  ICON: 'icon',
  POI: 'poi',
  UI: 'ui',
};

/** Render order from bottom (first) to top (last). */
export const LAYER_ORDER = [
  LAYERS.BACKGROUND_BLACK,
  LAYERS.BACKGROUND_WHITE,
  LAYERS.COLOR,
  LAYERS.TERRAIN,
  LAYERS.INDEX_EVEN,
  LAYERS.INDEX_AXIAL,
  LAYERS.INDEX_NUM,
  LAYERS.META_INFO,
  LAYERS.ICON,
  LAYERS.POI,
  LAYERS.UI,
];

/** Hex grid orientations. */
export const ORIENTATIONS = {
  FLAT: 'FLAT',
  POINTY: 'POINTY',
};

/** Zoom limits. */
export const ZOOM = {
  MIN: 0.5,
  MAX: 12,
  DEFAULT: 1.0,
  STEP: 0.5,
};

/** Grid radius limits. */
export const RADIUS = {
  MIN: 1,
  MAX: 40,
  DEFAULT: 4,
};

/** Hex tile width limits (pixels). */
export const HEX_WIDTH = {
  MIN: 100,
  MAX: 400,
  DEFAULT: 200,
};

/** Tile padding limits (pixels). */
export const TILE_PADDING = {
  MIN: 0,
  MAX: 20,
  DEFAULT: 3,
};

/** Map padding limits (pixels). */
export const MAP_PADDING = {
  MIN: 0,
  MAX: 100,
  DEFAULT: 0,
};

/** Border width limits (pixels). */
export const BORDER_WIDTH = {
  MIN: 0,
  MAX: 20,
  DEFAULT: 6,
};

/** Keyboard key codes for interaction. */
export const KEYS = {
  SPACE: 'Space',
  CTRL_D: 'KeyD',
};

/** Index display types. */
export const INDEX_TYPES = {
  EVEN: 'even',
  AXIAL: 'axial',
  NUM: 'num',
};

/** Required roll table section names. */
export const REQUIRED_SECTIONS = [
  'TERRAIN',
  'NEW HEX',
  'META INFO 1',
  'POI CHECK',
  'POINTS OF INTEREST',
];

/** Tile card note template names. */
export const NOTE_TEMPLATES = {
  GENERAL: 'general',
  POI: 'poi',
  EMPTY: 'empty',
};

/** Default generation seed. */
export const DEFAULT_SEED = 1000;
