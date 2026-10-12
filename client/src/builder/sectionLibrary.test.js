import { describe, it, expect } from 'vitest';
import { TEMPLATES, CATEGORIES, STARTERS } from './templates.js';
import { COMPONENTS } from './components.jsx';
import { DEFAULT_THEME } from './theme.js';

const WHITE = /^(#fff|#ffffff|white|rgba\(255,\s*255,\s*255,\s*[\d.]+\))$/i;
// Backgrounds the presets guarantee >= 4.5:1 against white (theme.test.js).
const SAFE_BG = /^(var\(--pm-(dark|primary|ink)\)|linear-gradient\(\d+deg,\s*var\(--pm-(dark|primary|ink)\),\s*var\(--pm-(dark|primary|ink)\)\))$/;
const tracks = (v = '') => { const m = /^repeat\((\d+)/.exec(v); return m ? Number(m[1]) : v.trim().split(/\s+/).length; };

describe('section library', () => {
  it('has 17 sections in the agreed categories', () => {
    expect(TEMPLATES).toHaveLength(17);
    expect(CATEGORIES).toEqual(['Navigation', 'Hero', 'Content', 'Social proof', 'Pricing', 'Help', 'Call to action', 'Footer']);
    for (const t of TEMPLATES) expect(CATEGORIES, t.label).toContain(t.category);
    expect(new Set(TEMPLATES.map((t) => t.label)).size).toBe(17);
  });

  for (const t of TEMPLATES) {
    describe(t.label, () => {
      const snap = t.build();
      const nodes = Object.values(snap.instances);
      const base = (id) => snap.styles[id]?.base || {};

      it('uses only known components', () => {
        for (const n of nodes) expect(COMPONENTS[n.component], n.component).toBeTruthy();
      });

      it('tightens side padding on phones', () => {
        expect(parseInt(snap.styles[snap.rootId].mobile?.['padding-left'], 10)).toBeLessThanOrEqual(24);
      });

      it('collapses multi-column layouts on phones', () => {
        for (const n of nodes.filter((x) => (x.component === 'Columns' || x.component === 'Grid') && x.children.length > 1)) {
          const m = { ...base(n.id), ...(snap.styles[n.id].tablet || {}), ...(snap.styles[n.id].mobile || {}) };
          const ok = n.component === 'Columns' ? m['flex-direction'] === 'column' || m['flex-wrap'] === 'wrap' : tracks(m['grid-template-columns']) <= 2;
          expect(ok, `${n.component} ${n.id}`).toBe(true);
        }
      });

      it('headings use the theme heading font', () => {
        for (const h of nodes.filter((x) => x.component === 'Heading')) expect(base(h.id)['font-family']).toBe('var(--pm-font-heading)');
      });

      it('uses theme variables instead of raw theme colours', () => {
        const json = JSON.stringify(snap.styles).toLowerCase();
        for (const hex of Object.values(DEFAULT_THEME.colors).filter((c) => c !== '#ffffff')) expect(json, hex).not.toContain(hex);
      });

      it('puts white text only on dark or primary backgrounds', () => {
        const walk = (id, bg) => {
          const s = base(id);
          const here = s['background-image'] || s['background-color'] || s.background || bg;
          if (s.color && WHITE.test(s.color.replace(/\s+/g, ' '))) expect(here, `${snap.instances[id].component} ${id}`).toMatch(SAFE_BG);
          for (const c of snap.instances[id].children) walk(c, here);
        };
        walk(snap.rootId, 'var(--pm-surface)');
      });

      // Menus and footers should simply be there; everything else animates in.
      if (!['Navigation', 'Footer'].includes(t.category)) {
        it('animates in', () => {
          expect(nodes.some((n) => n.motion)).toBe(true);
        });
      }
    });
  }
});

describe('starter pages', () => {
  it('offers Landing, Portfolio and Startup made of existing sections', () => {
    expect(STARTERS.map((s) => s.label)).toEqual(['Landing page', 'Portfolio', 'Startup']);
    const labels = new Set(TEMPLATES.map((t) => t.label));
    for (const s of STARTERS) for (const l of s.sections) expect(labels.has(l), `${s.label}: ${l}`).toBe(true);
  });
});
