# Multi-breakpoint Infinite Canvas (Milestone 2)

**Date:** 2026-06-22
**Status:** Approved direction (user said "continue"); building phase-by-phase
**Goal:** The signature Framer canvas — Desktop/Tablet/Phone frames side-by-side on an
infinite, zoomable, pannable surface, editing each breakpoint in place.

## Key insight (de-risks the whole thing)

Today's canvas binds pointer handlers **inside** the iframe document. Those coordinates are the
iframe's own (unscaled) viewport coordinates, mapped by the browser through any parent CSS
transform. So **drag / reorder / insert / inline-edit keep working untouched when the canvas is
zoomed** — only the *parent-document* overlays (selection box, resize handles, drop line, snap
guides) bridge iframe-internal rects to parent screen pixels and therefore need a scale factor `z`:
`screenX = iframeRect.left + elRect.left * z`, sizes `* z`, handles stay constant size, and
parent-doc drag deltas convert by `/ z`.

## Architecture

- **`DeviceFrame.jsx` (new):** owns ONE iframe for ONE breakpoint. Encapsulates doc setup
  (reset/ws/edit stylesheets), the React portal that renders the active page's tree, and ALL the
  iframe event wiring currently in Canvas (select, drag-move, reorder, hover, contextmenu,
  drag-to-insert, dblclick inline edit). Parameterized by `breakpoint` so **editing in a frame
  writes that breakpoint's styles**. Sized to the breakpoint device width. The same injected
  stylesheet (`generateCss`) is used in every frame — the frame's *width* makes the `max-width`
  media queries resolve per device, so Desktop shows base, Tablet base+tablet, Phone base+tablet+mobile.
- **`Canvas.jsx` (rewritten):** an infinite **CanvasSurface** holding a transformed "world" div
  (`transform: translate(panX,panY) scale(z)`) that lays the DeviceFrames out in a row. Owns
  zoom/pan state and the bottom zoom control. Renders the shared Overlay for the focused frame.
- **`Overlay.jsx` (updated):** takes the focused frame's iframe + scale `z`; all rect math `* z`,
  resize deltas `/ z`, handles constant screen size.
- **UI state (`store.js`):** add `activeFrame` (breakpoint of the focused frame); clicking/selecting
  in a frame sets both `selectedId` and `breakpoint = that frame's bp`. Zoom/pan can live in Canvas
  local state (not undoable).

## Interactions

- **Pan:** Space+drag, or a Hand-tool toggle; wheel scrolls the surface; trackpad pan supported.
- **Zoom:** Ctrl/⌘+wheel zooms toward the cursor; bottom control has −/＋, a % readout, and "Fit".
- **Fit:** compute scale+pan so all frames fit the viewport (on load and on demand).

## Phases (each: build + live Chrome verify + commit)

1. **Infinite canvas (single frame):** wrap the existing single frame in the pannable/zoomable
   surface; add zoom/pan + bottom control; make Overlay + dropLine + guides scale-aware. Verify
   select/drag/resize/reorder/insert/inline-edit all work at 100% AND when zoomed/panned.
2. **Multiple device frames:** extract `DeviceFrame`; render Desktop/Tablet/Phone; per-frame
   breakpoint editing; focused-frame selection/overlay; all frames stay in sync via the shared store.
   Verify editing in the Phone frame writes mobile overrides and every frame updates.
3. **Polish + finalize:** frame headers (device name + width), fit-on-load, performance pass,
   confirm export unaffected, full build + tests, merge to main, deploy, verify live.

## Non-goals (later milestones)

Components & variables; scroll/appear animations; per-frame add/remove of custom breakpoints
(stick to the three standard ones this milestone).

## Risks & mitigations

- **Overlay misalignment under zoom** → single `z` factor applied in one place (Overlay + the two
  parent-doc decorations); verified live at multiple zoom levels.
- **N iframes performance** → 3 frames, same tree; React portals are cheap; verify no jank.
- **Regression in existing editing** → phase 1 keeps ONE frame and re-verifies every interaction
  before adding frames in phase 2.
