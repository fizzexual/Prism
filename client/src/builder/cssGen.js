/**
 * Generate real CSS from the styles map. Breakpoints use max-width media
 * queries so they cascade correctly inside the sized iframe: at a narrow width,
 * base + tablet + mobile rules all apply, with the narrowest winning (it comes
 * last). This is the same model Webstudio uses.
 */
export const BREAKPOINTS = {
  base: { label: 'Desktop', width: 1280, media: null },
  tablet: { label: 'Tablet', width: 768, media: '(max-width: 768px)' },
  mobile: { label: 'Mobile', width: 390, media: '(max-width: 479px)' },
};

const ORDER = ['base', 'tablet', 'mobile'];

// Property names must be plain identifiers (incl. custom properties like --brand).
const PROP_RE = /^-{0,2}[a-zA-Z_][a-zA-Z0-9_-]*$/;

/**
 * Make a user-supplied value safe inside a rule inside a <style> element: CSS-escape
 * the characters that could end the rule ({ }) or the element (< >). Escapes keep
 * strings and url()s meaning the same, so legitimate values are unchanged in effect.
 */
export function safeCssValue(v) {
  return String(v).replace(/[<>{}]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `);
}

export function declarationsToCss(decls = {}) {
  return Object.entries(decls)
    .filter(([k, v]) => v !== '' && v != null && PROP_RE.test(k))
    .map(([k, v]) => `${k}: ${safeCssValue(v)};`)
    .join(' ');
}

/**
 * styles: { [instanceId]: { base?: {...}, tablet?: {...}, mobile?: {...} } }
 * selector(id) lets callers choose the rule selector (editor uses data-ws-id,
 * export uses a clean class).
 */
export function generateCss(styles = {}, selector = (id) => `.s-${id}`) {
  const byBp = { base: [], tablet: [], mobile: [] };
  for (const [id, perBp] of Object.entries(styles)) {
    for (const bp of ORDER) {
      const decls = perBp?.[bp];
      if (decls && Object.keys(decls).length) {
        const body = declarationsToCss(decls);
        if (body) byBp[bp].push(`${selector(id)} { ${body} }`);
      }
    }
  }
  const parts = [byBp.base.join('\n')];
  if (byBp.tablet.length) parts.push(`@media ${BREAKPOINTS.tablet.media} {\n${byBp.tablet.join('\n')}\n}`);
  if (byBp.mobile.length) parts.push(`@media ${BREAKPOINTS.mobile.media} {\n${byBp.mobile.join('\n')}\n}`);
  return parts.filter(Boolean).join('\n\n');
}
