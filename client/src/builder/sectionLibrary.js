import { section, intro, heading, text, eyebrow, button, gradient, rise, pad } from './sectionKit.js';

/**
 * The section library (on top of the core sections in templates.js). Every section
 * obeys the rules in docs/superpowers/specs/2026-10-12-section-library-design.md,
 * enforced for all sections by sectionLibrary.test.js.
 */

const box = (children, style = {}, extra = {}) => ({ component: 'Box', style: { ...pad('0px', '0px'), ...style }, children, ...extra });
const stack = (children, style = {}, extra = {}) => box(children, { display: 'flex', 'flex-direction': 'column', ...style }, extra);
/** A small inline row (avatar + name, buttons) — stays a row on phones, wraps if needed. */
const inline = (children, style = {}, extra = {}) => box(children, { display: 'flex', 'align-items': 'center', 'flex-wrap': 'wrap', gap: '12px', ...style }, extra);
const card = (children, style = {}, extra = {}) => ({ component: 'Card', style: { gap: '12px', ...style }, children, ...extra });
const stagger = (preset = 'fade-up', step = 100) => ({ preset, duration: 800, delay: 100, easing: 'smooth', stagger: step });
const grid = (cols, children, { style = {}, tablet = {}, mobile = {}, motion } = {}) => ({
  component: 'Grid',
  style: { 'grid-template-columns': `repeat(${cols}, 1fr)`, gap: '20px', width: '100%', 'max-width': '1100px', ...style },
  tablet: { 'grid-template-columns': 'repeat(2, 1fr)', ...tablet },
  mobile: { 'grid-template-columns': '1fr', ...mobile },
  ...(motion ? { motion } : {}),
  children,
});
const wide = (b) => ({ ...b, style: { ...b.style, width: '100%' } });
const avatar = (initials, size = 40) =>
  box([text(initials, { color: '#ffffff', 'font-weight': '700', 'font-size': `${Math.round(size * 0.36)}px` })], {
    display: 'flex', 'align-items': 'center', 'justify-content': 'center', width: `${size}px`, height: `${size}px`, 'flex-shrink': '0',
    'border-radius': '999px', 'background-image': gradient('primary', 'dark'),
  });
const muted = (value, style = {}, extra = {}) => text(value, { color: 'var(--pm-muted)', 'line-height': '1.6', ...style }, extra);
const field = (component, placeholder, style = {}) => ({ component, props: { placeholder }, style: { width: '100%', 'border-color': 'var(--pm-muted)', 'border-radius': 'var(--pm-radius)', ...style } });
const footLink = (label) => ({ component: 'Link', props: { text: label, href: '#' }, style: { color: 'rgba(255,255,255,0.75)', 'text-decoration-line': 'none', 'font-size': '15px' } });

const heroSplit = section('Hero (split)', [
  {
    component: 'Columns',
    style: { gap: '56px', 'align-items': 'center', width: '100%', 'max-width': '1150px' },
    tablet: { gap: '32px' },
    mobile: { 'flex-direction': 'column', gap: '32px', 'align-items': 'stretch' },
    children: [
      stack([
        eyebrow('New — version 2.0', { motion: rise(0) }),
        heading('Design websites people remember', 'h1', { 'font-size': '54px', 'line-height': '1.05', 'letter-spacing': '-0.02em' }, { motion: rise(0), tablet: { 'font-size': '42px' }, mobile: { 'font-size': '34px' } }),
        muted('Drag, drop and publish a fast, beautiful site. No code, and no template that looks like everyone else’s.', { 'font-size': '19px' }, { motion: rise(100), mobile: { 'font-size': '17px' } }),
        inline([button('Start free'), button('See examples', 'secondary')], {}, { motion: rise(200) }),
      ], { gap: '20px', 'flex-grow': '1', 'flex-basis': '0%' }, { mobile: { 'flex-basis': 'auto' } }),
      box([], {
        'flex-grow': '1', 'flex-basis': '0%', 'min-height': '380px', 'background-image': gradient('primary', 'dark'),
        'border-radius': 'var(--pm-radius)', 'box-shadow': '0 30px 60px rgba(15,23,42,0.25)',
      }, { mobile: { 'min-height': '220px', 'flex-basis': 'auto' }, motion: { preset: 'zoom-in', duration: 1000, delay: 200, easing: 'smooth' } }),
    ],
  },
], { category: 'Hero' });

