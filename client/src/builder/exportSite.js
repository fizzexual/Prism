import { COMPONENTS } from './components.jsx';
import { generateCss } from './cssGen.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/"/g, '&quot;');
const cls = (id) => `c-${id}`;

const STYLE_BIND_KEYS = ['color', 'background-color', 'font-size', 'font-family'];

// 3D objects: the editor renders them with ThreeBox.jsx. Exported pages get the same scene
// from the same Three.js version (keep in sync with client/package.json), loaded from a CDN.
const THREE_VERSION = '0.169.0';
const THREE_KEYS = ['shape', 'color', 'autoRotate', 'metalness', 'roughness', 'wireframe', 'fov'];
const THREE_SCRIPT = `  <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/"}}</script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    const geometryFor = (s) => s === 'sphere' ? new THREE.SphereGeometry(1.3, 48, 48)
      : s === 'torus' ? new THREE.TorusGeometry(0.95, 0.38, 32, 80)
      : s === 'cone' ? new THREE.ConeGeometry(1.2, 2, 48)
      : s === 'torusKnot' ? new THREE.TorusKnotGeometry(0.85, 0.3, 128, 24)
      : new THREE.BoxGeometry(1.7, 1.7, 1.7);
    for (const el of document.querySelectorAll('[data-prism-3d]')) {
      let c = {};
      try { c = JSON.parse(el.getAttribute('data-prism-3d') || '{}'); } catch { c = {}; }
      const w = el.clientWidth || 320, h = el.clientHeight || 280;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(c.fov || 50, w / h, 0.1, 100);
      camera.position.set(3, 2, 4.5);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5, 6, 4); scene.add(key);
      const rim = new THREE.DirectionalLight(0x88aaff, 0.5); rim.position.set(-4, 2, -3); scene.add(rim);
      scene.add(new THREE.Mesh(geometryFor(c.shape), new THREE.MeshStandardMaterial({
        color: c.color || '#6366f1', metalness: c.metalness ?? 0.35, roughness: c.roughness ?? 0.4, wireframe: !!c.wireframe,
      })));
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.autoRotate = c.autoRotate !== false;
      controls.autoRotateSpeed = 2.2;
      new ResizeObserver(() => {
        const W = el.clientWidth, H = el.clientHeight;
        if (W && H) { renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); }
      }).observe(el);
      (function frame() { requestAnimationFrame(frame); controls.update(); renderer.render(scene, camera); })();
    }
  </script>
`;

function makeResolver(comp, inst) {
  const d = {};
  for (const v of comp.variables || []) d[v.id] = v.default;
  const o = inst.props?.overrides || {};
  return (varId) => (o[varId] !== undefined ? o[varId] : d[varId]);
}

/** Resolve a master node's bindings into export text + inline style for an instance. */
function boundParts(inst, resolve) {
  let text = null;
  const style = [];
  if (resolve && inst.bindings) {
    for (const [prop, varId] of Object.entries(inst.bindings)) {
      const val = resolve(varId);
      if (val === undefined || val === '') continue;
      if (prop === 'text') text = val;
      else if (STYLE_BIND_KEYS.includes(prop)) style.push(`${prop}:${val}`);
    }
  }
  return { text, styleAttr: style.length ? ` style="${escAttr(style.join(';'))}"` : '' };
}

function renderNode(instances, id, indent, components = {}, resolve = null) {
  const inst = instances[id];
  if (!inst) return '';
  if (inst.component === 'Instance') {
    const comp = components[inst.props?.componentId];
    if (!comp) return '';
    return renderNode(instances, comp.rootId, indent, components, makeResolver(comp, inst));
  }
  const def = COMPONENTS[inst.component];
  if (!def) return '';
  const c = cls(id);
  const { text: boundText, styleAttr } = boundParts(inst, resolve);

  if (inst.component === 'Image') {
    return `${indent}<img class="${c}"${styleAttr} src="${escAttr(inst.props.src || '')}" alt="${escAttr(inst.props.alt || '')}" />`;
  }
  if (inst.component === 'Divider') {
    return `${indent}<hr class="${c}"${styleAttr} />`;
  }
  if (inst.component === '3D') {
    const config = {};
    for (const k of THREE_KEYS) if (inst.props?.[k] !== undefined) config[k] = inst.props[k];
    return `${indent}<div class="${c}"${styleAttr} data-prism-3d="${escAttr(esc(JSON.stringify(config)))}"></div>`;
  }
  if (def.container) {
    const kids = inst.children.map((ch) => renderNode(instances, ch, indent + '  ', components, resolve)).filter(Boolean).join('\n');
    return `${indent}<${def.tag} class="${c}"${styleAttr}>\n${kids}\n${indent}</${def.tag}>`;
  }
  const attrs = inst.component === 'Link' ? ` href="${escAttr(inst.props.href || '#')}"` : '';
  const text = boundText != null ? boundText : (inst.props.text || '');
  return `${indent}<${def.tag} class="${c}"${styleAttr}${attrs}>${esc(text)}</${def.tag}>`;
}

const slugify = (s) => String(s || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';

/** Build a self-contained HTML document (CSS inlined) for one page. */
export function exportHtmlForPage(project, page) {
  const body = renderNode(project.instances, page.rootId, '    ', project.components || {});
  const css = `*,*::before,*::after { box-sizing: border-box; }\nbody { margin: 0; }\n${generateCss(project.styles, (id) => `.${cls(id)}`)}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(project.name)} — ${esc(page.name)}</title>
  <style>
${css}
  </style>
</head>
<body>
${body}
${body.includes('data-prism-3d=') ? THREE_SCRIPT : ''}</body>
</html>
`;
}

/** Self-contained HTML for the first page (used by tests / single-page export). */
export function exportHtml(project) {
  return exportHtmlForPage(project, project.pages[0]);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download the site: a single HTML for one page, or a ZIP of all pages. */
export async function downloadHtml(project) {
  const name = slugify(project.name);
  if (project.pages.length <= 1) {
    triggerDownload(new Blob([exportHtml(project)], { type: 'text/html' }), `${name}.html`);
    return;
  }
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  project.pages.forEach((p, i) => {
    const file = i === 0 ? 'index.html' : `${slugify(p.name) || `page-${i}`}.html`;
    zip.file(file, exportHtmlForPage(project, p));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `${name}.zip`);
}
