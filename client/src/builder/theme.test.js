import { describe, it, expect } from 'vitest';
import { DEFAULT_THEME, THEME_PRESETS, THEME_COLORS, normalizeTheme, themeCss, resolveThemeValue, applyThemeBatch, themeVar } from './theme.js';

describe('normalizeTheme', () => {
  it('fills the default theme for old projects', () => {
    expect(normalizeTheme(undefined)).toEqual(DEFAULT_THEME);
  });
  it('drops anything that is not a hex colour, a curated font or a sane radius', () => {
    const t = normalizeTheme({ colors: { primary: 'red;}</style>', accent: '#ABCDEF' }, fonts: { heading: 'Evil", x', body: 'Inter' }, radius: 999 });
    expect(t.colors.primary).toBe(DEFAULT_THEME.colors.primary);
    expect(t.colors.accent).toBe('#abcdef');
    expect(t.fonts).toEqual({ heading: '', body: 'Inter' });
    expect(t.radius).toBe(48);
  });
});

describe('themeCss', () => {
  it('declares every theme variable on :root', () => {
    const css = themeCss({ ...DEFAULT_THEME, fonts: { heading: 'Syne', body: '' }, radius: 12 });
    for (const c of THEME_COLORS) expect(css).toContain(`--pm-${c.key}: ${DEFAULT_THEME.colors[c.key]};`);
    expect(css).toContain('--pm-radius: 12px;');
    expect(css).toContain('--pm-font-heading: "Syne", ui-sans-serif, system-ui, sans-serif;');
    expect(css).toContain('--pm-font-body: system-ui, -apple-system, "Segoe UI", sans-serif;');
    expect(css.startsWith(':root {')).toBe(true);
  });
});

describe('resolveThemeValue', () => {
  it('turns a theme variable into its colour for previews', () => {
    expect(resolveThemeValue('var(--pm-primary)', DEFAULT_THEME)).toBe(DEFAULT_THEME.colors.primary);
    expect(resolveThemeValue('#123456', DEFAULT_THEME)).toBe('#123456');
    expect(resolveThemeValue('var(--pm-nope)', DEFAULT_THEME)).toBe('var(--pm-nope)');
  });
});

describe('presets', () => {
  it('ships six complete presets, all valid', () => {
    expect(THEME_PRESETS.map((p) => p.key)).toEqual(['indigo', 'midnight', 'sunset', 'forest', 'mono', 'candy']);
    for (const p of THEME_PRESETS) expect(normalizeTheme(p.theme)).toEqual(p.theme);
  });
});

describe('applyThemeBatch', () => {
  const project = {
    theme: DEFAULT_THEME,
    pages: [{ rootId: 'r' }],
    instances: { r: { id: 'r', component: 'Body' }, h: { id: 'h', component: 'Heading' }, b: { id: 'b', component: 'Button' } },
    styles: {
      r: { base: { 'background-color': '#ffffff' } },
      h: { base: { color: '#111827', 'font-family': '"Fraunces", serif' } },
      b: { base: { 'background-color': '#4F46E5', color: '#ffffff' }, hover: { 'background-color': '#4f46e5' }, mobile: { 'border-color': '#0b1020' } },
    },
  };

  it('points page roots at surface/ink/body font and headings at the heading font', () => {
    const batch = applyThemeBatch(project);
    expect(batch).toContainEqual({ id: 'r', breakpoint: 'base', decls: { 'background-color': themeVar('surface'), color: themeVar('ink'), 'font-family': 'var(--pm-font-body)' } });
    expect(batch).toContainEqual({ id: 'h', breakpoint: 'base', decls: { color: themeVar('ink'), 'font-family': 'var(--pm-font-heading)' } });
  });

  it('links colours equal to the current theme colours (any breakpoint/state), but not white', () => {
    const batch = applyThemeBatch(project);
    expect(batch).toContainEqual({ id: 'b', breakpoint: 'base', decls: { 'background-color': themeVar('primary') } });
    expect(batch).toContainEqual({ id: 'b', breakpoint: 'hover', decls: { 'background-color': themeVar('primary') } });
    expect(batch).toContainEqual({ id: 'b', breakpoint: 'mobile', decls: { 'border-color': themeVar('dark') } });
    expect(JSON.stringify(batch)).not.toContain('"color":"var(--pm-surface)"');
  });
});
