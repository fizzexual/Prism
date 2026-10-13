import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { COMPONENTS, ICON_SET, tagFor } from './components.jsx';
import { generateCss } from './cssGen.js';
import { normalizeMotion, motionAttrs, motionCss, MOTION_RUNTIME } from './motion.js';
import { usedGoogleFonts, googleFontsHref } from './fonts.js';
import { themeCss, themeFonts } from './theme.js';
import { mountScene, normalize3D } from './scene3d.js';
import { headTags, normalizeSite, resolvePageHref, sitemapXml, robotsTxt, pageFileNames } from './seo.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

/** Allow only link schemes that can't run script (http(s), mailto, tel, anchors, relative paths). */
export function safeHref(href) {
  const raw = String(href ?? '').trim();
  if (!raw) return '#';
  // Browsers ignore tabs/newlines/control chars inside a scheme ("java\tscript:"), so test without them.
  const compact = raw.replace(/[\u0000-\u0020]/g, '').toLowerCase();
  const scheme = compact.match(/^([a-z][a-z0-9+.-]*):/);
  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme[1])) return '#';
  return raw;
}
const cls = (id) => `c-${id}`;

const STYLE_BIND_KEYS = ['color', 'background-color', 'font-size', 'font-family'];

// 3D objects: the editor and the exported page run the SAME engine (scene3d.js): its
// source is inlined here and called with the same Three.js version (keep in sync with
// client/package.json), loaded from a CDN.
const THREE_VERSION = '0.169.0';
const THREE_SCRIPT = `  <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/"}}</script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    const mountScene = ${mountScene.toString()};
    for (const el of document.querySelectorAll('[data-prism-3d]')) {
      let c = {};
      try { c = JSON.parse(el.getAttribute('data-prism-3d') || '{}'); } catch { c = {}; }
      mountScene(THREE, { OrbitControls, RoomEnvironment, GLTFLoader }, el, c);
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
  return { text, style };
}

/**
 * `anim` = { m, extra } is an animation handed down to this node: from a component
 * Instance (animates the master's root) or from a stagger container (extra delay).
 */
function renderNode(instances, id, indent, components = {}, resolve = null, open = new Set(), anim = null) {
  const inst = instances[id];
  if (!inst) return '';
  if (inst.component === 'Instance') {
    const compId = inst.props?.componentId;
    const comp = components[compId];
    // A component placed inside its own master would recurse forever: render nothing for the inner copy.
    if (!comp || open.has(compId)) return '';
    const ownAnim = normalizeMotion(inst.motion);
    const handed = ownAnim ? { m: ownAnim, extra: anim?.extra || 0 } : anim;
    return renderNode(instances, comp.rootId, indent, components, makeResolver(comp, inst), new Set(open).add(compId), handed);
  }
  const def = COMPONENTS[inst.component];
  if (!def) return '';
  const c = cls(id);
  const { text: boundText, style } = boundParts(inst, resolve);

  // Animation: a stagger container hands its animation to its children instead of playing it.
  const own = normalizeMotion(inst.motion);
  const staggers = Boolean(own && own.stagger > 0 && def.container);
  const self = staggers ? null : own ? { m: own, extra: anim?.extra || 0 } : anim;
  const { attrs: motionAttr, vars } = motionAttrs(self?.m, self?.extra || 0);
  const styleList = vars ? [vars, ...style] : style;
  const styleAttr = (styleList.length ? ` style="${escAttr(styleList.join(';'))}"` : '') + motionAttr;

  if (inst.component === 'Image') {
    return `${indent}<img class="${c}"${styleAttr} src="${escAttr(inst.props.src || '')}" alt="${escAttr(inst.props.alt || '')}" />`;
  }
  if (inst.component === 'Divider') {
    return `${indent}<hr class="${c}"${styleAttr} />`;
  }
  if (inst.component === 'Input') {
    return `${indent}<input class="${c}"${styleAttr} placeholder="${escAttr(inst.props.placeholder || '')}" />`;
  }
  if (inst.component === 'Textarea') {
    return `${indent}<textarea class="${c}"${styleAttr} placeholder="${escAttr(inst.props.placeholder || '')}"></textarea>`;
  }
  if (inst.component === 'Icon') {
    const Ico = ICON_SET[inst.props.iconName] || ICON_SET.Star;
    return `${indent}<span class="${c}"${styleAttr}>${renderToStaticMarkup(createElement(Ico, { size: '100%', 'aria-hidden': true }))}</span>`;
  }
  if (inst.component === '3D') {
    const config = normalize3D(inst.props); // validated: only known shapes, colours and safe model sources
    return `${indent}<div class="${c}"${styleAttr} data-prism-3d="${escAttr(esc(JSON.stringify(config)))}"></div>`;
  }
  if (def.container) {
    const kids = inst.children
      .map((ch, i) => renderNode(instances, ch, indent + '  ', components, resolve, open, staggers ? { m: own, extra: i * own.stagger } : null))
      .filter(Boolean)
      .join('\n');
    return `${indent}<${def.tag} class="${c}"${styleAttr}>\n${kids}\n${indent}</${def.tag}>`;
  }
  const text = boundText != null ? boundText : (inst.props.text || '');
  const href = (h) => escAttr(safeHref(resolveLink(h)));
  // A button with a link is exported as a real link that keeps the button's look (a.pm-btn).
  if (inst.component === 'Button' && inst.props.href) {
    return `${indent}<a class="${c} pm-btn"${styleAttr} href="${href(inst.props.href)}">${esc(text)}</a>`;
  }
  const attrs = inst.component === 'Link' ? ` href="${href(inst.props.href)}"` : '';
  const tag = tagFor(inst);
  return `${indent}<${tag} class="${c}"${styleAttr}${attrs}>${esc(text)}</${tag}>`;
}

const slugify = (s) => String(s || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';

export { pageFileNames }; // lives in seo.js so the editor can use it without loading the exporter

/** <link> tags for the curated Google Fonts the site uses (empty when none). */
function fontLinks(project) {
  const href = googleFontsHref([...new Set([...usedGoogleFonts(project.styles), ...themeFonts(project.theme)])]);
  if (!href) return '';
  return `  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="${escAttr(href)}" />
