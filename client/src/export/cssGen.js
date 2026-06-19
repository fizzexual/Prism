import { cssText } from '../lib/styleToCss.js';

function rectCss(r) {
  let s = `position:absolute; left:${Math.round(r.x)}px; top:${Math.round(r.y)}px; width:${Math.round(r.width)}px; height:${Math.round(r.height)}px;`;
  if (r.rotation) s += ` transform:rotate(${r.rotation}deg); transform-origin:center center;`;
  return s;
}

function extraCss(el) {
  if (el.type === 'image') return ` object-fit:${el.content?.fit || 'cover'};`;
  return '';
}

function overrideCss(ov) {
  const p = [];
  if (ov.x != null) p.push(`left:${Math.round(ov.x)}px;`);
  if (ov.y != null) p.push(`top:${Math.round(ov.y)}px;`);
  if (ov.width != null) p.push(`width:${Math.round(ov.width)}px;`);
  if (ov.height != null) p.push(`height:${Math.round(ov.height)}px;`);
  if (ov.hidden != null) p.push(`display:${ov.hidden ? 'none' : 'block'};`);
  if (ov.style) p.push(cssText(ov.style));
  return p.join(' ');
}

function mediaOverrides(page, bp) {
  return page.elements
    .filter((el) => el.responsive?.[bp])
    .map((el) => `  .el-${el.id} { ${overrideCss(el.responsive[bp])} }`)
    .join('\n');
}

/** Generate a standalone stylesheet for one page (absolute layout + responsive media queries). */
export function cssGen(page) {
  const bg = page.canvas?.background || '#ffffff';
  const out = [
    '* { box-sizing: border-box; }',
    'body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background:#eceef2; }',
    `.prism-page { position:relative; width:1280px; min-height:100vh; margin:0 auto; background:${bg}; overflow:hidden; }`,
    '.prism-page h1,.prism-page h2,.prism-page h3,.prism-page p,.prism-page figure { margin:0; }',
    '.prism-btn { display:inline-flex; align-items:center; justify-content:center; text-decoration:none; border:none; cursor:pointer; }',
    '.prism-page img { display:block; }',
    '.prism-3d { overflow:hidden; }',
  ];

  for (const el of page.elements) {
    if (el.hidden) {
      out.push(`.el-${el.id} { display:none; }`);
      continue;
    }
    out.push(`.el-${el.id} { ${rectCss(el.rect)} z-index:${el.zIndex || 0}; ${cssText(el.style)}${extraCss(el)} }`);
  }

  out.push(`@media (max-width: 768px) {\n  .prism-page { width:768px; }\n${mediaOverrides(page, 'tablet')}\n}`);
  out.push(`@media (max-width: 375px) {\n  .prism-page { width:375px; }\n${mediaOverrides(page, 'mobile')}\n}`);
  return out.join('\n');
}
