import { fontStack, FONT_OPTIONS, GOOGLE_FONTS } from './fonts.js';

/**
 * Site themes: named colours, heading/body fonts and corner radius, exposed to
 * styles as CSS variables (--pm-*). Pure — unit-tested.
 * Spec: docs/superpowers/specs/2026-10-12-site-themes-design.md
 */

export const THEME_COLORS = [
  { key: 'primary', label: 'Primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'ink', label: 'Text' },
  { key: 'muted', label: 'Muted' },
  { key: 'surface', label: 'Surface' },
  { key: 'dark', label: 'Dark' },
];

export const RADII = [0, 4, 8, 12, 16, 24];

export const DEFAULT_THEME = {
  colors: { primary: '#4f46e5', accent: '#ec4899', ink: '#111827', muted: '#6b7280', surface: '#ffffff', dark: '#0b1020' },
  fonts: { heading: '', body: '' },
  radius: 10,
};

const preset = (key, label, colors, heading, body, radius) => ({ key, label, theme: { colors, fonts: { heading, body }, radius } });

export const THEME_PRESETS = [
  preset('indigo', 'Indigo', DEFAULT_THEME.colors, 'Inter', 'Inter', 10),
  preset('midnight', 'Midnight', { primary: '#06b6d4', accent: '#a78bfa', ink: '#0f172a', muted: '#64748b', surface: '#ffffff', dark: '#020617' }, 'Space Grotesk', 'Inter', 14),
  preset('sunset', 'Sunset', { primary: '#ea580c', accent: '#e11d48', ink: '#1c1917', muted: '#78716c', surface: '#fffbf5', dark: '#431407' }, 'Fraunces', 'DM Sans', 18),
  preset('forest', 'Forest', { primary: '#16a34a', accent: '#ca8a04', ink: '#14231a', muted: '#57705f', surface: '#f7faf5', dark: '#0c2416' }, 'Bricolage Grotesque', 'Manrope', 12),
  preset('mono', 'Mono', { primary: '#111111', accent: '#ff4d00', ink: '#111111', muted: '#6b6b6b', surface: '#ffffff', dark: '#0a0a0a' }, 'Syne', 'Inter', 0),
  preset('candy', 'Candy', { primary: '#db2777', accent: '#7c3aed', ink: '#2e1065', muted: '#7c6f99', surface: '#fff7fb', dark: '#3b0764' }, 'Outfit', 'Outfit', 24),
];

const HEX = /^#[0-9a-f]{6}$/i;
const FONT_NAMES = new Set(GOOGLE_FONTS.map((f) => f.family));
const SYSTEM_STACK = FONT_OPTIONS[1].value;

/** Validate a stored theme (hex colours, curated fonts, clamped radius); fills defaults. */
export function normalizeTheme(t) {
  const src = t && typeof t === 'object' ? t : {};
  const colors = {};
  for (const { key } of THEME_COLORS) {
    const v = src.colors?.[key];
    colors[key] = typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : DEFAULT_THEME.colors[key];
  }
  const font = (f) => (FONT_NAMES.has(f) ? f : '');
  const r = Math.round(Number(src.radius));
  return {
    colors,
    fonts: { heading: font(src.fonts?.heading), body: font(src.fonts?.body) },
    radius: Number.isFinite(r) ? Math.min(48, Math.max(0, r)) : DEFAULT_THEME.radius,
  };
}

/** `var(--pm-<key>)` for a theme colour. */
export const themeVar = (key) => `var(--pm-${key})`;

/** The :root rule declaring the theme's CSS variables. */
export function themeCss(theme) {
  const t = normalizeTheme(theme);
  const decls = THEME_COLORS.map(({ key }) => `--pm-${key}: ${t.colors[key]};`);
  decls.push(`--pm-font-heading: ${t.fonts.heading ? fontStack(t.fonts.heading) : SYSTEM_STACK};`);
  decls.push(`--pm-font-body: ${t.fonts.body ? fontStack(t.fonts.body) : SYSTEM_STACK};`);
  decls.push(`--pm-radius: ${t.radius}px;`);
  return `:root { ${decls.join(' ')} }`;
}

/** Resolve `var(--pm-<colour>)` to its hex for previews in the editor UI; other values pass through. */
export function resolveThemeValue(value, theme) {
  const m = /^var\(--pm-([a-z]+)\)$/.exec(String(value || '').trim());
  if (!m) return value;
  return normalizeTheme(theme).colors[m[1]] ?? value;
}

/**
 * setStylesBatch entries that make the site follow its theme:
 *  - colours equal to a current theme colour (except white) become that colour's variable
 *    (any breakpoint or state), so existing pages restyle when the theme changes;
 *  - page roots use surface / ink / body font; headings use ink and the heading font.
 * Entries are merged per (id, breakpoint).
 */
export function applyThemeBatch(project) {
  const t = normalizeTheme(project.theme);
  const byHex = {};
  for (const { key } of THEME_COLORS) if (t.colors[key] !== '#ffffff') byHex[t.colors[key]] ??= key;
  const out = new Map();
  const put = (id, breakpoint, decls) => {
    const k = `${id}|${breakpoint}`;
    out.set(k, { id, breakpoint, decls: { ...(out.get(k)?.decls || {}), ...decls } });
  };
  for (const [id, perId] of Object.entries(project.styles || {})) {
    for (const [bp, decls] of Object.entries(perId || {})) {
      for (const [prop, val] of Object.entries(decls || {})) {
        const key = typeof val === 'string' ? byHex[val.trim().toLowerCase()] : null;
        if (key) put(id, bp, { [prop]: themeVar(key) });
      }
    }
  }
  for (const p of project.pages || []) {
    put(p.rootId, 'base', { 'background-color': themeVar('surface'), color: themeVar('ink'), 'font-family': 'var(--pm-font-body)' });
  }
  for (const inst of Object.values(project.instances || {})) {
    if (inst.component === 'Heading') put(inst.id, 'base', { color: themeVar('ink'), 'font-family': 'var(--pm-font-heading)' });
  }
  return [...out.values()];
}

/** Curated Google Font families the theme uses (for loading). */
export function themeFonts(theme) {
  const t = normalizeTheme(theme);
  return [t.fonts.heading, t.fonts.body].filter(Boolean);
}
