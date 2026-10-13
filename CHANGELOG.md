# Changelog

All notable changes to Prism are listed here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Prism has no versioned releases yet. The live site at
https://fizzexual.github.io/Prism/ always runs the `main` branch. The entries
below are grouped by date and built from the git history.

## 2026-10-12

### Added

- Hover and pressed effects. The style panel has a Normal / Hover / Pressed
  switch, one-click presets (Lift, Grow, Glow, Dim; Press, Sink), transition
  duration and easing, and a live preview of the state on the canvas. The
  exported site gets the same `:hover` / `:active` CSS. Hover only applies on
  devices that can hover, so it never sticks on phones.
- Scroll and entrance animations. An Animation section in the style panel
  with 8 presets (fade, fade up/down, slide, zoom, blur, flip), duration,
  delay, easing, replay on scroll back, a stagger that animates a container's
  children one after another, and a Play button. Section templates come
  animated. Exported pages reveal elements as they scroll into view with a
  tiny built-in script; content is never left hidden, and visitors who prefer
  reduced motion see no animation.
- Google Fonts. 16 curated fonts (Inter, Manrope, Poppins, Space Grotesk,
  Syne, Playfair Display, Fraunces, JetBrains Mono and more) in the Font
  dropdown, plus site-wide Heading and Body fonts in the Theme panel. Only the
  fonts a site uses are loaded, in the editor and in the exported page.
- Site themes. With nothing selected, the Theme panel offers six presets
  (Indigo, Midnight, Sunset, Forest, Mono, Candy), six named colours that
  restyle the site live, corner rounding and heading/body fonts. Applying a
  theme also links existing colours and corners to it. Every colour picker
  offers the theme colours as live links. All presets pass WCAG AA contrast.
- Section library: 17 sections in 8 groups (new: Hero split, Logo cloud,
  Stats, Bento grid, Gallery, Team, Testimonials, Pricing, FAQ, Contact,
  Newsletter, Footer with columns), all phone-ready, theme-linked and animated.
  Starter pages (Landing page, Portfolio, Startup) add a complete new page in
  one click.
- 3D as Prism's signature. One scene engine runs in the editor and in the
  exported site. Upload your own .glb model (or paste a link), pick Glass,
  Chrome, Satin, Clay, Neon or Wire with real studio reflections, colour it
  with the theme, and make it Follow the mouse, Rotate on scroll, Float or
  Drag & spin. 3D pauses off-screen, respects reduced motion and frees its GPU
  context. New Hero (3D) section.
- Publishing. Each page has search & sharing settings (title, description,
  share image, hide from search) with a live Google-style preview. Links and
  buttons can point at any page of the site. The Publish dialog sets the site
  address, language and favicon, shows a checklist, downloads the whole site
  as a ZIP with sitemap.xml and robots.txt, and explains how to put it online.

### Fixed

- The colour picker closed every time you clicked its gradient.
- Undo now reverts a whole typed word or slider drag in one step instead of
  one character or tick at a time (edits to the same field less than a second
  apart are grouped).

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
