# HexCrawl Studio -- Design and Requirements Document

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-03-14

---

## 1. Project Overview

Tilemapper is a browser-based procedural fantasy hexmap generator. Users generate hex-grid maps with terrain, points of interest (POI), meta information (danger ratings), and icons. Maps can be interacted with (select, paint, delete hexes), annotated via floating tile cards with markdown notes, and exported as images, markdown, or JSON.

This document defines a ground-up rewrite. It preserves all user-facing functionality while replacing the internals with clean, modular, testable code.

### 1.1 How to Use This Document

- **Assign work:** point to a phase or requirement ID and say "build this."
- **Validate work:** compare delivered code against requirement IDs.
- **Track progress:** check off milestones in Section 8 as phases complete.

### 1.2 Reference Codebase

The original codebase lives at `~/Documents/GitHub/TilemapperWebApp` on the `main` branch. Key reference files:

| File | What to reference it for |
|------|--------------------------|
| `src/hexgrid.js` | Hex coordinate math, HexGrid class, Proxy pattern |
| `src/genHFGE.js` | HFGE terrain maps, d12 navigation, edge wrapping |
| `src/mapBuilder.js` | Full generation + compositing pipeline (to decompose) |
| `src/mapTableRoller.js` | Dice rolling, range matching, alternation logic |
| `src/mapSprites.js` | Sprite, SpriteStacker, Label classes |
| `src/spriteBuilder.js` | SpriteBuilder positioning and compositing |
| `src/tilemapper_default_config.js` | All three default configs (sprites, rolltable, palette) |
| `src/tilemapper_display.js` | Canvas layer rendering, pan/zoom |
| `src/tilemapper_palette.js` | Palette UI and color painting |
| `src/tilemapper_tileCard.js` | Tile card popup system |
| `src/web-tilemapper.html` | Full UI layout and script loading |
| `assets/run_config/*.json` | Config file format examples |

---

## 2. Goals and Constraints

### 2.1 Goals

| ID | Goal |
|----|------|
| G1 | Run entirely in the browser with zero server dependency. Must work from `file://` or any static host. |
| G2 | Clean module architecture. No module should exceed ~300 lines. |
| G3 | Automated tests using Vitest. Every non-UI module must have unit tests. |
| G4 | Centralized state management via a simple pub/sub store. |
| G5 | Constants module -- no magic strings or numbers scattered through code. |
| G6 | Break the monolithic MapBuilder into focused, single-responsibility modules. |
| G7 | Preserve all existing user-facing functionality. |

### 2.2 Constraints

| ID | Constraint |
|----|-----------|
| C1 | Vanilla JS + Vite. No framework (React, Vue, Svelte, etc.). |
| C2 | File loading via `<input type="file">` (not `showDirectoryPicker`) for offline compatibility. |
| C3 | No runtime server. No Node.js dependencies at runtime. |
| C4 | Runtime dependencies limited to: seedrandom, jszip, file-saver, mathjs. Evaluate replacing lodash with native methods. |
| C5 | Must support flat-top and pointy-top hex orientations. |

---

## 3. Functional Requirements

### 3.1 Map Generation

| ID | Requirement |
|----|-------------|
| FR-GEN-01 | Generate a hex grid of configurable radius (1--40) using cube coordinates [x,y,z] where x+y+z=0. |
| FR-GEN-02 | Support flat-top and pointy-top hex orientations. |
| FR-GEN-03 | Use the Hex Flower Game Engine (HFGE) for procedural terrain. HFGE navigates a 19-hex flower via d12 rolls with edge wrapping. |
| FR-GEN-04 | Support terrain maps: temperate, arid, no-special. |
| FR-GEN-05 | Biome types: P, PD, PF, PS, F, M, D, S, H, HD, HF, HS (plus water variants WF, SS, SD, SF for palette). |
| FR-GEN-06 | Accept a user-provided integer seed for reproducible generation (seedrandom). |
| FR-GEN-07 | Roll on configurable tables for: TERRAIN, NEW HEX, META INFO 1, MAJOR EVENT, POI CHECK, POINTS OF INTEREST. |
| FR-GEN-08 | Parse dice notation in NdS format (e.g., 2d6, 1d20). |
| FR-GEN-09 | Support roll range matching (e.g., "4-6") and alternation with "||". |
| FR-GEN-10 | Support multi-column roll tables (e.g., POI: Location + Development). |

