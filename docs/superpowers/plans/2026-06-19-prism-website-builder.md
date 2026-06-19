# Prism Website Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Prism — a freeform drag-and-drop website builder with first-class Three.js 3D, React+Vite client, Express+PostgreSQL backend, code export, undo/redo, responsive preview, layers, and a property inspector — replacing the existing Nestbill finance app in this repo.

**Architecture:** npm-workspaces monorepo (`client/` React+Vite+Tailwind, `server/` Express+pg). A single `Project` JSON document (pages → absolutely-positioned elements) is the source of truth, held in a Zustand store (zundo for undo/redo), persisted to Postgres `jsonb`, rendered by one `ElementRenderer` used by both editor and preview, and consumed by a pure-function export pipeline that emits a standalone ZIP. 3D elements embed `@react-three/fiber` canvases driven by a serializable `ThreeConfig`.

**Tech Stack:** React 18, Vite, Tailwind, Zustand, zundo, @dnd-kit/core+sortable, three + @react-three/fiber + @react-three/drei, lucide-react, react-colorful, jszip, file-saver, Express, pg, multer, Vitest, @testing-library/react, supertest.

## Global Constraints

- **Engine:** freeform absolute positioning (`rect: {x,y,width,height,rotation}`); NOT flow/DOM-tree layout.
- **Source of truth:** the entire `Project` document is serializable JSON; it is what is stored in Postgres `jsonb` and the only input to export. No editor-only state may leak into it.
- **Two stores:** `documentStore` (in undo history via zundo) vs `editorStore` (selection/zoom/breakpoint — NOT in history). Never mix.
- **Single renderer:** editor and preview both use `ElementRenderer` with a `mode: 'edit' | 'preview'` prop. No duplicate render paths.
- **Registry-driven:** element types are defined ONLY in `client/src/elements/registry.js`; palette, renderer, inspector, and exporter read from it. 3D loaders defined ONLY in `client/src/three/loaderRegistry.js`.
- **Pure generators:** `export/*Gen.js`, `lib/snapping.js`, `lib/geometry.js` are pure (no React/DOM/store imports) so they unit-test directly.
- **Breakpoints:** desktop 1280 / tablet 768 / mobile 375. Resolution rule everywhere: `value = responsive[breakpoint]?.[key] ?? rect[key]`.
- **Node:** ES modules (`"type": "module"`) in both workspaces. Server reads `DATABASE_URL` and `PORT` from env.
- **Commits:** conventional-commit messages, one per task minimum.

---

## File Structure

```
/
  package.json                 workspaces [client, server]; scripts dev/build/test/migrate
  docker-compose.yml           local Postgres 16
  .env.example                 DATABASE_URL, PORT, VITE_API_BASE
  .gitignore                   node_modules, server/uploads, dist, .env
  README.md                    setup/run/deploy
  docs/
    superpowers/specs/2026-06-19-prism-website-builder-design.md
    superpowers/plans/2026-06-19-prism-website-builder.md
    adding-components.md
    adding-3d-models.md
  client/
    index.html
    vite.config.js             react plugin; proxy /api + /uploads -> :3001
    tailwind.config.js  postcss.config.js
    package.json
    src/
      main.jsx  App.jsx  index.css
      lib/
        ids.js                 newId()
        geometry.js            rotation-aware bounds, point math (pure)
        snapping.js            grid snap + alignment guides (pure)
        api.js                 fetch wrappers for /api
        defaultDocument.js     blank project factory
      state/
        documentStore.js       zustand + zundo; pages/elements mutations
        editorStore.js         selection, breakpoint, zoom, grid, preview
      elements/
        registry.js            element type definitions (the seam)
        ElementRenderer.jsx    renders one element by type+mode
        Element3D.jsx          R3F canvas for type '3d'
      three/
        loaderRegistry.js      {ext -> loader} (the 3D seam)
        useModel.js            load + cache THREE.Object3D from asset url
        SceneControls.jsx      TransformControls/OrbitControls wiring
      export/
        exportProject.js       orchestrates zip build
        htmlGen.js  cssGen.js  threeGen.js   (pure)
      components/
        Toolbar.jsx
        Palette.jsx
        Canvas/ CanvasStage.jsx SelectionLayer.jsx GuideLines.jsx GridOverlay.jsx
        Inspector/ Inspector.jsx fields/*.jsx
        Layers/ LayersPanel.jsx
        Preview/ PreviewFrame.jsx
        Projects/ ProjectBar.jsx
      test/ fixtures.js  setup.js
  server/
    package.json
    src/
      index.js                 express app + static uploads + listen
      db.js                    pg Pool + runMigrations()
      migrations/001_init.sql
      routes/projects.js  routes/assets.js
      repo.js                  data-access (testable seam)
    uploads/.gitkeep
```

