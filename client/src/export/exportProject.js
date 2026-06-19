import JSZip from 'jszip';
import { cssGen } from './cssGen.js';
import { htmlGen, escHtml } from './htmlGen.js';
import { threeGen } from './threeGen.js';

const THREE_VERSION = '0.169.0';

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function assetFileName(url, idx) {
  const clean = url.split('?')[0];
  const base = clean.substring(clean.lastIndexOf('/') + 1) || `asset-${idx}`;
  return /\.[a-z0-9]+$/i.test(base) ? `${idx}-${base}` : `${idx}-${base}.bin`;
}

/** Fetch + bundle non-inline assets into the zip, rewriting urls to relative paths. */
async function bundleAssets(project, zip, fetcher) {
  const clone = structuredClone(project);
  const map = new Map();
  let idx = 0;
  for (const page of clone.pages) {
    for (const el of page.elements) {
      const targets = [];
      if (el.type === 'image' && el.content?.src) targets.push([el.content, 'src']);
      if (el.type === '3d' && el.three?.model?.url) targets.push([el.three.model, 'url']);
      for (const [obj, key] of targets) {
        const url = obj[key];
        if (!url || url.startsWith('data:')) continue; // inline data urls stay as-is
        if (map.has(url)) { obj[key] = map.get(url); continue; }
        try {
          const buf = await fetcher(url);
          const name = `assets/${assetFileName(url, idx++)}`;
          zip.file(name, buf);
          map.set(url, name);
          obj[key] = name;
        } catch {
          /* leave url unchanged if it can't be fetched */
        }
      }
    }
  }
  return clone;
}

function htmlDoc(project, page, has3D) {
  const head3D = has3D
    ? `
  <script type="importmap">
  { "imports": { "three": "https://unpkg.com/three@${THREE_VERSION}/build/three.module.js", "three/addons/": "https://unpkg.com/three@${THREE_VERSION}/examples/jsm/" } }
  </script>
  <script type="module" src="scene.js"></script>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(project.name)} — ${escHtml(page.name)}</title>
  <link rel="stylesheet" href="styles.css" />${head3D}
</head>
<body>
  <div class="prism-page" style="background:${page.canvas?.background || '#ffffff'}">
${htmlGen(page)}
  </div>
</body>
</html>
`;
}

const README = `This site was exported from Prism.

Files
  index.html        first page (one .html per page)
  styles.css        layout + responsive styles
  scene.js          three.js scenes (only if the design has 3D objects)
  assets/           bundled images and 3D models

Run it
  3D scenes load three.js as ES modules from a CDN, which browsers only allow
  over http(s) — not file://. Serve the folder, e.g.:
      npx serve .
  then open the printed URL. Pages without 3D open directly from index.html.
`;

/**
 * Build a downloadable ZIP of the project as a standalone site.
 * @param assetResolver optional (url) => ArrayBuffer, for tests / custom fetching.
 * @returns Promise<Blob>
 */
export async function exportProject(project, assetResolver) {
  const zip = new JSZip();
  const fetcher =
    assetResolver ||
    (async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
      return r.arrayBuffer();
    });

  const rewritten = await bundleAssets(project, zip, fetcher);

  zip.file('styles.css', rewritten.pages.map((p) => cssGen(p)).join('\n\n'));

  const has3D = rewritten.pages.some((p) => p.elements.some((e) => e.type === '3d'));
  if (has3D) {
    const all3d = { elements: rewritten.pages.flatMap((p) => p.elements) };
    const scene = threeGen(all3d);
    if (scene) zip.file('scene.js', scene);
  }

  rewritten.pages.forEach((page, i) => {
    const name = i === 0 ? 'index.html' : `${slug(page.name) || `page-${i}`}.html`;
    zip.file(name, htmlDoc(rewritten, page, has3D));
  });

  zip.file('README.txt', README);
  return zip.generateAsync({ type: 'blob' });
}