### 3.2 Rendering

| ID | Requirement |
|----|-------------|
| FR-RND-01 | Render map as stacked canvas layers (bottom to top): background-black, background-white, color, terrain, index, meta-info, icon, poi, ui. |
| FR-RND-02 | Each layer is an independent `<canvas>` element. |
| FR-RND-03 | Per-hex tiles composited from: background + terrain + overlays (POI, meta, icon, index label). |
| FR-RND-04 | Sprite selection uses weighted probability decks (cumulative odds to 1.0). |
| FR-RND-05 | Configurable hex width (100--400px), tile padding, map padding, border width. |
| FR-RND-06 | Cache rendered layers. Only re-render changed layers. |
| FR-RND-07 | Index labels rendered as text on background sprite via canvas text + FontFace API. |

### 3.3 Display and Interaction

| ID | Requirement |
|----|-------------|
| FR-DSP-01 | Pan: hold spacebar + drag. Cursor changes to grab/grabbing. |
| FR-DSP-02 | Zoom: Ctrl+scroll or Ctrl+/Ctrl-. Range 0.5x--12x. Zoom toward cursor. |
| FR-DSP-03 | Click detection: find closest hex center to click position. |
| FR-DSP-04 | Single hex selection with blue overlay on UI layer. |
| FR-DSP-05 | Marquee selection: drag rectangle to select enclosed hexes. |
| FR-DSP-06 | Deselect all: Ctrl+D or toolbar button. |
| FR-DSP-07 | Layer visibility toggled via checkboxes. |
| FR-DSP-08 | Index type selection via radio buttons (even-offset, axial, numeric). One index layer visible at a time. |

### 3.4 Tile Cards

| ID | Requirement |
|----|-------------|
| FR-CRD-01 | Click hex (card tool active) opens a floating popup with: coordinates, terrain, meta, POI, development, sprite thumbnails. |
| FR-CRD-02 | Cards are draggable, resizable, and stackable (z-order). |
| FR-CRD-03 | Each card has an editable markdown notes area. |
| FR-CRD-04 | Note templates: General, POI, Empty. Cycle button switches template. |
| FR-CRD-05 | Card stack operations: fan, hide all, show all. |

### 3.5 Color Palette

| ID | Requirement |
|----|-------------|
| FR-PAL-01 | 16 terrain colors in a collapsible right panel. |
| FR-PAL-02 | Global opacity slider (0--100%). |
| FR-PAL-03 | Click color, then click hex to paint. Updates color layer. |
| FR-PAL-04 | Palette loaded from config (biome code to hex color + name). |

### 3.6 Tile Operations

| ID | Requirement |
|----|-------------|
| FR-TIL-01 | Delete selected hexes (remove from all visible layers). |
| FR-TIL-02 | Re-roll terrain for selected hexes. |
| FR-TIL-03 | Re-roll POI for selected hexes. |
| FR-TIL-04 | Re-roll meta info for selected hexes. |

### 3.7 Configuration

| ID | Requirement |
|----|-------------|
| FR-CFG-01 | Load sprite config JSON via file input. |
| FR-CFG-02 | Load rolltable config JSON via file input. |
| FR-CFG-03 | Built-in default configs load on startup. |
| FR-CFG-04 | Config bar shows loaded config names and generation parameters. |

### 3.8 Export

| ID | Requirement |
|----|-------------|
| FR-EXP-01 | Composite PNG: merge visible layers into one image, trigger download. |
| FR-EXP-02 | Layer ZIP: each layer as individual PNG in a ZIP (JSZip + file-saver). |
| FR-EXP-03 | Markdown: all tile card notes as a single .md file. |
| FR-EXP-04 | JSON: full map state as a JSON file. |

