import { describe, it, expect } from 'vitest';
import { GOOGLE_FONTS, fontStack, usedGoogleFonts, googleFontsHref, FONT_OPTIONS } from './fonts.js';

describe('fonts', () => {
  it('offers a curated set across categories', () => {
    expect(GOOGLE_FONTS.length).toBeGreaterThanOrEqual(14);
    const cats = new Set(GOOGLE_FONTS.map((f) => f.category));
    for (const c of ['sans', 'serif', 'display', 'mono']) expect(cats.has(c)).toBe(true);
  });

  it('builds a stack with a fallback for the category', () => {
    expect(fontStack('Inter')).toBe('"Inter", ui-sans-serif, system-ui, sans-serif');
    expect(fontStack('Playfair Display')).toBe('"Playfair Display", ui-serif, Georgia, serif');
  });

  it('dropdown options keep the system choices and add the curated fonts', () => {
    expect(FONT_OPTIONS[0]).toEqual({ value: '', label: 'Default' });
    expect(FONT_OPTIONS.some((o) => o.value === fontStack('Poppins') && o.label === 'Poppins')).toBe(true);
  });

  it('finds the curated fonts used anywhere (any breakpoint or state), once each', () => {
    const styles = {
      a: { base: { 'font-family': fontStack('Inter') } },
      b: { mobile: { 'font-family': fontStack('Inter') }, hover: { 'font-family': fontStack('Fraunces') } },
      c: { base: { 'font-family': 'system-ui, sans-serif' } },
      d: { base: { 'font-family': '"Not A Curated Font", serif' } },
    };
    expect(usedGoogleFonts(styles).sort()).toEqual(['Fraunces', 'Inter']);
  });

  it('builds one Google Fonts URL with swap, only from curated names', () => {
    const href = googleFontsHref(['Inter', 'Playfair Display']);
    expect(href).toBe('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&display=swap');
    expect(googleFontsHref([])).toBeNull();
    expect(googleFontsHref(['Evil&x=<script>'])).toBeNull();
  });
});

describe('site fonts', async () => {
  const { siteFontBatch, currentSiteFonts } = await import('./fonts.js');
  const project = {
    pages: [{ rootId: 'r1' }, { rootId: 'r2' }],
    instances: {
      r1: { id: 'r1', component: 'Body' }, r2: { id: 'r2', component: 'Body' },
      h1: { id: 'h1', component: 'Heading' }, h2: { id: 'h2', component: 'Heading' }, t: { id: 't', component: 'Text' },
    },
    styles: { r1: { base: { 'font-family': fontStack('Inter') } }, r2: { base: {} }, h1: { base: { 'font-family': fontStack('Fraunces') } }, h2: { base: { 'font-family': fontStack('Fraunces') } } },
  };

  it('body font goes on every page root; heading font on every heading', () => {
    expect(siteFontBatch(project, 'body', 'Sora')).toEqual([
      { id: 'r1', breakpoint: 'base', decls: { 'font-family': fontStack('Sora') } },
      { id: 'r2', breakpoint: 'base', decls: { 'font-family': fontStack('Sora') } },
    ]);
    expect(siteFontBatch(project, 'heading', 'Lora').map((e) => e.id)).toEqual(['h1', 'h2']);
  });

  it('an empty choice clears back to the default', () => {
    expect(siteFontBatch(project, 'heading', '')[0].decls).toEqual({ 'font-family': '' });
  });

  it('reads the current site fonts (heading only when all headings agree)', () => {
    expect(currentSiteFonts(project)).toEqual({ body: 'Inter', heading: 'Fraunces' });
    const mixed = { ...project, styles: { ...project.styles, h2: { base: {} } } };
    expect(currentSiteFonts(mixed).heading).toBe('');
  });
});

describe('clearing the body font', async () => {
  const { siteFontBatch } = await import('./fonts.js');
  it('goes back to the system sans stack, not the browser default serif', () => {
    const p = { pages: [{ rootId: 'r' }], instances: { r: { id: 'r', component: 'Body' } }, styles: {} };
    expect(siteFontBatch(p, 'body', '')[0].decls['font-family']).toBe('system-ui, -apple-system, "Segoe UI", sans-serif');
  });
});
