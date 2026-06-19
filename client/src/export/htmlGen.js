import { ELEMENTS } from '../elements/registry.jsx';

export const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => String(s).replace(/"/g, '&quot;');
const attrStr = (attrs) =>
  Object.entries(attrs)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => ` ${k}="${escAttr(v)}"`)
    .join('');

/** Generate the inner HTML (semantic tags via the registry) for one page. */
export function htmlGen(page) {
  return page.elements
    .map((el) => {
      const def = ELEMENTS[el.type];
      const { tag, attrs = {}, inner = '', selfClosing } = def.exportTag(el);
      const cls = [`el-${el.id}`, attrs.class].filter(Boolean).join(' ');
      const merged = { ...attrs, class: cls };
      const a = attrStr(merged);
      return selfClosing ? `    <${tag}${a} />` : `    <${tag}${a}>${escHtml(inner)}</${tag}>`;
    })
    .join('\n');
}
