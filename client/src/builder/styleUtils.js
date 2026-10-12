// Cascade order for each breakpoint (max-width model: narrower wins, applied last).
const CASCADE = {
  base: ['base'],
  tablet: ['base', 'tablet'],
  mobile: ['base', 'tablet', 'mobile'],
};

// Interaction states layer on top of the breakpoint cascade (pressed implies hover).
const STATE_CASCADE = { normal: [], hover: ['hover'], pressed: ['hover', 'pressed'] };

/** Effective (cascaded) declarations for an instance at a breakpoint, optionally in a state. */
export function effectiveStyle(perId = {}, breakpoint = 'base', state = 'normal') {
  const out = {};
  for (const bp of CASCADE[breakpoint] || ['base']) Object.assign(out, perId[bp] || {});
  for (const st of STATE_CASCADE[state] || []) Object.assign(out, perId[st] || {});
  return out;
}

/** Is `prop` explicitly set at this exact breakpoint (i.e. an override)? */
export function isSetAt(perId = {}, breakpoint, prop) {
  return Boolean(perId[breakpoint] && prop in perId[breakpoint]);
}

const LEN_RE = /^(-?[\d.]+)(px|%|rem|em|vh|vw)$/;

/** Parse a CSS length into { num, unit }. Keywords like 'auto' return unit:'auto'. */
export function parseLength(value) {
  if (value == null || value === '') return { num: '', unit: 'px' };
  if (value === 'auto') return { num: '', unit: 'auto' };
  const m = String(value).match(LEN_RE);
  if (m) return { num: m[1], unit: m[2] };
  return { num: String(value), unit: '' };
}