const logoCloud = section('Logo cloud', [
  muted('Trusted by fast-moving teams', { 'font-size': '14px', 'font-weight': '600', 'text-align': 'center' }, { motion: rise(0) }),
  {
    component: 'Columns',
    style: { 'justify-content': 'center', 'flex-wrap': 'wrap', gap: '24px 56px', width: '100%' },
    mobile: { gap: '16px 28px' },
    motion: stagger('fade-up', 60),
    children: ['Northwind', 'Acme Co', 'Globex', 'Umbrella', 'Initech'].map((n) =>
      text(n, { 'font-size': '24px', 'font-weight': '800', 'letter-spacing': '-0.02em', color: 'var(--pm-muted)', 'font-family': 'var(--pm-font-heading)' })),
  },
], { category: 'Social proof', style: { ...pad('56px', '64px'), gap: '24px' }, tablet: pad('48px', '32px'), mobile: { ...pad('40px', '20px'), gap: '20px' } });

const stats = section('Stats', [
  ...intro('Numbers that speak for themselves'),
  grid(4, [['12k+', 'Sites published'], ['99.9%', 'Uptime'], ['4.9/5', 'Average rating'], ['<1s', 'Load time']].map(([n, l]) =>
    stack([
      text(n, { 'font-size': '46px', 'font-weight': '800', 'font-family': 'var(--pm-font-heading)', color: 'var(--pm-primary)', 'text-align': 'center', 'line-height': '1' }, { mobile: { 'font-size': '34px' } }),
      muted(l, { 'text-align': 'center', 'font-size': '15px' }),
    ], { gap: '8px', 'align-items': 'center' })), { mobile: { 'grid-template-columns': 'repeat(2, 1fr)', gap: '28px 12px' }, motion: stagger() }),
], { category: 'Content' });

const tile = (title, body, kind, span) => {
  const onColour = kind !== 'surface';
  return card([
    heading(title, 'h3', { 'font-size': '24px', color: onColour ? '#ffffff' : 'var(--pm-ink)' }),
    text(body, { color: onColour ? 'rgba(255,255,255,0.8)' : 'var(--pm-muted)', 'line-height': '1.55' }),
  ], {
    'justify-content': 'flex-end', 'min-height': '0px', ...pad('28px', '28px'),
    ...(kind === 'surface' ? {} : { 'background-color': `var(--pm-${kind})` }),
    ...(span ? { 'grid-column': `span ${span[0]}`, 'grid-row': `span ${span[1]}` } : {}),
  }, {
    tablet: span ? { 'grid-column': 'span 2', 'grid-row': 'span 1' } : {},
    mobile: { 'grid-column': 'auto', 'grid-row': 'auto', 'min-height': '160px' },
  });
};

const bento = section('Bento grid', [
  ...intro('Everything you need, nothing you don’t', 'Powerful when you need it, invisible when you don’t.', 'Features'),
  grid(4, [
    tile('Everything in one place', 'Design, content and publishing live side by side. Ship a whole site from one tab.', 'dark', [2, 2]),
    tile('Lightning fast', 'Exports clean HTML and CSS that loads in a blink.', 'primary', [2, 1]),
    tile('Responsive', 'Every section is tuned for phones.', 'surface'),
    tile('Animated', 'Scroll animations in one click.', 'surface'),
  ], { style: { 'grid-auto-rows': '200px' }, tablet: { 'grid-auto-rows': 'auto' }, mobile: { 'grid-auto-rows': 'auto' }, motion: stagger('zoom-in', 100) }),
], { category: 'Content' });

const GALLERY = [['primary', 'dark'], ['accent', 'primary'], ['dark', 'primary'], ['primary', 'accent'], ['dark', 'accent'], ['accent', 'dark']];
const gallery = section('Gallery', [
  ...intro('Selected work', 'A few projects we’re proud of. Drop your own images into any tile.'),
  grid(3, GALLERY.map(([a, b]) => box([], { 'aspect-ratio': '4 / 3', 'border-radius': 'var(--pm-radius)', 'background-image': gradient(a, b) })),
    { mobile: { 'grid-template-columns': 'repeat(2, 1fr)', gap: '10px' }, motion: stagger('zoom-in', 60) }),
], { category: 'Content' });

