import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MOTION_RUNTIME } from './motion.js';

/** Run the exported-page runtime in jsdom with a controllable IntersectionObserver. */
function setup({ ioFires }) {
  document.documentElement.className = '';
  document.body.innerHTML = '<div id="top" data-motion="fade"></div><div id="below" data-motion="fade"></div>';
  const rects = { top: { top: 100, bottom: 200 }, below: { top: 2000, bottom: 2100 } };
  for (const el of document.querySelectorAll('[data-motion]')) el.getBoundingClientRect = () => rects[el.id];
  window.innerHeight = 800;
  window.matchMedia = () => ({ matches: false });
  const observers = [];
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; this.els = []; observers.push(this); }
    observe(el) { this.els.push(el); }
    unobserve() {}
  };
  // Capture this run's DOMContentLoaded handler (dispatching the event would also
  // re-run handlers left over from earlier tests on the shared jsdom document).
  let onReady = null;
  const realAdd = document.addEventListener;
  document.addEventListener = (type, fn) => { if (type === 'DOMContentLoaded') onReady = fn; };
  new Function(MOTION_RUNTIME)();
  document.addEventListener = realAdd;
  onReady();
  if (ioFires) {
    const io = observers[0];
    io.cb(io.els.map((el) => ({ target: el, isIntersecting: el.id === 'top', boundingClientRect: rects[el.id] })));
  }
  return { top: document.getElementById('top'), below: document.getElementById('below') };
}

describe('exported-page motion runtime', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); delete window.IntersectionObserver; });

  it('marks <html> so hidden-until-visible applies', () => {
    setup({ ioFires: true });
    expect(document.documentElement.classList.contains('prism-motion')).toBe(true);
  });

  it('reveals what is on the first screen right away, without waiting for the observer', () => {
    const { top, below } = setup({ ioFires: false });
    expect(top.classList.contains('pm-in')).toBe(true);
    expect(below.classList.contains('pm-in')).toBe(false);
  });

  it('if the observer never reports, reveals everything after 2.5 s (no blank sections)', () => {
    const { below } = setup({ ioFires: false });
    vi.advanceTimersByTime(2600);
    expect(below.classList.contains('pm-in')).toBe(true);
  });

  it('when the observer works, below-the-fold elements wait to be scrolled to', () => {
    const { below } = setup({ ioFires: true });
    vi.advanceTimersByTime(5000);
    expect(below.classList.contains('pm-in')).toBe(false);
  });

  it('does nothing (hides nothing) when the visitor prefers reduced motion', () => {
    document.documentElement.className = '';
    window.matchMedia = () => ({ matches: true });
    window.IntersectionObserver = class { observe() {} };
    new Function(MOTION_RUNTIME)();
    expect(document.documentElement.classList.contains('prism-motion')).toBe(false);
  });
});
