/**
 * Pure geometry helpers for the freeform canvas. No React/DOM imports so these
 * unit-test directly.
 */

const BREAKPOINT_FALLBACK = { mobile: 'tablet', tablet: 'desktop', desktop: null };

/** Rotate a point (px,py) by `deg` degrees around center (cx,cy). */
export function rotatePoint(px, py, cx, cy, deg) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - cx;
  const dy = py - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

/** Rotation-aware axis-aligned bounding box plus the rect's center. */
export function rectBounds(rect) {
  const { x = 0, y = 0, width = 0, height = 0, rotation = 0 } = rect;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (!rotation) {
    return { left: x, top: y, right: x + width, bottom: y + height, cx, cy };
  }

  const hw = width / 2;
  const hh = height / 2;
  const corners = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  for (const [dx, dy] of corners) {
    const rx = cx + dx * cos - dy * sin;
    const ry = cy + dx * sin + dy * cos;
    left = Math.min(left, rx);
    right = Math.max(right, rx);
    top = Math.min(top, ry);
    bottom = Math.max(bottom, ry);
  }
  return { left, top, right, bottom, cx, cy };
}

const RECT_KEYS = ['x', 'y', 'width', 'height', 'rotation'];

// Build the override cascade desktop -> ... -> breakpoint.
function cascade(breakpoint) {
  const chain = [];
  let bp = breakpoint;
  while (bp && bp !== 'desktop') {
    chain.unshift(bp);
    bp = BREAKPOINT_FALLBACK[bp];
  }
  return chain;
}

function mergeStyle(base, patch) {
  const out = { ...base, ...patch };
  if (base?.font || patch?.font) out.font = { ...(base?.font || {}), ...(patch?.font || {}) };
  if (base?.border || patch?.border) out.border = { ...(base?.border || {}), ...(patch?.border || {}) };
  return out;
}

/**
 * Resolve an element's effective rect at a breakpoint. Overrides cascade
 * down from desktop: mobile falls back to tablet, tablet to desktop.
 */
export function resolveRect(element, breakpoint = 'desktop') {
  const resolved = { ...(element.rect || {}) };
  if (breakpoint === 'desktop' || !element.responsive) return resolved;
  for (const level of cascade(breakpoint)) {
    const ov = element.responsive[level];
    if (ov) for (const k of RECT_KEYS) if (k in ov) resolved[k] = ov[k];
  }
  return resolved;
}

/** Resolve an element's effective style at a breakpoint (per-breakpoint `style` overrides cascade). */
export function resolveStyle(element, breakpoint = 'desktop') {
  let style = element.style || {};
  if (breakpoint === 'desktop' || !element.responsive) return style;
  for (const level of cascade(breakpoint)) {
    const ov = element.responsive[level]?.style;
    if (ov) style = mergeStyle(style, ov);
  }
  return style;
}

/** Is the element hidden at this breakpoint? Respects per-breakpoint overrides. */
export function isHiddenAt(element, breakpoint = 'desktop') {
  if (breakpoint !== 'desktop' && element.responsive?.[breakpoint]?.hidden != null) {
    return Boolean(element.responsive[breakpoint].hidden);
  }
  return Boolean(element.hidden);
}