### 3.9 Input Parameters

| ID | Requirement |
|----|-------------|
| FR-INP-01 | Seed: integer for reproducible generation. |
| FR-INP-02 | Radius: 1--40. |
| FR-INP-03 | Hex width: 100--400px. |
| FR-INP-04 | Map padding: 0--100px. |
| FR-INP-05 | Tile padding: 0--20px. |
| FR-INP-06 | Border width: 0--20px. |

---

## 4. Technical Architecture

### 4.1 Directory Structure

```
tilemapper-v2/
  index.html
  vite.config.js
  package.json

  src/
    main.js                    # Entry point. Init app, load defaults, wire events.
    constants.js               # All enums, layer names, biome codes, limits, key codes.
    store.js                   # Pub/sub state store.

    hex/
      coordinates.js           # Pure functions: cube/axial/offset/pixel conversions,
                               #   distance, line, ring, spiral, neighbor.
      grid.js                  # HexGrid class: stores values per hex, coordinate lookups.
      directions.js            # Direction vectors (NE, NW, W, SW, SE, E).

    generation/
      hfge.js                  # Hex Flower Game Engine: terrain maps, d12 navigation, wrapping.
      dice.js                  # Dice notation parsing and rolling.
      roll-table.js            # Load, validate, roll on tables.
      terrain-roller.js        # Orchestrator: populate all data grids from HFGE + roll tables.

    sprites/
      sprite.js                # Load image to offscreen canvas.
      sprite-stacker.js        # Composite sprites in z-order.
      sprite-builder.js        # Position sprites with offsets, produce composite.
      label.js                 # Render text label on background sprite.
      text-box.js              # Wrapped text rendering.
      probability-deck.js      # Weighted random selection from sprite decks.

    rendering/
      layer-renderer.js        # Render one HexGrid of image data to a full-map canvas.
      layer-manager.js         # Create, cache, invalidate, reorder layer canvases.
      map-compositor.js        # Per-hex sprite selection + compositing (replaces MapBuilder bulk).
      color-layer.js           # Generate color overlay from palette + terrain data.

    interaction/
      pan.js                   # Spacebar + drag.
      zoom.js                  # Ctrl+scroll zoom with focal point.
      click-detect.js          # Pixel-to-hex lookup (closest center).
      selection.js             # Single + marquee selection, manages selectedHexes.

    ui/
      toolbar.js               # Left sidebar tool buttons + event wiring.
      config-bar.js            # Top bar: config display + parameter inputs.
      layer-controls.js        # Layer checkboxes + index radio buttons.
      palette-panel.js         # Right-side color swatches + opacity slider.
      tile-card.js             # Floating card popup: create, populate, drag, resize.
      tile-card-stack.js       # Card collection: fan, hide, show, export notes.

    io/
      file-loader.js           # <input type="file"> helpers.
      export-image.js          # Composite PNG + layer ZIP export.
      export-data.js           # Markdown + JSON export.
      config-manager.js        # Load + validate sprite/rolltable/palette configs.

    config/
      default-sprites.js       # Built-in default sprite config object.
      default-rolltable.js     # Built-in default rolltable config object.
      default-palette.js       # Built-in default palette config object.

  test/
    hex/
      coordinates.test.js
      grid.test.js
    generation/
      hfge.test.js
      dice.test.js
      roll-table.test.js
      terrain-roller.test.js
    sprites/
      probability-deck.test.js
    rendering/
      map-compositor.test.js
    interaction/
      click-detect.test.js
      selection.test.js
    io/
      config-manager.test.js

  assets/                      # Copied from original repo
    sprites-maatlock-drawn_webp/
    fonts/
    icons/
    run_config/
```

### 4.2 Module Dependency Graph

