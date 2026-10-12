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

/** Interaction states, in cascade order (pressed wins over hover). */
export const STATES = { hover: ':hover', pressed: ':active' };

/**
 * When an element has hover/pressed styles, animate exactly the properties those
 * states change (never `all`, so editor drags/resizes stay instant), with a default
 * timing unless one is set.
 */
function withTransition(base = {}, perBp = {}) {
  const changed = new Set([...Object.keys(perBp.hover || {}), ...Object.keys(perBp.pressed || {})]);
  if (!changed.size || 'transition' in base || 'transition-property' in base) return base;
  return {
    ...base,
    'transition-property': [...changed].join(', '),
    'transition-duration': base['transition-duration'] || '200ms',
    'transition-timing-function': base['transition-timing-function'] || 'ease',
  };
}

/**
 * styles: { [instanceId]: { base?, tablet?, mobile?, hover?, pressed? } }
 * selector(id) lets callers choose the rule selector (editor uses .s-<id>,
 * export uses a clean class). `preview` (editor only) also matches a forced
 * [data-ws-state~="hover|pressed"] attribute so a state can be shown without the mouse.
 */
export function generateCss(styles = {}, selector = (id) => `.s-${id}`, { preview = false } = {}) {
  const byBp = { base: [], tablet: [], mobile: [] };
  const hover = [];
  const pressed = [];
  const forced = [];
  for (const [id, perBp] of Object.entries(styles)) {
    for (const bp of ORDER) {
      const decls = bp === 'base' ? withTransition(perBp?.base, perBp) : perBp?.[bp];
      if (decls && Object.keys(decls).length) {
        const body = declarationsToCss(decls);
        if (body) byBp[bp].push(`${selector(id)} { ${body} }`);
      }
    }
    for (const [state, pseudo] of Object.entries(STATES)) {
      const body = declarationsToCss(perBp?.[state] || {});
      if (!body) continue;
      (state === 'hover' ? hover : pressed).push(`${selector(id)}${pseudo} { ${body} }`);
      if (preview) forced.push(`${selector(id)}[data-ws-state~="${state}"] { ${body} }`);
    }
  }
  const parts = [byBp.base.join('\n')];
  if (byBp.tablet.length) parts.push(`@media ${BREAKPOINTS.tablet.media} {\n${byBp.tablet.join('\n')}\n}`);
  if (byBp.mobile.length) parts.push(`@media ${BREAKPOINTS.mobile.media} {\n${byBp.mobile.join('\n')}\n}`);
  // Hover only where a real pointer can hover (no sticky hover on phones).
  if (hover.length) parts.push(`@media (hover: hover) {\n${hover.join('\n')}\n}`);
  if (pressed.length) parts.push(pressed.join('\n'));
  if (forced.length) parts.push(forced.join('\n'));
  return parts.filter(Boolean).join('\n\n');
}
