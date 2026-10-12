/**
 * Building blocks for section templates (specs consumed by templates.js `build`).
 * Every colour is a theme variable so sections restyle with the site theme.
 */

export const pad = (y, x) => ({ 'padding-top': y, 'padding-bottom': y, 'padding-left': x, 'padding-right': x });

// Entrance animation the templates ship with (see motion.js). Delays match the panel's options.
export const rise = (delay = 0) => ({ preset: 'fade-up', duration: 800, delay, easing: 'smooth' });

const flat = { 'margin-top': '0px', 'margin-bottom': '0px' };

export const heading = (text, level, style = {}, extra = {}) => ({
  component: 'Heading',
  props: { text, level },
  style: { ...flat, 'font-weight': '700', ...style },
  ...extra,
});

export const text = (value, style = {}, extra = {}) => ({ component: 'Text', props: { text: value }, style: { ...flat, ...style }, ...extra });

/** Small all-caps label above a heading. */
export const eyebrow = (value, extra = {}) =>
  text(value, { 'font-size': '13px', 'font-weight': '700', 'letter-spacing': '0.08em', 'text-transform': 'uppercase', color: 'var(--pm-primary)' }, extra);

export const button = (label, variant = 'primary', extra = {}) => ({
  component: 'Button',
  props: { text: label },
  style: {
    ...pad('12px', '22px'),
    'border-radius': 'var(--pm-radius)',
    'font-weight': '700',
    'font-size': '15px',
    ...(variant === 'primary'
      ? { 'background-color': 'var(--pm-primary)', color: '#ffffff', 'border-style': 'none' }
      : { 'background-color': 'transparent', color: 'var(--pm-ink)', 'border-width': '1px', 'border-style': 'solid', 'border-color': 'var(--pm-muted)' }),
  },
  ...extra,
});

/** Theme gradient used for decorative tiles (white text is safe on it). */
export const gradient = (from = 'primary', to = 'dark') => `linear-gradient(135deg, var(--pm-${from}), var(--pm-${to}))`;

/** A centred section intro: optional eyebrow, h2, optional muted lead. */
export const intro = (title, lead, label) => [
  ...(label ? [eyebrow(label, { motion: rise(0) })] : []),
  heading(title, 'h2', { 'font-size': '38px', 'text-align': 'center', 'max-width': '720px', 'line-height': '1.15' }, { motion: rise(0), mobile: { 'font-size': '28px' } }),
  ...(lead ? [text(lead, { 'font-size': '18px', color: 'var(--pm-muted)', 'text-align': 'center', 'max-width': '600px' }, { motion: rise(100), mobile: { 'font-size': '16px' } })] : []),
];

/** Standard section shell: generous padding, centred column, tighter on tablet/phone. */
export const section = (label, children, { style = {}, mobile = {}, tablet = {}, place, category } = {}) => ({
  label,
  category,
  place,
  component: 'Section',
  style: { ...pad('96px', '64px'), gap: '40px', 'align-items': 'center', ...style },
  tablet: { ...pad('72px', '32px'), ...tablet },
  mobile: { ...pad('64px', '20px'), gap: '28px', ...mobile },
  children,
});