```
main.js
  ├── store.js
  ├── config-manager.js ── file-loader.js
  ├── ui/* (toolbar, config-bar, layer-controls, palette-panel)
  │
  ├── [on generate]:
  │     ├── hfge.js ── grid.js ── coordinates.js, directions.js
  │     ├── terrain-roller.js ── roll-table.js ── dice.js
  │     ├── map-compositor.js ── sprite.js, sprite-stacker.js,
  │     │                        sprite-builder.js, label.js, probability-deck.js
  │     ├── layer-renderer.js ── layer-manager.js
  │     └── color-layer.js
  │
  ├── [on interaction]:
  │     ├── pan.js, zoom.js, click-detect.js, selection.js
  │     └── tile-card.js, tile-card-stack.js
  │
  └── [on export]:
        └── export-image.js, export-data.js
```

### 4.3 State Store (`store.js`)

A simple observable store. No framework.

```js
const store = createStore({
  // Generation parameters
  seed: 1000,
  radius: 4,
  hexWidth: 200,
  paddingTile: 3,
  paddingMap: 0,
  borderWidth: 6,

  // Loaded configs
  spriteConfig: null,
  rolltableConfig: null,
  paletteConfig: null,

  // Map data (populated after generation)
  hexGrid: null,              // HexGrid instance (coordinates + structure)
  terrainGrid: null,          // HexGrid<BiomeCode>
  metaInfoGrid: null,         // HexGrid<string>
  poiGrid: null,              // HexGrid<{name, development}>
  iconGrid: null,             // HexGrid<BiomeCode>
  indexGrid: null,            // HexGrid<{num, axial, even}>
  colorGrid: null,            // HexGrid<string> (hex color values)
  deletedHexes: new Set(),

  // Rendered layers
  layers: {},                 // { layerName: HTMLCanvasElement }
  layerVisibility: {},        // { layerName: boolean }
  activeIndexType: 'even',    // 'even' | 'axial' | 'num'

  // Interaction
  selectedHexes: new Set(),
  zoomLevel: 1.0,
  panOffset: { x: 0, y: 0 },
  isPanning: false,
  activeTool: null,

  // Tile cards
  tileCardStack: null,
});

// API
store.get('seed')                          // Read
store.set('seed', 42)                      // Write + notify
store.update({ seed: 42, radius: 10 })     // Batch write + notify
store.subscribe('selectedHexes', callback) // Listen for changes
```

**Rules:**
- UI reads from store, never holds its own copy of shared state.
- Only the module responsible for a state key writes to it.
- Subscribers react to change events.

### 4.4 Constants (`constants.js`)

```js
export const BIOMES = { PLAINS: 'P', FOREST: 'F', MOUNTAIN: 'M', /* ... */ };
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
export const LAYER_ORDER = [ /* bottom to top */ ];
export const ORIENTATIONS = { FLAT: 'FLAT', POINTY: 'POINTY' };
export const ZOOM = { MIN: 0.5, MAX: 12, DEFAULT: 1.0, STEP: 0.5 };
export const RADIUS = { MIN: 1, MAX: 40, DEFAULT: 4 };
export const HEX_WIDTH = { MIN: 100, MAX: 400, DEFAULT: 200 };
export const KEYS = { SPACE: 'Space', CTRL_D: 'KeyD' };
```

### 4.5 Build System

- **Bundler:** Vite
- **Test runner:** Vitest (with happy-dom for canvas mocking)
- **No TypeScript**, but JSDoc for type documentation
- `vite dev` for development with HMR
- `vite build` outputs static files to `dist/` (works from `file://`)

---

## 5. Data Models

### 5.1 HexGrid

```
HexGrid<T> {
  radius: number
  hexWidth: number
  orientation: 'FLAT' | 'POINTY'
  padding: number
  numHexes: number              // 1 + 3*r*(r+1) for r >= 1

  // Storage
  _hexes: Map<number, T>       // index -> value

  // Access
  get(index): T
  set(index, value): void
  has(index): boolean
  entries(): [number, T][]

  // Coordinate lookups (by index)
  getCube(index): [x, y, z]
  getAxial(index): [q, r]
  getOffsetEven(index): [col, row]
  getPixelCenter(index): [x, y]

  // Reverse lookup
  findIndex(cubCoord): number

  // Spatial queries
  getNeighborIndices(index): number[]
  getRingIndices(center, radius): number[]
  getDistance(a, b): number
}
```