const team = section('Team', [
  ...intro('The people behind it', null, 'Team'),
  grid(4, [['AL', 'Ada Lovelace', 'Founder'], ['GH', 'Grace Hopper', 'Engineering'], ['AT', 'Alan Turing', 'Research'], ['KJ', 'Katherine Johnson', 'Design']].map(([i, n, r]) =>
    card([avatar(i, 72), text(n, { 'font-weight': '700', 'text-align': 'center', color: 'var(--pm-ink)' }), muted(r, { 'font-size': '14px', 'text-align': 'center' })],
      { 'align-items': 'center', ...pad('28px', '16px') })),
  { mobile: { 'grid-template-columns': 'repeat(2, 1fr)', gap: '12px' }, motion: stagger() }),
], { category: 'Content' });

const QUOTES = [
  ['“We rebuilt our whole site in an afternoon. It looks better than the agency version.”', 'Maya Chen', 'Head of Growth, Northwind', 'MC'],
  ['“The animations and themes make everything feel premium without any effort.”', 'Leo Park', 'Designer, Globex', 'LP'],
  ['“Finally a builder that exports clean code I’m happy to host anywhere.”', 'Sara Ruiz', 'CTO, Initech', 'SR'],
];
const testimonials = section('Testimonials', [
  ...intro('Loved by people who ship', null, 'Testimonials'),
  grid(3, QUOTES.map(([q, n, r, i]) =>
    card([
      text(q, { 'font-size': '17px', 'line-height': '1.6', color: 'var(--pm-ink)' }),
      inline([avatar(i), stack([text(n, { 'font-weight': '700', 'font-size': '15px', color: 'var(--pm-ink)' }), muted(r, { 'font-size': '13px' })], { gap: '2px' })]),
    ], { 'justify-content': 'space-between', gap: '24px', ...pad('28px', '28px') })),
  { tablet: { 'grid-template-columns': '1fr', 'max-width': '640px' }, motion: stagger() }),
], { category: 'Social proof' });

const tier = (name, price, blurb, features, featured = false) =>
  card([
    ...(featured ? [eyebrow('Most popular')] : []),
    text(name, { 'font-weight': '700', 'font-size': '18px', color: 'var(--pm-ink)' }),
    inline([heading(price, 'h3', { 'font-size': '44px', 'line-height': '1' }), muted('/month', { 'font-size': '15px' })], { gap: '6px', 'align-items': 'baseline' }),
    muted(blurb, { 'font-size': '15px' }),
    stack(features.map((f) => text(`✓  ${f}`, { 'font-size': '15px', color: 'var(--pm-ink)' })), { gap: '10px' }),
    wide(button(featured ? 'Get started' : 'Choose plan', featured ? 'primary' : 'secondary')),
  ], {
    ...pad('32px', '28px'), gap: '16px',
    ...(featured ? { 'border-width': '2px', 'border-style': 'solid', 'border-color': 'var(--pm-primary)', 'box-shadow': '0 24px 60px rgba(15,23,42,0.18)' } : {}),
  });

const pricing = section('Pricing', [
  ...intro('Simple, honest pricing', 'Start free. Upgrade when you grow. Cancel anytime.', 'Pricing'),
  grid(3, [
    tier('Starter', '$0', 'For personal projects and trying things out.', ['1 site', 'All sections', 'Export HTML']),
    tier('Pro', '$19', 'For freelancers and growing teams.', ['Unlimited sites', 'Themes & fonts', 'Animations', 'Priority support'], true),
    tier('Studio', '$49', 'For agencies building for clients.', ['Everything in Pro', 'Client handoff', 'Team seats']),
  ], { style: { 'align-items': 'stretch' }, tablet: { 'grid-template-columns': '1fr', 'max-width': '520px' }, motion: stagger() }),
], { category: 'Pricing' });