`;
}

// Resolves `page:<id>` links while a page is being exported (set by exportHtmlForPage; export is synchronous).
let resolveLink = (h) => h;

// Linked buttons are exported as <a>; make them look and line up like buttons.
const LINK_BUTTON_CSS = 'a.pm-btn { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; }';

/** Build a self-contained HTML document (CSS inlined) for one page. */
export function exportHtmlForPage(project, page) {
  const files = pageFileNames(project.pages);
  const file = files[project.pages.indexOf(page)] || 'index.html';
  resolveLink = (h) => resolvePageHref(h, project, files);
  let body;
  try {
    body = renderNode(project.instances, page.rootId, '    ', project.components || {});
  } finally {
    resolveLink = (h) => h;
  }
  const css = `*,*::before,*::after { box-sizing: border-box; }\nbody { margin: 0; }\n${LINK_BUTTON_CSS}\n${themeCss(project.theme)}\n${generateCss(project.styles, (id) => `.${cls(id)}`)}`;
  return `<!doctype html>
<html lang="${escAttr(normalizeSite(project.site).lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
${headTags(project, page, file)}
${fontLinks(project)}  <style>
${css}
  </style>
${body.includes(' data-motion=') ? `  <style>\n${motionCss()}\n  </style>\n  <script>${MOTION_RUNTIME}</script>\n` : ''}</head>
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

/** Every file of the publishable site: one HTML per page, sitemap.xml (with a site address) and robots.txt. */
export function buildSiteFiles(project) {
  const files = pageFileNames(project.pages);
  const out = project.pages.map((p, i) => ({ name: files[i], content: exportHtmlForPage(project, p) }));
  const sitemap = sitemapXml(project, files);
  if (sitemap) out.push({ name: 'sitemap.xml', content: sitemap });
  out.push({ name: 'robots.txt', content: robotsTxt(project) });
  return out;
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
  const files = pageFileNames(project.pages);
  project.pages.forEach((p, i) => zip.file(files[i], exportHtmlForPage(project, p)));
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `${name}.zip`);
}