### 5.2 Per-Hex Data (across grids)

After generation, data for hex at index `i` is spread across separate grids:

| Grid | Value type | Example |
|------|-----------|---------|
| terrainGrid | BiomeCode string | `'F'` |
| metaInfoGrid | string | `'Safe'` |
| poiGrid | `{name, development}` or null | `{name: 'Village', development: 'Thriving'}` |
| iconGrid | BiomeCode string | `'F'` |
| indexGrid | `{num, axial, even}` | `{num: 7, axial: [1,-1], even: [2,3]}` |
| colorGrid | hex color string or null | `'#228B22'` |

### 5.3 Tile Card Data

```
TileCardData {
  index: number
  coordAxial: [q, r]
  coordOffsetEven: [col, row]
  terrain: BiomeCode
  metaInfo: string
  poi: { name, development } | null
  icon: BiomeCode
  thumbnails: { terrain, poi, meta, icon }   // data URLs
  notes: string
  noteTemplate: 'general' | 'poi' | 'empty'
}
```

---

## 6. Rendering Pipeline

### 6.1 Two Phases

**Generation phase** populates data grids. **Rendering phase** reads grids and produces canvases.

```
GENERATION:
  1. Create HexGrid(radius, hexWidth, orientation)
  2. HFGE -> populate terrainGrid
  3. Roll tables -> populate metaInfoGrid, poiGrid, iconGrid, indexGrid
  4. Sprite selection (probability decks) -> image paths per hex
  5. Load + composite sprites per hex -> image data per layer

RENDERING:
  6. For each layer in LAYER_ORDER:
     a. Create offscreen canvas sized to full map bounds
     b. For each hex: draw that hex's layer image at its pixel center
     c. Store canvas in layer cache
  7. Mount canvases into DOM with CSS stacking
  8. Apply pan/zoom via CSS transform

INTERACTION (partial re-renders):
  9. Selection change -> re-render UI layer only
  10. Color paint -> re-render color layer only
  11. Re-roll -> regenerate affected hex data, re-composite, re-render
  12. Delete -> remove hex from affected layers
```

### 6.2 Layer Details

| Layer | Source | Content |
|-------|--------|---------|
| background-black | constant | Black hex fill (border effect) |
| background-white | constant | White hex fill |
| color | colorGrid | Semi-transparent biome color |
| terrain | terrainGrid + sprites | Terrain artwork |
| index-even | indexGrid | Offset coordinate labels |
| index-axial | indexGrid | Axial coordinate labels |
| index-num | indexGrid | Sequential number labels |
| meta-info | metaInfoGrid | Safety rating overlay |
| icon | iconGrid | Biome icon |
| poi | poiGrid | POI overlay |
| ui | selectedHexes | Blue selection highlight |

### 6.3 Canvas Sizing

```
bounds = hexGrid.getPixelBounds()  // {minX, minY, maxX, maxY}
canvasWidth  = bounds.width  + 2 * paddingMap
canvasHeight = bounds.height + 2 * paddingMap
```

---

## 7. Configuration Schemas

### 7.1 Sprite Config

```json
{
  "meta": {
    "size": "200px",
    "orientation": "FLAT",
    "directory": "./assets/sprites-maatlock-drawn_webp/",
    "font": "./assets/fonts/ariblk.ttf",
    "index_font_color_black": [0, 0, 0, 255],
    "index_font_color_white": [255, 255, 255, 255],
    "index_type": "key",
    "map_algorithm": "HFGE",
    "textbox_font_size": 11,
    "textbox_font_color_black": [0, 0, 0, 255],
    "textbox_font_color_white": [255, 255, 255, 255],
    "textbox_shaped_lines": [106, 120, 130],
    "textbox_padding": 0,
    "textbox_letter_spacing": 0
  },
  "tiles": {
    "<BiomeCode>": [["<filename>", <cumulative_weight>], ...]
  },
  "overlay": {
    "<key>": [["<filename>", <cumulative_weight>], ...]
  },
  "icons": { "<BiomeCode>": "<filename>" },
  "palette_terrain": { "<variant>": "<filename>" },
  "palette_poi": { "<type>": "<filename>" },
  "palette_meta_one": { "<rating>": "<filename>" },
  "ui": { "select_blue": "<filename>" },
  "indexing": { "index_background_white": "<filename>", "index_background_black": "<filename>" },
  "backfill": { "backfill_white": "<filename>", "backfill_black": "<filename>", "backfill_transparent": "<filename>" },
  "textbox": { "textbox_background_white": "<filename>", "textbox_background_black": "<filename>" }
}
```

