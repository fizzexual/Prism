# Changelog

All notable changes to Prism are listed here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Prism has no versioned releases yet. The live site at
https://fizzexual.github.io/Prism/ always runs the `main` branch. The entries
below are grouped by date and built from the git history.

## 2026-06-22

### Added

- Size modes for elements: Fill, Fit, Fixed and Relative.
- Layout section with Stack, Grid and Block layouts.
- Position section with Flow, Absolute, Fixed and Sticky types.
- Transform section: translate, rotate, scale, skew and origin.
- Appearance section: opacity, visibility, blend mode, overflow and shadow.
- Filters section: filter and backdrop filter.
- Alignment toolbar to align an element inside its parent.
- Infinite canvas with zoom and pan.
- Several device frames side by side on the canvas.
- Components: reusable components with instances that stay in sync.
- Component variables with per-instance overrides.
- Rename and delete components. Deleting a component also removes its
  instances, and its master element cannot be deleted by accident.

### Changed

- Styling is now class-based, as groundwork for components.
- Canvas polish. Frame labels are hidden in preview mode.

## 2026-06-21

### Added

- Pages panel as a sidebar tab: add, switch, rename and delete pages.
- The editor is published to GitHub Pages at
  https://fizzexual.github.io/Prism/ on every push to `main`.

## 2026-06-20

### Added

- Inline text editing, a context menu, copy, paste and duplicate, z-order
  controls, keyboard shortcuts and section templates.
- Multiple pages: a pages menu to add, switch, rename and delete pages, and
  a ZIP export with every page.
- Snapping and alignment guides for free-positioned elements.
- Grid (CSS grid) and Icon widgets, with an icon picker.
- Design tokens: a global color palette editor, with swatches in every color
  picker.
- Asset manager: a tabbed left panel (Add, Layers, Assets) and an image
  library you can reuse across the project.
- 3D Object widget: a live three.js viewport with shapes, material and
  auto-rotate. It loads only when used.
- Dark editor theme. Your choice is remembered.

## 2026-06-19

### Added

- First version of Prism: a visual website builder with a freeform canvas,
  Three.js 3D objects, responsive breakpoints, undo and redo, layers, a
  property inspector and code export. It has a React + Vite client and an
  Express + PostgreSQL server, and saves to the browser when no database is
  running.
- `run.bat`, a one-click launcher for Windows.
- A new builder engine: a canvas that renders real CSS layout in an iframe,
  an element tree, click to select, breakpoints, and undo and redo.
- Visual CSS style panel for layout, spacing, size, typography, background,
  border, effects and position, with live per-breakpoint editing.
- Navigator tree that shows the page hierarchy and syncs selection and hover.
- Drag to insert elements from the panel, with a live drop indicator.
- Editing of text, links and images, including image upload.
- Code export as self-contained HTML and CSS with responsive media queries.
- Autosave, restore on load, a projects menu and a save status indicator.
- Browser-style canvas frame, dotted backdrop and a project bar in the
  header.
- Free positioning: drag to move, resize handles and six more widgets.
- Drag to reorder elements that are in the normal page flow.

### Changed

- Free positioning is opt-in through a Free toggle. Elements stay in the
  page flow by default.
