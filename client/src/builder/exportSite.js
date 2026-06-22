import { COMPONENTS } from './components.jsx';
import { generateCss } from './cssGen.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/"/g, '&quot;');
const cls = (id) => `c-${id}`;

const STYLE_BIND_KEYS = ['color', 'background-color', 'font-size', 'font-family'];

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
</body>
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
