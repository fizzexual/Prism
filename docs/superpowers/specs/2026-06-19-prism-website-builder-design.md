# Prism — Drag-and-Drop Website Builder with 3D

- **Date:** 2026-06-19
- **Status:** Approved (design), pending implementation plan
- **Author:** brainstorming session

> "Prism" is the working product name (a builder that bends flat pages into 3D). Easily renameable.

## 1. Overview

Prism is a browser-based **visual website builder** with a **freeform absolute-positioned canvas**. Users drag UI elements (and 3D objects) from a palette onto an artboard, edit their properties in an inspector, preview the result responsively, save/load projects to a database, and export a standalone HTML/CSS/JS site.

The differentiator is first-class **Three.js 3D**: any page can contain 3D objects (GLTF/GLB, with OBJ/FBX best-effort) with editable transform, material, lighting, and camera, both in the editor and in exported output.

### Goals (v1)

A full-breadth, genuinely usable working prototype covering every feature category:

- Drag-and-drop element creation on a freeform canvas
- Move / resize / rotate with snap-to-grid and alignment guides
- Context-sensitive property inspector
- Undo/redo, layering/z-index, multi-page projects
- Responsive preview (desktop / tablet / mobile) with per-breakpoint overrides
- Real-time preview mode
- 3D core: GLTF import + transform/material/lighting/camera editing
- PostgreSQL-backed save/load + asset uploads
- Code export to a downloadable ZIP (standalone site)
- Extension docs: how to add a component, how to add a 3D format

### Non-goals (v1)

User accounts/auth (single unauthenticated workspace), real-time collaboration, animation timelines, font uploads, project versioning beyond undo, advanced flow/semantic layout (engine B/C). Architecture leaves clean seams to add these later.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Editor styling | Tailwind CSS |
| Canvas state | Zustand |
| Undo/redo | zundo (temporal middleware) |
| Drag from palette | @dnd-kit/core |
| Layers reorder | @dnd-kit/sortable |
| 3D | three + @react-three/fiber + @react-three/drei |
| Icons | lucide-react |
| Color picker | react-colorful |
| Export | jszip + file-saver |
| Backend | Node + Express |
| DB driver | pg (node-postgres) |
| Uploads | multer (disk storage) |
| Dev orchestration | concurrently, nodemon |
| Tests | Vitest, @testing-library/react, supertest |

Decided in brainstorming: engine **A (freeform absolute canvas)**; persistence **Express + PostgreSQL** (document as `jsonb`) + localStorage autosave; framework **React**.

## 3. Architecture

npm-workspaces monorepo:

```
/
  package.json            # workspaces: [client, server]; root scripts: dev, build, test
  docker-compose.yml      # local Postgres
  .env.example            # DATABASE_URL, PORT, etc.
  README.md
  docs/
    superpowers/specs/2026-06-19-prism-website-builder-design.md
    adding-components.md
    adding-3d-models.md
  client/
    index.html
    vite.config.js
    tailwind.config.js
    src/
      main.jsx, App.jsx
      state/        documentStore.js, editorStore.js
      components/   Palette/ Canvas/ Inspector/ Layers/ Toolbar/ PreviewFrame/
      elements/     registry.js, ElementRenderer.jsx, Element3D.jsx
      three/        loaderRegistry.js, MaterialEditor, LightingEditor, CameraControls
      export/       exportProject.js, htmlGen.js, cssGen.js, threeGen.js
      lib/          api.js, snapping.js, geometry.js, ids.js
  server/
    src/
      index.js      # express app
      db.js         # pg pool + migration runner
      migrations/   001_init.sql ...
      routes/       projects.js, assets.js
    uploads/        # gitignored, served statically
```

Dev: `npm run dev` (root) → Vite client (5173) + Express server (3001) via `concurrently`. Client proxies `/api` and `/uploads` to the server in `vite.config.js`.

## 4. Document data model (single source of truth)

The entire `Project` document is stored as Postgres `jsonb` and is the only input to export.

```ts
Project  { id, name, pages: Page[] }
Page     { id, name, canvas: { background }, elements: Element[] }

Element {
  id, type,                 // type keys into the element registry
  name,                     // layer name
  locked, hidden, zIndex,
  rect: { x, y, width, height, rotation },     // base = desktop breakpoint
  responsive?: {            // sparse per-breakpoint overrides
    tablet?:  Partial<{ x, y, width, height, hidden }>,
    mobile?:  Partial<{ x, y, width, height, hidden }>,
  },
  style: {                  // CSS-mapped appearance
    background, color, opacity,
    border: { width, style, color }, radius, shadow, padding,
    font: { family, size, weight, lineHeight, align },
  },
  content: { text?, src?, alt?, href?, iconName? },
  three?: ThreeConfig,      // present only for type === '3d'
}

ThreeConfig {
  model:    { assetId, format },               // format: 'gltf'|'glb'|'obj'|'fbx'
  transform:{ position:[x,y,z], rotation:[x,y,z], scale:[x,y,z] },
  material: { color, metalness, roughness, wireframe, opacity, enabled },
  lights:   Light[],                            // ambient/directional/point
  environment: string|null,                     // drei preset key
  camera:   { fov, autoRotate, orbit, position:[x,y,z] },
  background: string|null,
}
```

