# 3D as Prism's signature — design

## Goal
3D that makes a site memorable: your own models, beautiful materials, motion
that reacts to the visitor. It must be identical in the editor and the export,
and it must stay fast.

## One scene engine
`scene3d.js` exports `mountScene(THREE, addons, el, config)`. It is a
self-contained function (only parameters and browser globals), so:
- the editor calls it with the bundled three.js;
- the export inlines its source (`mountScene.toString()`) and calls it with three.js
  from the CDN (same version), so both render exactly the same scene.

It returns `{ dispose() }`. Dispose frees the geometry, materials, environment,
controls, observers and listeners, then forces the WebGL context to be released.

## Config (`inst.props`, validated by `normalize3D`)
| key | values |
| --- | --- |
| shape | torusKnot, sphere, torus, cube, cone, icosahedron, model |
| modelSrc | `data:model/gltf-binary;base64,…` (uploaded .glb ≤ 8 MB) or an `https://…/.glb/.gltf` URL |
| material | satin, glass, chrome, clay, neon, wire (models keep their own materials) |
| color | `#rrggbb` or a theme link `var(--pm-<colour>)`, resolved from the page's CSS variables |
| motion | orbit (drag + auto-spin), mouse (tilts toward the cursor), scroll (rotates as it scrolls through the viewport), float, still |
| speed | 0.2–3 |

Old projects (autoRotate / wireframe / metalness / roughness) map to the new keys:
- `autoRotate: false` → still
- `wireframe` → wire
- otherwise → satin, with their metalness and roughness kept

## Look
- ACES tone mapping and sRGB output.
- A procedural studio environment (`RoomEnvironment` via PMREM) for reflections,
  with no HDR download.
- A key light plus ambient light.
- Models are centred and scaled to fit.

## Performance and comfort
- Rendering pauses while the element is off-screen (IntersectionObserver).
- With `prefers-reduced-motion`, nothing moves on its own; drag still works.
- Pixel ratio is capped at 2.

## Editor
- A 3D panel with:
  - a shape grid, including "Your model" (upload a .glb or paste a URL)
  - a material grid
  - colour (theme-aware)
  - motion and speed
- The canvas re-renders when the theme colours change.

## Section
**Hero (3D)**: text on the left and a glass torus knot in the theme primary that
follows the mouse. It passes the section-library rules.