---

## Task 1: Repo reset + monorepo scaffold

**Files:**
- Delete: all Nestbill app files (`src/`, `index.html`, `public/`, `tailwind.config.js`, `postcss.config.js`, `vite.config.js`, `package.json`, `package-lock.json`, `dist/`, `README.md`) — keep `.git/`, `.gitignore`, `docs/`.
- Create: root `package.json`, `.gitignore`, `.env.example`, `docker-compose.yml`, `client/package.json`, `server/package.json`.

**Interfaces:**
- Produces: `npm install` at root installs both workspaces; `npm run dev` runs client+server; `npm run migrate`; `npm test`.

- [ ] **Step 1: Remove finance app** (keep `.git`, `docs`, `.gitignore`)

```bash
git rm -r --quiet src public dist index.html package.json package-lock.json vite.config.js tailwind.config.js postcss.config.js README.md node_modules 2>/dev/null; true
```

- [ ] **Step 2: Root `package.json`**

```json
{
  "name": "prism",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm:dev:server\" \"npm:dev:client\"",
    "dev:client": "npm -w client run dev",
    "dev:server": "npm -w server run dev",
    "build": "npm -w client run build",
    "migrate": "npm -w server run migrate",
    "test": "npm -w client run test -- --run && npm -w server run test -- --run"
  },
  "devDependencies": { "concurrently": "^9.1.0" }
}
```

- [ ] **Step 3: `.gitignore`, `.env.example`, `docker-compose.yml`**

`.gitignore`:
```
node_modules
dist
.env
server/uploads/*
!server/uploads/.gitkeep
```
`.env.example`:
```
DATABASE_URL=postgres://prism:prism@localhost:5432/prism
PORT=3001
VITE_API_BASE=
```
`docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_USER: prism, POSTGRES_PASSWORD: prism, POSTGRES_DB: prism }
    ports: ["5432:5432"]
    volumes: ["prism_pg:/var/lib/postgresql/data"]
volumes: { prism_pg: {} }
```

- [ ] **Step 4: client & server `package.json`** (deps per Tech Stack; client scripts `dev`/`build`/`test` via vite+vitest; server `dev` nodemon, `migrate`, `test` vitest).

- [ ] **Step 5: Install + commit**

```bash
npm install
git add -A && git commit -m "chore: reset repo to Prism monorepo scaffold"
```
Expected: install succeeds, both workspaces linked.

---

## Task 2: Server — db, migrations, repo, health

**Files:** Create `server/src/db.js`, `server/src/migrations/001_init.sql`, `server/src/repo.js`, `server/src/index.js`, `server/src/routes/projects.js`, `server/src/routes/assets.js`, `server/test/api.test.js`.

**Interfaces:**
- Produces: `repo` with `listProjects()`, `createProject({name,document})`, `getProject(id)`, `updateProject(id,patch)`, `deleteProject(id)`, `addAsset(projectId,file)`, `listAssets(projectId)`, `deleteAsset(id)`. Express app default-exported from `index.js` for supertest; `start()` only when run directly.
- Consumes: `DATABASE_URL` env; schema from Task design §12.

- [ ] **Step 1: Migration `001_init.sql`** — `pgcrypto`, `_migrations`, `projects`, `assets` tables exactly per spec §12.

- [ ] **Step 2: `db.js`** — `pg.Pool` from `DATABASE_URL`; `runMigrations()` reads `migrations/*.sql` sorted, skips ones already in `_migrations`, runs each in a transaction, records filename.

- [ ] **Step 3: `repo.js`** — the queries above using parameterized SQL; `updateProject` does `COALESCE`-style partial update of `name/document/thumbnail` and bumps `updated_at`.

- [ ] **Step 4: Write failing API test**

