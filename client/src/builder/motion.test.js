import { describe, it, expect } from 'vitest';
import { MOTION_PRESETS, normalizeMotion, motionCss, motionAttrs, MOTION_RUNTIME, EASINGS } from './motion.js';

describe('normalizeMotion', () => {
  it('returns null for no motion or an unknown preset', () => {
    expect(normalizeMotion(null)).toBeNull();
    expect(normalizeMotion({ preset: 'none' })).toBeNull();
    expect(normalizeMotion({ preset: 'x}</style><script>' })).toBeNull();
  });

  it('fills defaults', () => {
    expect(normalizeMotion({ preset: 'fade-up' })).toEqual({ preset: 'fade-up', duration: 600, delay: 0, easing: 'smooth', repeat: false, stagger: 0 });
  });

  it('clamps numbers and drops unknown easings', () => {
    const m = normalizeMotion({ preset: 'zoom-in', duration: 99999, delay: -5, easing: 'evil;}', repeat: 'yes', stagger: '120' });
    expect(m).toEqual({ preset: 'zoom-in', duration: 3000, delay: 0, easing: 'smooth', repeat: true, stagger: 120 });
  });

  it('a container with only stagger still counts', () => {
    expect(normalizeMotion({ preset: 'fade', stagger: 100 }).stagger).toBe(100);
  });
});

describe('motionCss', () => {
  it('has one keyframes block per preset and the hide-until-visible rule scoped to the runtime class', () => {
    const css = motionCss();
    for (const p of MOTION_PRESETS) expect(css).toContain(`@keyframes pm-${p.key}`);
    expect(css).toMatch(/\.prism-motion \[data-motion\]:not\(\.pm-in\)\s*\{\s*opacity: 0;?\s*\}/);
    expect(css).toContain('animation-fill-mode: backwards');
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });

  it('the editor variant never hides elements', () => {
    expect(motionCss({ editor: true })).not.toContain(':not(.pm-in)');
  });
});

describe('motionAttrs', () => {
  it('builds data attributes and timing variables', () => {
    const a = motionAttrs(normalizeMotion({ preset: 'fade-up', duration: 800, delay: 100, easing: 'spring', repeat: true }));
    expect(a.attrs).toBe(' data-motion="fade-up" data-motion-repeat');
    expect(a.vars).toBe(`--pm-dur:800ms;--pm-delay:100ms;--pm-ease:${EASINGS.spring}`);
  });

  it('adds an extra delay (stagger)', () => {
    const a = motionAttrs(normalizeMotion({ preset: 'fade' }), 240);
    expect(a.vars).toContain('--pm-delay:240ms');
  });

  it('returns empty for no motion', () => {
    expect(motionAttrs(null)).toEqual({ attrs: '', vars: '' });
  });
});

describe('MOTION_RUNTIME', () => {
  it('uses IntersectionObserver, marks <html>, and respects reduced motion', () => {
    expect(MOTION_RUNTIME).toContain('IntersectionObserver');
    expect(MOTION_RUNTIME).toContain('prism-motion');
    expect(MOTION_RUNTIME).toContain('prefers-reduced-motion');
    expect(MOTION_RUNTIME.length).toBeLessThan(1200);
  });
});

describe('editor playback vs reduced motion', () => {
  it('the editor variant plays even when the OS asks for reduced motion (the designer pressed Play)', () => {
    expect(motionCss({ editor: true })).not.toMatch(/prefers-reduced-motion/);
  });
  it('the exported page still respects reduced motion', () => {
    expect(motionCss()).toMatch(/prefers-reduced-motion: reduce/);
  });
});
