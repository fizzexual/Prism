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