const FAQS = [
  ['Do I need to know how to code?', 'No. Everything is visual, and you can still export clean HTML and CSS whenever you want.'],
  ['Can I use my own domain?', 'Yes. Export your site and host it anywhere: Netlify, GitHub Pages or your own server.'],
  ['Does it work on phones?', 'Every section comes tuned for tablets and phones, and you can adjust each breakpoint.'],
  ['Can I change the look later?', 'Switch themes, fonts and colours at any time; the whole site follows.'],
];
const faq = section('FAQ', [
  ...intro('Questions, answered', null, 'FAQ'),
  grid(2, FAQS.map(([q, a]) => stack([heading(q, 'h3', { 'font-size': '18px' }), muted(a)], { gap: '8px' })),
    { style: { gap: '32px 48px', 'max-width': '1000px' }, tablet: { 'grid-template-columns': 'repeat(2, 1fr)' }, motion: stagger('fade-up', 60) }),
], { category: 'Help' });

const contact = section('Contact', [
  {
    component: 'Columns',
    style: { gap: '48px', width: '100%', 'max-width': '1100px', 'align-items': 'flex-start' },
    tablet: { gap: '32px' },
    mobile: { 'flex-direction': 'column', 'align-items': 'stretch', gap: '28px' },
    children: [
      stack([
        eyebrow('Contact'),
        heading('Let’s build something great', 'h2', { 'font-size': '38px', 'line-height': '1.15' }, { mobile: { 'font-size': '28px' } }),
        muted('Tell us about your project and we’ll get back to you within a day.', { 'font-size': '17px' }),
        text('hello@yourcompany.com', { 'font-weight': '700', color: 'var(--pm-primary)' }),
      ], { gap: '16px', 'flex-grow': '1', 'flex-basis': '0%' }, { motion: rise(0), mobile: { 'flex-basis': 'auto' } }),
      card([field('Input', 'Your name'), field('Input', 'Email address'), field('Textarea', 'How can we help?', { 'min-height': '120px' }), wide(button('Send message'))],
        { 'flex-grow': '1', 'flex-basis': '0%', ...pad('28px', '28px') }, { motion: rise(100), mobile: { 'flex-basis': 'auto' } }),
    ],
  },
], { category: 'Help' });

const newsletter = section('Newsletter', [
  heading('Get the good stuff, monthly', 'h2', { 'font-size': '36px', color: '#ffffff', 'text-align': 'center' }, { motion: rise(0), mobile: { 'font-size': '28px' } }),
  text('One short email with new templates and tips. No spam, ever.', { color: 'rgba(255,255,255,0.75)', 'text-align': 'center', 'font-size': '17px' }, { motion: rise(100) }),
  {
    component: 'Columns',
    style: { gap: '10px', width: '100%', 'max-width': '480px' },
    mobile: { 'flex-direction': 'column' },
    motion: rise(200),
    children: [field('Input', 'you@example.com', { 'flex-grow': '1', 'background-color': '#ffffff' }), button('Subscribe')],
  },
], { category: 'Call to action', style: { 'background-color': 'var(--pm-dark)', gap: '20px' } });

const footerColumns = section('Footer (columns)', [
  grid(4, [
    stack([heading('Brand', 'h3', { 'font-size': '22px', color: '#ffffff' }), text('Websites that feel alive.', { color: 'rgba(255,255,255,0.7)' })], { gap: '10px' }),
    ...[['Product', 'Features', 'Pricing', 'Changelog'], ['Company', 'About', 'Careers', 'Contact'], ['Resources', 'Docs', 'Guides', 'Support']].map(([title, ...links]) =>
      stack([text(title, { color: '#ffffff', 'font-weight': '700', 'font-size': '14px' }), ...links.map(footLink)], { gap: '10px' })),
  ], { style: { gap: '32px' }, mobile: { 'grid-template-columns': 'repeat(2, 1fr)', gap: '28px 16px' } }),
  text('© 2026 Your Company. All rights reserved.', { color: 'rgba(255,255,255,0.6)', 'font-size': '13px' }),
], { category: 'Footer', place: 'bottom', style: { 'background-color': 'var(--pm-dark)', ...pad('64px', '64px'), gap: '40px', 'align-items': 'stretch' }, mobile: { ...pad('48px', '20px') } });

export const LIBRARY = [heroSplit, logoCloud, stats, bento, gallery, team, testimonials, pricing, faq, contact, newsletter, footerColumns];
