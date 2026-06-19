# Prism — Drag-and-Drop Website Builder with 3D

Prism is a browser-based visual website builder. Drag UI elements (and **Three.js
3D objects**) onto a freeform canvas, edit them in a property inspector, preview
responsively, save projects to PostgreSQL, and export a standalone HTML/CSS/JS site.

> Built with React + Vite + Tailwind (client) and Express + PostgreSQL (server) in
> an npm-workspaces monorepo.

## Features

- **Freeform canvas** — drag elements from the palette; move, resize, and rotate
  with snap-to-grid and live alignment guides.
- **Component library** — Section, Container, Heading, Text, Button, Image, Icon,
  Divider, Spacer, and **3D Object**.
- **3D (Three.js / @react-three/fiber)** — import GLTF/GLB models (OBJ/FBX too),
  manipulate with transform gizmos, and edit material, lighting, environment, and
  camera. Each 3D object renders in its own viewport.
- **Property inspector** — context-sensitive editing of layout, appearance,
  typography, content, and 3D properties.
- **Undo/redo** — full history (Ctrl/Cmd+Z, +Shift+Z).
- **Layers & z-index** — reorderable layer list with lock/visibility and pages.
- **Responsive** — desktop / tablet / mobile breakpoints with per-breakpoint
  overrides, plus a full-screen live **Preview**.
- **Persistence** — autosave to PostgreSQL via the API, with an offline-first
  localStorage fallback (the app is fully usable with no database running).
- **Code export** — download a standalone ZIP (HTML + CSS + `scene.js` for 3D +
  bundled assets).

## Prerequisites

- Node.js 18+
- Docker (optional, for the local PostgreSQL) — or any PostgreSQL reachable via
  `DATABASE_URL`. **Postgres is optional for local use**: without it, projects
  autosave to your browser's localStorage.

## Quick start

Run each command on its own line. On Windows `cmd`, do **not** paste trailing
`#` comments — `cmd` passes them to the program as arguments.

1. Create your `.env`:
   - **Windows:** `copy .env.example .env`
   - **macOS/Linux:** `cp .env.example .env`
2. *(Optional)* start PostgreSQL for cloud persistence: `docker compose up -d db`
3. Install dependencies: `npm install`
4. *(Optional)* apply database migrations: `npm run migrate`
5. Run client + server together: `npm run dev`

- Editor: **http://localhost:5173**
- API: **http://localhost:9998**

If PostgreSQL isn't running, the server still starts and the editor works —
projects save to localStorage and the save indicator shows "Saved locally".
The API port is configurable via `PORT` in `.env`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run client (Vite) + server (Express) together |
| `npm run build` | Production build of the client |
| `npm run migrate` | Apply SQL migrations to PostgreSQL |
| `npm test` | Run all tests (client + server) |
| `npm run test:client` / `npm run test:server` | Run one workspace's tests |

## Project structure

```
client/   React + Vite editor
  src/
    state/      Zustand stores (documentStore w/ undo, editorStore)
    elements/   registry.jsx (element types), ElementRenderer, Element3D
    three/      loaderRegistry, useModel, R3F helpers
    components/  Palette, Canvas, Inspector, Layers, Toolbar, Preview, Projects
    export/     html/css/three generators + zip builder
    lib/        geometry, snapping, api, persistence
server/   Express + node-postgres
  src/
    app.js      express app factory (DI repo for testing)
    repo.js     PostgreSQL data access
    routes/     projects + assets
    migrations/ ordered SQL, applied on startup
docs/     spec, plan, and extension guides
```

## How it works

The entire project is one serializable JSON document (`Project → Page → Element`).
It lives in a Zustand store (with `zundo` for undo/redo), is stored in PostgreSQL
as `jsonb`, rendered by a single `ElementRenderer` (used by both the editor and the
preview), and consumed by pure export generators. Each element type is one entry in
`client/src/elements/registry.jsx`, which drives the palette, renderer, inspector,
and exporter.

## Extending

- **Add a component:** [docs/adding-components.md](docs/adding-components.md)
- **Add a 3D format:** [docs/adding-3d-models.md](docs/adding-3d-models.md)

## Deployment

- **Client:** `npm run build` → static files in `client/dist/` (any static host).
  Set `VITE_API_BASE` to your API origin at build time if it differs.
- **Server:** deploy `server/` to any Node host; set `DATABASE_URL` and `PORT`,
  run `npm run migrate`, then `npm start`. Uploaded assets are stored on disk under
  `server/uploads/` (mount a persistent volume in production).

## Known limitations (v1)

- Export uses absolute positioning (matching the freeform editor); responsiveness
  is driven by per-breakpoint overrides rather than automatic reflow.
- Icon elements export as empty containers (rendered live in the editor/preview).
- Each 3D object uses its own WebGL context; browsers cap concurrent contexts
  (~16), so keep the number of simultaneous 3D objects modest.
- OBJ/FBX import is supported best-effort; GLTF/GLB is the primary path.

## Testing

`npm test` runs Vitest across both workspaces — pure logic (geometry, snapping,
store reducers, export generators, loader registry), inspector binding, and the
server API (via an in-memory repo, no database required).
