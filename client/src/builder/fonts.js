/**
 * Curated Google Fonts: the Font dropdown, the stored CSS stack, and the stylesheet
 * URL for the fonts a site actually uses. Only names from this list ever reach the
 * URL. Weights are per family — Google rejects the whole request if a family lacks
 * a requested weight.
 */

const W = [400, 500, 600, 700, 800];

export const GOOGLE_FONTS = [
  { family: 'Inter', category: 'sans', weights: W },
  { family: 'Manrope', category: 'sans', weights: W },
  { family: 'DM Sans', category: 'sans', weights: W },
  { family: 'Plus Jakarta Sans', category: 'sans', weights: W },
  { family: 'Outfit', category: 'sans', weights: W },
  { family: 'Poppins', category: 'sans', weights: W },
  { family: 'Space Grotesk', category: 'display', weights: [400, 500, 600, 700] },
  { family: 'Sora', category: 'display', weights: W },
  { family: 'Syne', category: 'display', weights: W },
  { family: 'Bricolage Grotesque', category: 'display', weights: W },
  { family: 'Playfair Display', category: 'serif', weights: W },
  { family: 'Fraunces', category: 'serif', weights: W },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700] },
  { family: 'DM Serif Display', category: 'serif', weights: [400] },
  { family: 'Instrument Serif', category: 'serif', weights: [400] },
  { family: 'JetBrains Mono', category: 'mono', weights: W },
];

const FALLBACK = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  display: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
};

const BY_NAME = new Map(GOOGLE_FONTS.map((f) => [f.family, f]));

/** CSS font-family value for a curated font (with a fallback that reads well before it loads). */
export function fontStack(family) {
  const f = BY_NAME.get(family);
  return f ? `"${f.family}", ${FALLBACK[f.category]}` : '';
}

/** Options for the Font dropdown: system stacks first, then the curated fonts. */
export const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'system-ui, -apple-system, "Segoe UI", sans-serif', label: 'System sans' },
  { value: 'ui-serif, Georgia, "Times New Roman", serif', label: 'System serif' },
  { value: 'ui-monospace, Menlo, Consolas, monospace', label: 'System mono' },
  ...GOOGLE_FONTS.map((f) => ({ value: fontStack(f.family), label: f.family })),
];

/** The curated family a font-family value starts with, or null. */
function curatedFamily(value) {
  const m = /^\s*"([^"]+)"/.exec(String(value || ''));
  return m && BY_NAME.has(m[1]) ? m[1] : null;
}

/** Curated families used anywhere in the styles map (any breakpoint or state). */
export function usedGoogleFonts(styles = {}) {
  const used = new Set();
  for (const perId of Object.values(styles)) {
    for (const decls of Object.values(perId || {})) {
      const fam = curatedFamily(decls?.['font-family']);
      if (fam) used.add(fam);
    }
  }
  return [...used];
}

/** One Google Fonts css2 URL for the given families (curated only), or null. */
export function googleFontsHref(families = []) {
  const parts = families
    .filter((f) => BY_NAME.has(f))
    .map((f) => {
      const { weights } = BY_NAME.get(f);
      const name = f.replace(/ /g, '+');
      return weights.length > 1 ? `family=${name}:wght@${weights.join(';')}` : `family=${name}`;
    });
  return parts.length ? `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap` : null;
}