```js
import request from 'supertest'; import app from '../src/index.js';
test('project CRUD roundtrip', async () => {
  const created = await request(app).post('/api/projects')
    .send({ name: 'T', document: { pages: [] } }).expect(201);
  const id = created.body.id;
  await request(app).get(`/api/projects/${id}`).expect(200)
    .then(r => expect(r.body.name).toBe('T'));
  await request(app).put(`/api/projects/${id}`).send({ name: 'T2' }).expect(200);
  await request(app).get('/api/projects').expect(200)
    .then(r => expect(r.body.some(p => p.id === id)).toBe(true));
  await request(app).delete(`/api/projects/${id}`).expect(204);
});
```

- [ ] **Step 5: Run — expect FAIL** (`npm -w server test -- --run`): routes missing.

- [ ] **Step 6: Implement `routes/projects.js` + `routes/assets.js` + `index.js`** — JSON body parser, CORS, mount routers under `/api`, `multer` disk storage to `uploads/` for assets, static `/uploads`, `GET /api/health` → `{ok:true}`. `index.js` exports `app`; if `import.meta.url` is entry, `runMigrations().then(start)`.

- [ ] **Step 7: Run — expect PASS** (requires Postgres up: `docker compose up -d db && npm run migrate`).

- [ ] **Step 8: Commit** `feat(server): projects+assets API over postgres`.

---

## Task 3: Client shell + core lib (ids, geometry, defaultDocument)

**Files:** Create `client/index.html`, `client/vite.config.js`, `client/tailwind.config.js`, `client/postcss.config.js`, `client/src/main.jsx`, `client/src/App.jsx`, `client/src/index.css`, `client/src/lib/ids.js`, `client/src/lib/geometry.js`, `client/src/lib/defaultDocument.js`, `client/src/test/setup.js`, tests `client/src/lib/geometry.test.js`.

**Interfaces:**
- Produces:
  - `newId(prefix='el')` → string.
  - `geometry`: `rectBounds(rect)` → `{left,top,right,bottom,cx,cy}` (rotation-aware AABB), `rotatePoint(px,py,cx,cy,deg)`.
  - `defaultDocument(name)` → `{ id, name, pages:[{id,name,canvas:{background:'#ffffff'},elements:[]}] }`.
- Consumes: nothing.

- [ ] **Step 1: Vite config** — react plugin; `server.proxy` for `/api` and `/uploads` → `http://localhost:3001`. Tailwind + index.html shell with `#root`.

- [ ] **Step 2: Failing test for geometry**

```js
import { rectBounds } from './geometry.js';
test('axis-aligned bounds for unrotated rect', () => {
  expect(rectBounds({x:10,y:20,width:100,height:50,rotation:0}))
    .toEqual({left:10,top:20,right:110,bottom:70,cx:60,cy:45});
});
test('90deg rotation swaps extents around center', () => {
  const b = rectBounds({x:0,y:0,width:100,height:50,rotation:90});
  expect(Math.round(b.right - b.left)).toBe(50);
  expect(Math.round(b.bottom - b.top)).toBe(100);
});
```

- [ ] **Step 3: Run — expect FAIL.**
- [ ] **Step 4: Implement `geometry.js`** (rotate 4 corners about center, min/max). `ids.js`, `defaultDocument.js`.
- [ ] **Step 5: Run — expect PASS.**
- [ ] **Step 6: `App.jsx`** renders a static 3-pane shell (Palette | Canvas | Inspector) with Tailwind to prove the client boots. `npm -w client run dev` shows it.
- [ ] **Step 7: Commit** `feat(client): vite shell + geometry/id utilities`.

---

## Task 4: Stores — documentStore (zundo) + editorStore

**Files:** Create `client/src/state/documentStore.js`, `client/src/state/editorStore.js`, tests `client/src/state/documentStore.test.js`.

