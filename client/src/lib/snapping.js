/**
 * Pure snapping helpers for the freeform canvas: grid snapping and alignment
 * guides. No React/DOM imports.
 */

export function snapValue(v, grid) {
  if (!grid || grid <= 0) return v;
  return Math.round(v / grid) * grid;
}

export function snapRectToGrid(rect, grid) {
  if (!grid || grid <= 0) return rect;
  return { ...rect, x: snapValue(rect.x, grid), y: snapValue(rect.y, grid) };
}

const edgesOf = (r) => ({
  left: r.x,
  cx: r.x + r.width / 2,
  right: r.x + r.width,
  top: r.y,
  cy: r.y + r.height / 2,
  bottom: r.y + r.height,
});

/**
 * Compute alignment nudges + guide lines for `moving` against `others`.
 * Returns { x, y, lines } where x/y are the (possibly null) deltas to apply so
 * the nearest edges/centers line up, and lines describe guides to draw.
 */
export function alignmentGuides(moving, others, threshold = 6) {
  const m = edgesOf(moving);
  let best = { x: null, y: null };
  const bestDist = { x: Infinity, y: Infinity };
  const lines = [];

  for (const other of others) {
    const o = edgesOf(other);

    for (const mk of ['left', 'cx', 'right']) {
      for (const ok of ['left', 'cx', 'right']) {
        const d = o[ok] - m[mk];
        const ad = Math.abs(d);
        if (ad <= threshold) {
          if (ad < bestDist.x) {
            bestDist.x = ad;
            best.x = d;
          }
          lines.push({
            axis: 'x',
            pos: o[ok],
            from: Math.min(moving.y, other.y),
            to: Math.max(moving.y + moving.height, other.y + other.height),
          });
        }
      }
    }

    for (const mk of ['top', 'cy', 'bottom']) {
      for (const ok of ['top', 'cy', 'bottom']) {
        const d = o[ok] - m[mk];
        const ad = Math.abs(d);
        if (ad <= threshold) {
          if (ad < bestDist.y) {
            bestDist.y = ad;
            best.y = d;
          }
          lines.push({
            axis: 'y',
            pos: o[ok],
            from: Math.min(moving.x, other.x),
            to: Math.max(moving.x + moving.width, other.x + other.width),
          });
        }
      }
    }
  }

  return { x: best.x, y: best.y, lines };
}
