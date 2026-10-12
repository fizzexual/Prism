/**
 * Hover / pressed states: where the style panel writes, presets, and the
 * transition defaults. Pure — unit-tested.
 */

export const STYLE_STATES = [
  { key: 'normal', label: 'Normal' },
  { key: 'hover', label: 'Hover' },
  { key: 'pressed', label: 'Pressed' },
];

export const DEFAULT_TRANSITION = { 'transition-duration': '200ms', 'transition-timing-function': 'ease' };

export const DURATIONS = ['100ms', '150ms', '200ms', '300ms', '450ms', '600ms'];
export const EASINGS = [
  { value: 'ease', label: 'Ease' },
  { value: 'ease-out', label: 'Ease out' },
  { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Spring' },
  { value: 'linear', label: 'Linear' },
];

export const HOVER_PRESETS = [
  { key: 'none', label: 'None', decls: {} },
  { key: 'lift', label: 'Lift', decls: { translate: '0px -4px', 'box-shadow': '0 14px 30px rgba(15,23,42,0.18)' } },
  { key: 'grow', label: 'Grow', decls: { scale: '1.05' } },
  { key: 'glow', label: 'Glow', decls: { 'box-shadow': '0 0 0 4px rgba(99,102,241,0.25), 0 10px 30px rgba(99,102,241,0.35)' } },
  { key: 'dim', label: 'Dim', decls: { opacity: '0.85' } },
];

export const PRESSED_PRESETS = [
  { key: 'none', label: 'None', decls: {} },
  { key: 'press', label: 'Press', decls: { scale: '0.97' } },
  { key: 'sink', label: 'Sink', decls: { translate: '0px 1px', 'box-shadow': 'none' } },
];

export const presetsFor = (state) => (state === 'pressed' ? PRESSED_PRESETS : HOVER_PRESETS);

/** The style-map key the panel edits: the breakpoint in Normal, else the state. */
export const stateEditKey = (breakpoint, state) => (state && state !== 'normal' ? state : breakpoint);

/** Does this element have any styles in `state`? */
export const hasState = (perId, state) => Boolean(perId?.[state] && Object.keys(perId[state]).length);

/**
 * setStylesBatch entries that apply a preset to a state: the state's old
 * declarations are cleared, the preset's set, and (unless the element already has
 * a timing) the default transition timing is written to base — one undo step.
 */
export function presetBatch(id, perId = {}, state, presetKey) {
  const preset = presetsFor(state).find((p) => p.key === presetKey);
  if (!preset) return [];
  const decls = {};
  for (const k of Object.keys(perId[state] || {})) decls[k] = '';
  Object.assign(decls, preset.decls);
  const batch = [{ id, breakpoint: state, decls }];
  if (presetKey !== 'none' && !perId.base?.['transition-duration'] && !perId.base?.transition) {
    batch.push({ id, breakpoint: 'base', decls: { ...DEFAULT_TRANSITION } });
  }
  return batch;
}

/** Which preset (if any) exactly matches the element's current state styles. */
export function activePreset(perId = {}, state) {
  const cur = perId[state] || {};
  const keys = Object.keys(cur);
  return presetsFor(state).find((p) => {
    const pk = Object.keys(p.decls);
    return pk.length === keys.length && pk.every((k) => cur[k] === p.decls[k]);
  })?.key ?? null;
}