**Interfaces:**
- Produces `useDocumentStore` (zustand+zundo) state `{ project }` and actions:
  - `loadProject(project)`, `setProjectMeta(patch)`
  - `addElement(pageId, element)`, `updateElement(pageId, id, patch)` (deep-merges `rect/style/content/responsive/three`), `updateElements(pageId, ids, patch)`, `removeElements(pageId, ids)`, `duplicateElements(pageId, ids) -> newIds`
  - `reorder(pageId, id, toIndex)` (recomputes `zIndex` as array order), `bringToFront/sendToBack(pageId,id)`
  - `setBreakpointPatch(pageId, id, breakpoint, patch)` (writes `responsive[bp]`; breakpoint 'desktop' writes `rect`)
  - `addPage/removePage/renamePage`
  - history helpers: `useDocumentStore.temporal` (zundo).
- Produces `useEditorStore`: `{ selectedIds:[], activePageId, breakpoint:'desktop', zoom:1, grid:{enabled:true,size:8,snap:true}, guides:true, previewMode:false }` + setters `select(ids)`, `toggleSelect(id)`, `clearSelect()`, `setBreakpoint`, `setZoom`, `setGrid`, `setActivePage`, `setPreview`.

- [ ] **Step 1: Failing tests**

```js
import { useDocumentStore } from './documentStore.js';
const reset = () => useDocumentStore.getState().loadProject(
  { id:'p', name:'P', pages:[{id:'pg',name:'Home',canvas:{},elements:[]}] });
test('addElement then updateElement merges patch', () => {
  reset(); const s = useDocumentStore.getState();
  s.addElement('pg', { id:'e1', type:'box', rect:{x:0,y:0,width:10,height:10,rotation:0}, style:{}, content:{} });
  s.updateElement('pg','e1',{ rect:{ x:50 } });
  const el = useDocumentStore.getState().project.pages[0].elements[0];
  expect(el.rect).toMatchObject({ x:50, y:0, width:10 });
});
test('undo reverts last document change', () => {
  reset(); const s = useDocumentStore.getState();
  s.addElement('pg',{ id:'e1', type:'box', rect:{}, style:{}, content:{} });
  useDocumentStore.temporal.getState().undo();
  expect(useDocumentStore.getState().project.pages[0].elements).toHaveLength(0);
});
test('reorder rewrites zIndex by array order', () => {
  reset(); const s = useDocumentStore.getState();
  ['a','b','c'].forEach(id => s.addElement('pg',{id,type:'box',rect:{},style:{},content:{}}));
  s.reorder('pg','a',2);
  const ids = useDocumentStore.getState().project.pages[0].elements.map(e=>e.id);
  expect(ids).toEqual(['b','c','a']);
});
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** both stores. Use immer-style updates (zustand's set with structural copies) so zundo snapshots are independent. zundo `temporal` config: `limit: 100`, `partialize` to track only `project`.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `feat(client): document + editor stores with undo/redo`.

---

## Task 5: Element registry + ElementRenderer

**Files:** Create `client/src/elements/registry.js`, `client/src/elements/ElementRenderer.jsx`, tests `client/src/elements/registry.test.js`.

**Interfaces:**
- Produces `ELEMENTS` object keyed by type. Each entry: `{ type, label, icon, defaultSize:{width,height}, defaultProps:{style,content,three?}, render(element,mode), inspector:[groupKeys], exportTag(element)->{tag,attrs,inner} }`.
- `elementList` = ordered array for the palette.
- `createElement(type, at)` → full element (id, name, rect from defaultSize at `at`, merged defaultProps, zIndex placeholder).
- `ElementRenderer({element, mode})` → renders `ELEMENTS[type].render`; wraps in absolutely-positioned div using resolved rect (consumes `breakpoint` via prop `resolvedRect`).
- Consumes: `newId`.

- [ ] **Step 1: Failing test**

```js
import { createElement, ELEMENTS } from './registry.js';
test('every element type has required fields', () => {
  for (const t of Object.keys(ELEMENTS)) {
    const e = ELEMENTS[t];
    expect(typeof e.render).toBe('function');
    expect(e.defaultSize.width).toBeGreaterThan(0);
    expect(Array.isArray(e.inspector)).toBe(true);
  }
});
test('createElement places at drop point with default size', () => {
  const el = createElement('button', { x: 30, y: 40 });
  expect(el.type).toBe('button');
  expect(el.rect).toMatchObject({ x:30, y:40, width: ELEMENTS.button.defaultSize.width });
  expect(el.content.text).toBeDefined();
});
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement registry** for types: `section, container, heading, text, button, image, icon, divider, spacer, 3d`. Each `render(element, mode)` returns the inner content (renderer wrapper handles position/size). `3d` render returns `<Element3D .../>` (stub import OK until Task 9). `exportTag` maps heading→h2, text→p, button→a, image→img, others→div.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Commit** `feat(client): element registry + renderer`.