Resolution rule for responsive: a breakpoint's value = its override ?? desktop base.

## 5. State management & undo/redo

Two Zustand stores with distinct responsibilities:

- **`documentStore`** — pages + elements, wrapped with **zundo** `temporal`. Only document mutations enter undo history. Actions: `addElement`, `updateElement(id, patch)`, `updateElements(ids, patch)`, `removeElements`, `duplicateElements`, `reorder(id, toIndex)` (z-index), `setBreakpointOverride`, `addPage`, `removePage`, `renameElement`, `setLock/setHidden`. Patches are shallow-merged; batched edits coalesce into one history entry.
- **`editorStore`** — `selectedIds`, `activePageId`, `breakpoint` ('desktop'|'tablet'|'mobile'), `zoom`, `grid { enabled, size, snap }`, `guidesEnabled`, `previewMode`, `panel visibility`. **Not** in history.

**Autosave:** subscribe to `documentStore` → debounce 800ms → write to localStorage (`prism:project:<id>`) and `PUT /api/projects/:id`. On load, server is source of truth; localStorage is a fast-restore/offline fallback.

## 6. Drag-and-drop & canvas interaction

- **Palette → canvas:** `@dnd-kit` `DndContext`. Canvas is a droppable. On drop, the pointer position is converted to artboard coordinates (accounting for zoom and scroll), snapped to grid, and a new element is created from the registry's `defaultProps`/`defaultSize`.
- **On-canvas move / resize / rotate:** a custom pointer-event interaction layer renders a selection box with 8 resize handles + a rotate handle. Owns snapping, multi-select transforms, and rotation. (dnd-kit/react-rnd don't cleanly cover resize+rotate+snap together.)
- **Snapping:** configurable grid (default 8px). Alignment guides snap a moving element to other elements' left/center/right/top/middle/bottom, drawn as guide lines. Pure functions in `lib/snapping.js` (unit-tested).
- **Selection:** click to select, Shift+click to add, click empty canvas to clear. Marquee select is a stretch.
- **Keyboard:** arrows nudge (Shift = ×10), Delete removes, Ctrl/Cmd+Z / +Shift+Z or +Y undo/redo, Ctrl+D duplicate, Ctrl+C/V copy/paste, `[` / `]` z-order, Esc deselect.

## 7. Component library — the element registry (key extensibility seam)

Each element type is **one registry entry**:

```js
{
  type: 'button',
  label: 'Button',
  icon: MousePointerClick,            // lucide icon
  defaultSize: { width: 160, height: 44 },
  defaultProps: { style: {...}, content: { text: 'Button', href: '#' } },
  render: (element, mode) => <button .../>,   // mode: 'edit' | 'preview'
  inspector: ['layout', 'appearance', 'typography', 'content.button'],
  export: (element) => ({ tag: 'a', attrs, innerHTML }),  // semantic export mapping
}
```

The **palette, renderer, inspector, and exporter all read from the registry** — adding a component = adding one entry. This is what `docs/adding-components.md` documents.

v1 types: **Section, Container, Heading, Text, Button, Image, Icon, Divider, Spacer, 3D Object (`3d`)**.

## 8. Property inspector

Renders inspector field-groups declared by the selected element's registry entry. Multi-select edits shared properties across selection.

- **2D groups:** Layout (x/y/w/h, rotation, z-index, lock, hide), Appearance (background, border, radius, shadow, opacity), Typography (family/size/weight/line-height/align/color), Content (text / image src+alt / button label+href / icon).
- **3D groups:** Model (upload or pick asset, shows format), Transform (position/rotation/scale), Material (color, metalness, roughness, wireframe, opacity), Lighting (ambient intensity; add/remove directional & point lights with color/intensity/position; environment preset), Camera (fov, autorotate, orbit toggle).

When `breakpoint !== 'desktop'`, Layout edits write to `responsive[breakpoint]` and the field shows an "overridden" indicator with a reset control.

## 9. Layers panel

Per-page list of elements ordered by z-index (top = front). Drag-to-reorder via `@dnd-kit/sortable` rewrites z-index. Each row: visibility toggle, lock toggle, type icon, editable name. Selection is two-way synced with the canvas.

## 10. Responsive preview

Breakpoint switch sets the artboard width: **desktop 1280 / tablet 768 / mobile 375** (heights flexible). Editing geometry on a non-desktop breakpoint writes overrides (§5/§8). The preview and export resolve overrides as `override ?? base` and emit `@media (max-width: …)` blocks for tablet/mobile.

## 11. 3D subsystem (Three.js core)

`@react-three/fiber` + `@react-three/drei`. Each 3D element renders its **own `<Canvas>`** sized/positioned to its rect on the artboard (keeps 2D and 3D cleanly composed and independently exportable).

- **Loader registry** (`three/loaderRegistry.js`): `{ ext, mimes, load(url) → THREE.Object3D }`. **GLTF/GLB fully supported** (drei `useGLTF`/GLTFLoader). **OBJ + FBX** registered via three.js' `OBJLoader`/`FBXLoader` — included if they integrate cleanly within v1, else trivially added later (documented in `docs/adding-3d-models.md`).
- **Import flow:** drop/select a model file → `POST /api/projects/:id/assets` → asset URL stored in `three.model.assetId` → loaded and displayed.
- **Controls:** drei `TransformControls` gizmos (translate/rotate/scale, mode-switchable) write back to `three.transform`; `OrbitControls` for camera; a small axis gizmo for orientation.
- **Material editor:** color, metalness, roughness, wireframe, opacity applied to the model's meshes (toggle to keep original materials).
- **Lighting editor:** ambient + add/remove directional & point lights (color/intensity/position) + drei `Environment` presets.
- **Camera editor:** fov, autorotate, orbit enable, saved position.

## 12. Backend & database

**Express REST API** (JSON; multipart for uploads):

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/projects` | list (id, name, updated_at, thumbnail) |
| POST | `/api/projects` | create `{ name, document }` |
| GET | `/api/projects/:id` | full project incl. document |
| PUT | `/api/projects/:id` | update `{ name?, document?, thumbnail? }` |
| DELETE | `/api/projects/:id` | delete (cascades assets) |
| POST | `/api/projects/:id/assets` | multipart upload → `{ id, url, filename, mime }` |
| GET | `/api/projects/:id/assets` | list assets |
| DELETE | `/api/assets/:id` | delete asset + file |

**PostgreSQL schema** (ordered SQL migrations run on startup; tracked in a `_migrations` table):

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE projects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  document   jsonb NOT NULL,
  thumbnail  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename   text NOT NULL,     -- stored filename (uuid.ext)
  original   text NOT NULL,     -- user filename
  mime       text NOT NULL,
  size       bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Uploaded files live on disk under `server/uploads/` (gitignored), served statically at `/uploads/<filename>`. `DATABASE_URL` configures the connection; `docker-compose.yml` provides a local Postgres.

## 13. Code export

Client-side generation → **downloadable ZIP** (jszip + file-saver):

```
site.zip
  index.html        # one file per page (index.html + <page>.html)
  styles.css        # per-element classes + @media blocks for tablet/mobile
  scene.js          # only if the page has 3D elements
  assets/           # uploaded models/images
  README.txt        # "serve this folder" note (module/CORS)
```

- **2D elements** → semantic tags via each registry entry's `export()` (h1–h6, p, button, a, img, div), absolutely positioned, classes in `styles.css`.
- **3D elements** → a container `<div>` + a Three.js **ES-module script** (three via CDN importmap) that rebuilds the scene/lights/camera from serialized `ThreeConfig` and loads the model from `assets/`.
- Generators are pure functions (`htmlGen`, `cssGen`, `threeGen`) — unit-tested against fixture documents.

## 14. Real-time preview

A Preview toggle reuses the **same `ElementRenderer`** with `mode="preview"`: no selection chrome/handles, active breakpoint width, live interactions (links/buttons work, 3D `OrbitControls` enabled). Single rendering source of truth → editor and preview can't drift.

## 15. Testing strategy

Vitest across both workspaces. Highest-value targets first:

- **Pure logic (unit):** `snapping`/`geometry`, document-store reducers, the export generators (`htmlGen`/`cssGen`/`threeGen`) against fixture documents, responsive resolution.
- **Components:** inspector field binding, palette→drop creates correct element (`@testing-library/react`).
- **Server:** API CRUD + asset upload happy/error paths via `supertest` (against a test database or a thin in-memory repo seam).

## 16. Documentation deliverable

- `README.md` — prerequisites, env setup, `docker-compose up` for Postgres, `npm run dev`, build, deploy notes.
- `docs/adding-components.md` — register a new element type (one registry entry: palette + render + inspector + export).
- `docs/adding-3d-models.md` — register a loader for a new 3D format; how model upload/serving works.

## 17. Build order (informs the implementation plan)

1. **Scaffold & infra:** delete finance app; monorepo + workspaces; Vite client shell; Express server; Postgres + migrations; health check; `docker-compose`.
2. **Document core:** data model, Zustand stores, zundo undo/redo, element registry skeleton.
3. **Canvas & 2D editing:** artboard, palette drop, selection, move/resize/rotate, snapping/guides, keyboard.
4. **Inspector + Layers + Toolbar:** property editing, layer reordering, z-index, lock/hide.
5. **Persistence:** API client, autosave, project list/load/save/new/delete.
6. **Responsive + Preview:** breakpoints, overrides, preview mode.
7. **3D subsystem:** R3F canvas element, GLTF load, transform/material/lighting/camera editors, asset upload.
8. **Export:** html/css/three generators, ZIP download.
9. **Tests + docs + polish.**

Each step should leave the app runnable.
