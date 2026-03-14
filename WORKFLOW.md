# HexCrawl Studio -- Development Workflow

## Iterative Development Loop

Every deliverable follows the same cycle:

```
 1. IDENTIFY   ──>  Point to the design doc deliverable (phase + number).
 2. RESEARCH   ──>  Read the reference implementation in TilemapperWebApp
                     to understand algorithms, edge cases, and data shapes.
 3. IMPLEMENT  ──>  Write the module in hexcrawl-studio with clean architecture.
 4. TEST       ──>  Write unit tests. Run `npm test` -- all tests pass.
 5. VERIFY     ──>  Review: behavior matches reference, code meets design doc specs.
 6. COMMIT     ──>  User approves, commit with a clear message.
```

Repeat for the next deliverable.

---

## Phase 1: Foundation -- "It computes"

| # | Deliverable | Source module(s) | Test file(s) | Status |
|---|-------------|-----------------|--------------|--------|
| 1 | Project scaffolding | -- | -- | DONE |
| 2 | `src/constants.js` | `src/tilemapper_default_config.js` | -- | DONE |
| 3 | `src/hex/coordinates.js` | `src/hexgrid.js` | `test/hex/coordinates.test.js` | DONE |
| 4 | `src/hex/grid.js` | `src/hexgrid.js` | `test/hex/grid.test.js` | DONE |
| 5 | `src/hex/directions.js` | `src/hexgrid.js` | -- | DONE |
| 6 | `src/generation/dice.js` | `src/mapTableRoller.js` | `test/generation/dice.test.js` | DONE |
| 7 | `src/generation/roll-table.js` | `src/mapTableRoller.js` | `test/generation/roll-table.test.js` | DONE |
| 8 | `src/generation/hfge.js` | `src/genHFGE.js` | `test/generation/hfge.test.js` | DONE |
| 9 | `src/generation/terrain-roller.js` | `src/mapBuilder.js` | `test/generation/terrain-roller.test.js` | DONE |
| 10 | `src/store.js` | -- | `test/store.test.js` | DONE |
| 11 | All unit tests passing | -- | `npm test` | DONE |

**Exit criteria:** `npm test` passes. Given a seed, can generate a complete map data model and verify it deterministically.

---

## Phase 2: Sprites and Compositing -- "It draws"

| # | Deliverable | Source module(s) | Test file(s) | Status |
|---|-------------|-----------------|--------------|--------|
| 1 | `src/sprites/sprite.js`, `sprite-stacker.js`, `sprite-builder.js` | `src/mapSprites.js`, `src/spriteBuilder.js` | -- | TODO |
| 2 | `src/sprites/label.js`, `text-box.js` | `src/mapSprites.js` | -- | TODO |
| 3 | `src/sprites/probability-deck.js` | `src/mapSprites.js` | `test/sprites/probability-deck.test.js` | TODO |
| 4 | `src/rendering/map-compositor.js` | `src/mapBuilder.js` | `test/rendering/map-compositor.test.js` | TODO |
| 5 | `src/rendering/layer-renderer.js`, `layer-manager.js` | `src/tilemapper_display.js` | -- | TODO |
| 6 | `src/rendering/color-layer.js` | `src/tilemapper_palette.js` | -- | TODO |
| 7 | `src/io/config-manager.js` | `src/tilemapper_default_config.js` | `test/io/config-manager.test.js` | TODO |
| 8 | `src/config/default-*.js` (sprites, rolltable, palette) | `src/tilemapper_default_config.js` | -- | TODO |
| 9 | Tests for probability deck, config validation, compositor | -- | -- | TODO |
| 10 | Minimal test HTML page | -- | -- | TODO |

**Exit criteria:** Given configs and a seed, produces all layer canvases programmatically. Test page renders a visible map.

---

## Phase 3: Display and Interaction -- "It responds"

| # | Deliverable | Source module(s) | Test file(s) | Status |
|---|-------------|-----------------|--------------|--------|
| 1 | `index.html` -- complete layout | `src/web-tilemapper.html` | -- | TODO |
| 2 | `src/main.js` -- app init | -- | -- | TODO |
| 3 | `src/interaction/pan.js`, `zoom.js`, `click-detect.js`, `selection.js` | `src/tilemapper_display.js` | `test/interaction/*.test.js` | TODO |
| 4 | `src/ui/toolbar.js`, `config-bar.js`, `layer-controls.js`, `palette-panel.js` | `src/tilemapper_palette.js` | -- | TODO |
| 5 | `src/ui/tile-card.js`, `tile-card-stack.js` | `src/tilemapper_tileCard.js` | -- | TODO |
| 6 | `src/io/file-loader.js` | -- | -- | TODO |
| 7 | CSS styling | -- | -- | TODO |

**Exit criteria:** Full working app in browser. Generate, pan, zoom, select, paint, open cards, toggle layers.

---

## Phase 4: Export and Polish -- "It ships"

| # | Deliverable | Source module(s) | Test file(s) | Status |
|---|-------------|-----------------|--------------|--------|
| 1 | `src/io/export-image.js`, `export-data.js` | -- | -- | TODO |
| 2 | Tile operations: re-roll, delete | -- | -- | TODO |
| 3 | Keyboard shortcuts | -- | -- | TODO |
| 4 | Performance testing (radius 40) | -- | -- | TODO |
| 5 | Cross-browser testing | -- | -- | TODO |
| 6 | `file://` protocol testing | -- | -- | TODO |
| 7 | Integration tests | -- | -- | TODO |

**Exit criteria:** All functional requirements verified. Tests green. Works offline from `file://`.

---

## Progress Check

To check progress at any time, run:

```bash
npm test
```

Then compare results against this document. Each deliverable's status should be updated to one of:

- **TODO** -- not started
- **IN PROGRESS** -- actively being worked on
- **DONE** -- implemented, tested, committed