**Validation:** Probability weights in each deck must sum to 1.0. Orientation must be "FLAT" or "POINTY". All filenames relative to `meta.directory`.

### 7.2 Rolltable Config

```json
{
  "meta": { "algorithm": "<string>" },
  "SECTIONS": {
    "<SECTION_NAME>": {
      "meta": { "source": "<string>", "page": "<number|null>" },
      "dice": "<NdS>",
      "cols": "<number>",
      "col headers": ["<string>", ...],
      "rolls": { "<roll_or_range>": ["<result>", ...] }
    }
  },
  "BIOME SYMBOLS": { "<terrain_name>": "<BiomeCode>" },
  "BIOME ART": { "<terrain_name>": "<ascii_art>" }
}
```

**Required sections:** TERRAIN, NEW HEX, META INFO 1, POI CHECK, POINTS OF INTEREST.
**Roll key format:** `"7"` or `"4-6"`. Results may contain `"||"` for random alternation.
**Validation:** Roll ranges must cover every possible dice outcome. `cols` must match result array lengths.

### 7.3 Palette Config

```json
{
  "<BiomeCode>": {
    "name": "<display_name>",
    "color_hex": "<#RRGGBB>",
    "color_name": "<human_readable_name>"
  }
}
```

Expected codes: P, PD, PF, PS, F, M, D, S, H, HD, HF, HS, WF, SS, SD, SF.

---

## 8. Phased Implementation Plan

### Phase 1: Foundation -- "It computes"

Core data structures, generation logic, and build system. No rendering, no UI. Everything testable via Vitest.

**Deliverables:**
1. Project scaffolding: Vite, package.json, directory structure, Vitest
2. `constants.js`
3. `hex/coordinates.js` -- all pure coordinate math
4. `hex/grid.js` -- HexGrid class
5. `hex/directions.js`
6. `generation/dice.js`
7. `generation/roll-table.js`
8. `generation/hfge.js`
9. `generation/terrain-roller.js`
10. `store.js`
11. Unit tests for all of the above

**Exit criteria:** `npm test` passes. Given a seed, can generate a complete map data model and verify it deterministically.

- [ ] Complete

---

### Phase 2: Sprites and Compositing -- "It draws"

Load sprites, composite per-hex tiles, render to offscreen canvases.

**Deliverables:**
1. `sprites/sprite.js`, `sprite-stacker.js`, `sprite-builder.js`
2. `sprites/label.js`, `text-box.js`
3. `sprites/probability-deck.js`
4. `rendering/map-compositor.js`
5. `rendering/layer-renderer.js`, `layer-manager.js`
6. `rendering/color-layer.js`
7. `io/config-manager.js`
8. `config/default-sprites.js`, `default-rolltable.js`, `default-palette.js`
9. Tests for probability deck, config validation, compositor
10. Minimal test HTML page displaying stacked canvases

**Exit criteria:** Given configs and a seed, produces all layer canvases programmatically. Test page renders a visible map.

- [ ] Complete

---

### Phase 3: Display and Interaction -- "It responds"

Full interactive UI.

**Deliverables:**
1. `index.html` -- complete layout
2. `main.js` -- app init, defaults, event wiring
3. `interaction/pan.js`, `zoom.js`, `click-detect.js`, `selection.js`
4. `ui/toolbar.js`, `config-bar.js`, `layer-controls.js`, `palette-panel.js`
5. `ui/tile-card.js`, `tile-card-stack.js`
6. `io/file-loader.js`
7. CSS styling

