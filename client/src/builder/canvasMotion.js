import { normalizeMotion, motionAttrs } from './motion.js';

/**
 * Editor playback of entrance animations on a canvas iframe document. The editor
 * never hides animated elements; it plays them on demand (preset picked, Play
 * pressed, Preview entered) by temporarily adding the export's attributes + class.
 */

const timers = new WeakMap();

function playNode(el, m, extra) {
  if (!el) return;
  clearTimeout(timers.get(el));
  const { vars } = motionAttrs(m, extra);
  el.classList.remove('pm-in');
  el.setAttribute('data-motion', m.preset);
  for (const decl of vars.split(';')) {
    const i = decl.indexOf(':');
    el.style.setProperty(decl.slice(0, i), decl.slice(i + 1));
  }
  // Next tick so removing+adding the class restarts the animation.
  setTimeout(() => el.classList.add('pm-in'), 16);
  timers.set(el, setTimeout(() => {
    el.classList.remove('pm-in');
    el.removeAttribute('data-motion');
    ['--pm-dur', '--pm-delay', '--pm-ease'].forEach((p) => el.style.removeProperty(p));
  }, 16 + m.delay + extra + m.duration + 120));
}

/** Play one element's animation (a stagger container plays its children). */
export function playMotion(doc, project, id) {
  const m = normalizeMotion(project?.instances?.[id]?.motion);
  const el = doc?.querySelector(`[data-ws-id="${id}"]`);
  if (!m || !el) return;
  if (m.stagger > 0 && el.children.length) {
    [...el.children].forEach((child, i) => playNode(child, m, i * m.stagger));
  } else {
    playNode(el, m, 0);
  }
}

/** Play every animation on the page (entering Preview). */
export function playAll(doc, project) {
  for (const inst of Object.values(project?.instances || {})) {
    if (inst.motion) playMotion(doc, project, inst.id);
  }
}

/** Play an element's animation in every canvas frame (desktop, tablet, phone). */
export function playOnCanvas(project, id) {
  for (const f of document.querySelectorAll('iframe[title^="Canvas"]')) playMotion(f.contentDocument, project, id);
}
