/**
 * Convert a Prism element `style` object into CSS. `cssProps` returns a
 * React-compatible style object (camelCase); `cssText` returns a CSS string for
 * code export. Both share one mapping so the editor and export never diverge.
 */
export function cssProps(style = {}) {
  const s = {};
  if (style.background) s.background = style.background;
  if (style.color) s.color = style.color;
  if (style.opacity != null) s.opacity = style.opacity;
  if (style.radius != null) s.borderRadius = `${style.radius}px`;
  if (style.padding != null) {
    s.padding = typeof style.padding === 'number' ? `${style.padding}px` : style.padding;
  }
  if (style.shadow) s.boxShadow = style.shadow;
  if (style.border && style.border.width) {
    s.border = `${style.border.width}px ${style.border.style || 'solid'} ${style.border.color || '#000000'}`;
  }
  const f = style.font || {};
  if (f.family) s.fontFamily = f.family;
  if (f.size != null) s.fontSize = `${f.size}px`;
  if (f.weight != null) s.fontWeight = f.weight;
  if (f.lineHeight != null) s.lineHeight = f.lineHeight;
  if (f.align) s.textAlign = f.align;
  return s;
}

const kebab = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export function cssText(style = {}) {
  return Object.entries(cssProps(style))
    .map(([k, v]) => `${kebab(k)}: ${v};`)
    .join(' ');
}