**Exit criteria:** Full working app in browser. Generate, pan, zoom, select, paint, open cards, toggle layers.

- [ ] Complete

---

### Phase 4: Export and Polish -- "It ships"

Export, edge cases, performance, cross-browser.

**Deliverables:**
1. `io/export-image.js`, `io/export-data.js`
2. Tile operations: re-roll, delete
3. Keyboard shortcuts
4. Performance testing at radius 40 (4,921 hexes)
5. Cross-browser testing (Chrome, Firefox, Safari)
6. `file://` protocol testing
7. Integration tests

**Exit criteria:** All functional requirements verified. Tests green. Works offline from `file://`.

- [ ] Complete

---

## 9. Testing Strategy

### 9.1 Setup

Vitest with happy-dom. Run via `npm test`.

### 9.2 Required Unit Tests

| Module | What to test |
|--------|-------------|
| coordinates.js | Cube/axial/offset roundtrip conversions. Distance. Line drawing. Ring. Spiral. |
| grid.js | Hex count for radius. Get/set. Coordinate lookups. Neighbors. |
| dice.js | Parse 1d6, 2d6, 1d20. Roll min/max bounds. |
| roll-table.js | Load valid config. Range matching. Alternation splitting. Coverage validation. |
| hfge.js | Deterministic output for seed. Edge wrapping. Correct hex count for radius 1--5. |
| terrain-roller.js | Full pipeline: seed + radius + configs -> every hex has terrain, meta, POI or null. |
| probability-deck.js | Weight sum validation. Distribution matches weights over many rolls. |
| store.js | Subscribe fires on update. Batch update. Multiple subscribers. |
| config-manager.js | Valid config loads. Invalid config throws descriptive error. |

### 9.3 Manual Test Checklist

- [ ] Generate with default configs -- visual output reasonable
- [ ] Change seed -- different map
- [ ] Same seed -- identical map
- [ ] Pan with spacebar+drag
- [ ] Zoom with Ctrl+scroll, verify zoom toward cursor
- [ ] Single hex select/deselect
- [ ] Marquee select
- [ ] Ctrl+D deselects all
- [ ] Toggle each layer
- [ ] Switch index types (even/axial/num)
- [ ] Open tile card, verify data
- [ ] Edit notes, close, reopen -- notes persist
- [ ] Fan/hide/show cards
- [ ] Paint hex with palette color
- [ ] Adjust opacity slider
- [ ] Delete selected hexes
- [ ] Re-roll terrain/POI/meta
- [ ] Export composite PNG
- [ ] Export layer ZIP
- [ ] Export markdown
- [ ] Export JSON
- [ ] Load custom sprite config
- [ ] Load custom rolltable config
- [ ] Test radius 1, 5, 10, 20, 40
- [ ] Test from `file://`
- [ ] Test Chrome, Firefox, Safari

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **Biome Code** | Short string for terrain type: P, PD, PF, PS, F, M, D, S, H, HD, HF, HS, WF, SS, SD, SF |
| **Cube Coordinates** | [x, y, z] where x+y+z=0. Primary hex math coordinate system. |
| **Axial Coordinates** | [q, r] -- 2D projection of cube coords. q=x, r=z. |
| **Offset Even** | [col, row] -- screen-like coords for display labels. |
| **HFGE** | Hex Flower Game Engine. 19-hex pattern, d12 navigation, procedural terrain. |
| **Roll Table** | JSON mapping dice outcomes to results (terrain, POI, etc.). |
| **Sprite Config** | JSON defining available sprites, probability decks, asset metadata. |
| **Probability Deck** | Array of [filename, weight] pairs summing to 1.0 for weighted random selection. |
| **Layer** | Single canvas element for one map data category, stacked via CSS z-index. |
| **Tile Card** | Floating popup showing hex data + editable notes. |
| **Store** | Centralized pub/sub state management object. |