---

## Task 6: Canvas — palette drop, selection, transform, snapping, guides

**Files:** Create `client/src/lib/snapping.js`, `client/src/components/Palette.jsx`, `client/src/components/Canvas/CanvasStage.jsx`, `SelectionLayer.jsx`, `GuideLines.jsx`, `GridOverlay.jsx`; tests `client/src/lib/snapping.test.js`. Modify `App.jsx` to wire DndContext + stage.

**Interfaces:**
- Produces (pure `snapping.js`):
  - `snapValue(v, grid)` → nearest multiple.
  - `snapRectToGrid(rect, grid)`.
  - `alignmentGuides(movingRect, others, threshold=6)` → `{ x?:number, y?:number, lines:[{axis,pos,from,to}] }` (snaps moving edges/centers to others'; returns adjusted dx/dy and guide lines).
- Produces (components):
  - `Palette` renders `elementList` as `@dnd-kit` draggables.
  - `CanvasStage` is the dnd droppable artboard; on drop computes artboard coords (zoom-aware), grid-snaps, `addElement`. Hosts pointer-driven move/resize/rotate that call `updateElements`/`setBreakpointPatch` and live-apply snapping+guides. Click selects; Shift adds; empty click clears.
  - `SelectionLayer` draws handles around selection bbox (8 resize + rotate). `GuideLines` renders active guides. `GridOverlay` draws grid when enabled.
- Consumes: stores, registry, geometry.

- [ ] **Step 1: Failing tests for snapping**

```js
import { snapValue, alignmentGuides } from './snapping.js';
test('snapValue rounds to grid', () => { expect(snapValue(11, 8)).toBe(8); expect(snapValue(13,8)).toBe(16); });
test('alignmentGuides snaps left edges within threshold', () => {
  const r = alignmentGuides({x:102,y:0,width:50,height:20},
    [{x:100,y:200,width:30,height:30}], 6);
  expect(r.x).toBe(-2);                 // nudge so left edges align at 100
  expect(r.lines.some(l => l.axis==='x' && l.pos===100)).toBe(true);
});
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement `snapping.js`** (pure).
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Implement Palette + Canvas components** and wire `DndContext` in `App.jsx`. Drop creates element; drag moves; handles resize/rotate; grid+guides applied; selection state via editorStore. Keyboard handlers (nudge/delete/duplicate/undo/redo/z-order/esc) on the stage.
- [ ] **Step 6: Manual verify** with preview tools: drag a Button onto the canvas, move/resize it, undo. Screenshot.
- [ ] **Step 7: Commit** `feat(client): canvas drag-drop, transform, snapping, guides`.

---

## Task 7: Inspector + Layers + Toolbar + Project bar (persistence)

**Files:** Create `client/src/lib/api.js`, `client/src/components/Inspector/Inspector.jsx` + `fields/*.jsx`, `client/src/components/Layers/LayersPanel.jsx`, `client/src/components/Toolbar.jsx`, `client/src/components/Projects/ProjectBar.jsx`; tests `client/src/components/Inspector/inspector.test.jsx`. Modify `App.jsx`.

**Interfaces:**
- Produces:
  - `api`: `listProjects()`, `createProject(p)`, `getProject(id)`, `saveProject(id,patch)`, `deleteProject(id)`, `uploadAsset(projectId, file)`.
  - `Inspector` renders field groups from `ELEMENTS[type].inspector` for the (multi-)selection; edits call `updateElements`/`setBreakpointPatch`. Field components: `NumberField, ColorField, TextField, SelectField, ToggleField`.
  - `LayersPanel`: sortable list (dnd-kit/sortable) → `reorder`; visibility/lock/rename.
  - `Toolbar`: undo/redo, breakpoint switch, zoom, grid toggle, preview toggle, export button.
  - `ProjectBar`: new/open/save/delete + autosave indicator. Autosave: subscribe to documentStore → debounce 800ms → localStorage + `saveProject`.
- Consumes: stores, registry, api.

- [ ] **Step 1: Failing test** — render Inspector with a selected `button`; change the X NumberField; assert `updateElements` patched `rect.x`. (Use a test store seam.)
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** api, fields, Inspector (reads `inspector` groups; Layout group writes to `rect` or `responsive[bp]` per active breakpoint), Layers, Toolbar, ProjectBar + autosave.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Manual verify**: edit color/size in inspector, reorder layers, refresh page → project reloads from server. Screenshot.
- [ ] **Step 6: Commit** `feat(client): inspector, layers, toolbar, persistence + autosave`.

---

## Task 8: Responsive + Preview mode

**Files:** Create `client/src/components/Preview/PreviewFrame.jsx`; modify `CanvasStage.jsx` (artboard width by breakpoint), `editorStore` (already has breakpoint), `Toolbar` (preview toggle wired).

**Interfaces:**
- Produces: `resolveRect(element, breakpoint)` helper in `geometry.js` → applies `responsive[bp] ?? rect`. `PreviewFrame` renders the active page via `ElementRenderer mode="preview"` inside a device-width frame with live interactions; Esc exits.
- Consumes: registry renderer, stores.

- [ ] **Step 1: Failing test** for `resolveRect`:

```js
import { resolveRect } from '../lib/geometry.js';
test('mobile override wins over base', () => {
  const el = { rect:{x:0,y:0,width:1000,height:10,rotation:0}, responsive:{ mobile:{ width:320 } } };
  expect(resolveRect(el,'mobile').width).toBe(320);
  expect(resolveRect(el,'desktop').width).toBe(1000);
});
```
- [ ] **Step 2: Run FAIL → implement `resolveRect` → Step 3: Run PASS.**
- [ ] **Step 4: Implement** breakpoint-driven artboard width + `PreviewFrame`; renderer uses `resolveRect`.
- [ ] **Step 5: Manual verify**: switch desktop/tablet/mobile, set a mobile-only width override, toggle Preview. Screenshots at 3 widths.
- [ ] **Step 6: Commit** `feat(client): responsive breakpoints + preview mode`.

---

## Task 9: 3D subsystem (R3F)

**Files:** Create `client/src/three/loaderRegistry.js`, `client/src/three/useModel.js`, `client/src/three/SceneControls.jsx`, `client/src/elements/Element3D.jsx`, `client/src/components/Inspector/fields/Three*.jsx`; tests `client/src/three/loaderRegistry.test.js`.

**Interfaces:**
- Produces:
  - `loaderRegistry`: map `{ gltf, glb, obj, fbx } -> async load(url) -> THREE.Object3D`; `getLoader(ext)`; `supportedExtensions`.
  - `useModel(url, format)` → `{ object, error, loading }` with cache.
  - `Element3D({element, mode})` → `<Canvas>` with lights from `three.lights`, `Environment` preset, camera (fov/position), `OrbitControls` (enabled in preview/when selected), the loaded model with `three.transform`, optional material override; `SceneControls` adds `TransformControls` in edit mode writing back to `three.transform`.
  - Inspector 3D groups: Model (upload via `api.uploadAsset` → set `three.model`), Transform, Material, Lighting (add/remove lights), Camera.
- Consumes: stores, api, drei.

- [ ] **Step 1: Failing test**

```js
import { getLoader, supportedExtensions } from './loaderRegistry.js';
test('gltf+glb supported and resolvable', () => {
  expect(supportedExtensions).toEqual(expect.arrayContaining(['gltf','glb']));
  expect(typeof getLoader('glb')).toBe('function');
});
```
- [ ] **Step 2: Run FAIL → implement loaderRegistry (GLTF/GLB; OBJ/FBX wired via three addons) → Step 3: Run PASS.**
- [ ] **Step 4: Implement** `useModel`, `Element3D`, `SceneControls`, 3D inspector fields. Replace the Task-5 `Element3D` stub.
- [ ] **Step 5: Manual verify**: add a 3D Object, upload a sample `.glb`, rotate via gizmo, change material color + light intensity, toggle autorotate; preview orbit. Screenshot.
- [ ] **Step 6: Commit** `feat(client): three.js 3D elements with transform/material/lighting/camera`.

---

## Task 10: Export pipeline → ZIP

**Files:** Create `client/src/export/htmlGen.js`, `cssGen.js`, `threeGen.js`, `exportProject.js`; tests `client/src/export/export.test.js`. Modify `Toolbar` (export wired). Add fixtures `client/src/test/fixtures.js`.

**Interfaces:**
- Produces (pure):
  - `cssGen(page)` → string: per-element `.el-<id>` absolute rules + `@media (max-width:768px)` / `(max-width:375px)` from `responsive`.
  - `htmlGen(page)` → string: per element, `ELEMENTS[type].exportTag` → tag with class `el-<id>`; 3D → `<div class="el-<id>" data-three="<id>"></div>`.
  - `threeGen(page)` → string|null: ES-module script (CDN importmap) rebuilding each 3D scene from `three` config; null if no 3D.
  - `exportProject(project, assetResolver)` → `Blob` (zip): `index.html` (+ per-page html), `styles.css`, `scene.js`?, `assets/`, `README.txt`.
- Consumes: registry `exportTag`, jszip, file-saver.

- [ ] **Step 1: Failing tests** against `fixtures.js` (a 1-page doc with a heading + button + one 3D element):

```js
import { cssGen, htmlGen, threeGen } from '../export/index.js';
import { fixturePage } from './fixtures.js';
test('css emits absolute rule + mobile media query', () => {
  const css = cssGen(fixturePage);
  expect(css).toMatch(/\.el-h1\s*\{[^}]*position:\s*absolute/);
  expect(css).toMatch(/@media \(max-width: 375px\)/);
});
test('html maps heading to <h2> and 3d to data-three', () => {
  const html = htmlGen(fixturePage);
  expect(html).toMatch(/<h2[^>]*class="el-h1"/);
  expect(html).toMatch(/data-three="cube"/);
});
test('threeGen present only with 3d', () => {
  expect(threeGen(fixturePage)).toContain('OrbitControls');
});
```
- [ ] **Step 2: Run FAIL → implement generators + `exportProject` → Step 3: Run PASS.**
- [ ] **Step 4: Manual verify**: click Export, unzip, open `index.html` via a static server, confirm layout + spinning 3D. Screenshot.
- [ ] **Step 5: Commit** `feat(client): standalone HTML/CSS/JS+3D zip export`.

---

## Task 11: Docs + README + polish

**Files:** Create `README.md`, `docs/adding-components.md`, `docs/adding-3d-models.md`. Final pass: empty states, error toasts, sample project seed.

- [ ] **Step 1: README** — prerequisites, `cp .env.example .env`, `docker compose up -d db`, `npm install`, `npm run migrate`, `npm run dev`, build, deploy notes, feature tour.
- [ ] **Step 2: `adding-components.md`** — walk through adding one registry entry (palette+render+inspector+exportTag) with a concrete example.
- [ ] **Step 3: `adding-3d-models.md`** — registering a loader in `loaderRegistry.js`; how upload/serving works; supported formats + limits.
- [ ] **Step 4: Polish** — friendly empty canvas, save/error indicators, seed a sample project on first load.
- [ ] **Step 5: Full test run** `npm test`; **Step 6: Commit** `docs: README + extension guides; polish`.

---

## Self-Review

**Spec coverage:** §1 goals → Tasks 1–11. Drag-drop §6 → T6. Inspector §8 → T7/T9. Undo/redo §5 → T4. Layers §9 → T7. Responsive §10 → T8. 3D §11 → T9. Backend/DB §12 → T2. Export §13 → T10. Preview §14 → T8. Testing §15 → tests in each task. Docs §16 → T11. Out-of-scope §17 honored (no auth). All covered.

**Placeholder scan:** No TBD/TODO; the only stub (Element3D in T5) is explicitly replaced in T9 with a forward reference. Generators/snapping/geometry tests carry real assertions.

**Type consistency:** Action names (`addElement`, `updateElements`, `setBreakpointPatch`, `reorder`), `resolveRect`, `createElement`, `exportTag`, `getLoader`, `cssGen/htmlGen/threeGen`, `exportProject(project, assetResolver)` are used identically across tasks. `rect` shape `{x,y,width,height,rotation}` and `responsive[bp]` partials consistent. Stores split (document vs editor) consistent with Global Constraints.
