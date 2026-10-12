/**
 * Entrance / scroll-reveal animations: presets, value normalisation, the CSS
 * (keyframes) and the tiny runtime inlined into exported pages. Pure — unit-tested.
 * Spec: docs/superpowers/specs/2026-10-12-scroll-animations-design.md
 */

// `from` state of each preset; the animation runs to the element's own styles.
export const MOTION_PRESETS = [
  { key: 'fade', label: 'Fade', from: 'opacity: 0;' },
  { key: 'fade-up', label: 'Fade up', from: 'opacity: 0; translate: 0 32px;' },
  { key: 'fade-down', label: 'Fade down', from: 'opacity: 0; translate: 0 -32px;' },
  { key: 'slide-left', label: 'Slide ←', from: 'opacity: 0; translate: 48px 0;' },
  { key: 'slide-right', label: 'Slide →', from: 'opacity: 0; translate: -48px 0;' },
  { key: 'zoom-in', label: 'Zoom', from: 'opacity: 0; scale: 0.92;' },
  { key: 'blur-in', label: 'Blur', from: 'opacity: 0; filter: blur(12px);' },
  { key: 'flip-up', label: 'Flip', from: 'opacity: 0; transform: perspective(800px) rotateX(24deg); transform-origin: 50% 100%;' },
];

export const EASINGS = {
  smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  'ease-out': 'ease-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
};
export const EASING_OPTIONS = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'ease-out', label: 'Ease out' },
  { value: 'spring', label: 'Spring' },
  { value: 'linear', label: 'Linear' },
];
export const DURATIONS = [300, 450, 600, 800, 1000, 1400];
export const DELAYS = [0, 100, 200, 300, 500, 800, 1200];
export const STAGGERS = [0, 60, 100, 150, 250];

const PRESET_KEYS = new Set(MOTION_PRESETS.map((p) => p.key));
const clamp = (n, lo, hi, def) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
};

/** Validate/clamp a stored motion config. Returns null when there's nothing to animate. */
export function normalizeMotion(m) {
  if (!m || typeof m !== 'object' || !PRESET_KEYS.has(m.preset)) return null;
  return {
    preset: m.preset,
    duration: clamp(m.duration ?? 600, 100, 3000, 600),
    delay: clamp(m.delay ?? 0, 0, 5000, 0),
    easing: Object.hasOwn(EASINGS, m.easing) ? m.easing : 'smooth',
    repeat: Boolean(m.repeat),
    stagger: clamp(m.stagger ?? 0, 0, 2000, 0),
  };
}

/** Attribute string + CSS-variable string for one animated element (values already normalised). */
export function motionAttrs(m, extraDelay = 0) {
  if (!m) return { attrs: '', vars: '' };
  return {
    attrs: ` data-motion="${m.preset}"${m.repeat ? ' data-motion-repeat' : ''}`,
    vars: `--pm-dur:${m.duration}ms;--pm-delay:${m.delay + extraDelay}ms;--pm-ease:${EASINGS[m.easing]}`,
  };
}

/**
 * Keyframes + play rules. Exported pages hide animated elements until they're
 * revealed — but only once the runtime has marked <html> (so no-JS shows everything).
 * The editor variant never hides anything; it plays by toggling .pm-in.
 */
export function motionCss({ editor = false } = {}) {
  const frames = MOTION_PRESETS.map((p) => `@keyframes pm-${p.key} { from { ${p.from} } }`).join('\n');
  const names = MOTION_PRESETS.map((p) => `[data-motion="${p.key}"].pm-in { animation-name: pm-${p.key}; }`).join('\n');
  const play = '[data-motion].pm-in { animation-duration: var(--pm-dur, 600ms); animation-delay: var(--pm-delay, 0ms); animation-timing-function: var(--pm-ease, ease); animation-fill-mode: backwards; }';
  const hide = editor ? '' : '\n.prism-motion [data-motion]:not(.pm-in) { opacity: 0; }';
  // Visitors who ask for reduced motion get none. The editor only plays when the
  // designer asks (Play / picking a preset), so it plays regardless.
  const reduced = editor ? '' : '\n@media (prefers-reduced-motion: reduce) { [data-motion] { animation: none !important; } }';
  return `${frames}\n${names}\n${play}${hide}${reduced}`;
}

/**
 * Inlined in <head> of exported pages: reveal [data-motion] elements as they scroll
 * into view. Safety nets so content can never stay invisible: whatever is on the
 * first screen is revealed immediately, and if the observer never reports (some
 * prerender/screenshot environments), everything is revealed after 2.5 s.
 */
export const MOTION_RUNTIME = `(function(){var d=document.documentElement;if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('prism-motion');document.addEventListener('DOMContentLoaded',function(){var els=[].slice.call(document.querySelectorAll('[data-motion]')),seen=false,h=window.innerHeight;function show(t){t.classList.add('pm-in')}var io=new IntersectionObserver(function(es){seen=true;es.forEach(function(e){var t=e.target,r=t.hasAttribute('data-motion-repeat');if(e.isIntersecting){show(t);if(!r)io.unobserve(t)}else if(r&&e.boundingClientRect.top>0){t.classList.remove('pm-in')}})},{rootMargin:'0px 0px -10% 0px'});els.forEach(function(el){var b=el.getBoundingClientRect();if(b.top<h*0.9&&b.bottom>0)show(el);io.observe(el)});setTimeout(function(){if(!seen)els.forEach(show)},2500)})})();`;
