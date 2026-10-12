import { createInstance, findParentId } from './model.js';
import { COMPONENTS } from './components.jsx';

/**
 * Build a paste-snapshot from a nested spec
 * { component, props, style, tablet?, mobile?, children }.
 * `tablet`/`mobile` are per-breakpoint overrides, so every section looks right on phones out of the box.
 */
function build(spec) {
  const instances = {};
  const styles = {};
  const make = (s) => {
    const inst = createInstance(s.component);
    if (s.props) Object.assign(inst.props, s.props);
    if (s.label) inst.label = s.label;
    if (s.motion) inst.motion = { ...s.motion };
    styles[inst.id] = {
      base: { ...(COMPONENTS[s.component].defaultStyle || {}), ...(s.style || {}) },
      ...(s.tablet ? { tablet: { ...s.tablet } } : {}),
      ...(s.mobile ? { mobile: { ...s.mobile } } : {}),
    };
    inst.children = (s.children || []).map(make);
    instances[inst.id] = inst;
    return inst.id;
  };
  const rootId = make(spec);
  return { rootId, instances, styles };
}

// Entrance animations the templates ship with (see motion.js).
const rise = (delay = 0) => ({ preset: 'fade-up', duration: 800, delay, easing: 'smooth' });

const pad = (y, x) => ({ 'padding-top': y, 'padding-bottom': y, 'padding-left': x, 'padding-right': x });

const card = (title, body) => ({
  component: 'Card',
  style: { 'flex-grow': '1', 'flex-basis': '0%', gap: '8px' },
  mobile: { 'flex-basis': 'auto' },
  children: [
    { component: 'Heading', props: { text: title, level: 'h3' }, style: { 'font-size': '20px', 'font-weight': '700', 'margin-top': '0px', 'margin-bottom': '0px' } },
    { component: 'Text', props: { text: body }, style: { color: '#6b7280', 'margin-top': '0px', 'margin-bottom': '0px' } },
  ],
});

const SPECS = {
  Navbar: {
    label: 'Navbar',
    place: 'top',
    component: 'Section',
    style: { 'flex-direction': 'row', 'align-items': 'center', 'justify-content': 'space-between', ...pad('18px', '40px'), 'background-color': '#ffffff', 'border-bottom-width': '1px', 'border-bottom-style': 'solid', 'border-color': '#e5e7eb' },
    mobile: pad('14px', '20px'),
    children: [
      { component: 'Heading', props: { text: 'Brand', level: 'h2' }, style: { 'font-size': '22px', 'font-weight': '800', 'margin-top': '0px', 'margin-bottom': '0px' } },
      { component: 'Button', props: { text: 'Sign in' }, style: { 'background-color': '#111827', color: '#ffffff', ...pad('8px', '16px'), 'border-radius': '8px', 'border-style': 'none' } },
    ],
  },
  Hero: {
    label: 'Hero',
    component: 'Section',
    style: { ...pad('96px', '64px'), gap: '20px', 'align-items': 'center', 'background-color': '#0b1020' },
    tablet: pad('80px', '40px'),
    mobile: pad('64px', '20px'),
    children: [
      { component: 'Heading', motion: rise(0), props: { text: 'Build something amazing', level: 'h1' }, style: { 'font-size': '56px', 'font-weight': '800', color: '#ffffff', 'text-align': 'center', 'max-width': '760px', 'margin-top': '0px', 'margin-bottom': '0px', 'line-height': '1.1' }, tablet: { 'font-size': '44px' }, mobile: { 'font-size': '34px' } },
      { component: 'Text', motion: rise(100), props: { text: 'A modern landing page, designed visually in minutes.' }, style: { 'font-size': '20px', color: 'rgba(255,255,255,0.7)', 'text-align': 'center', 'max-width': '560px', 'margin-top': '0px', 'margin-bottom': '0px' }, mobile: { 'font-size': '17px' } },
      { component: 'Button', motion: rise(200), props: { text: 'Get started' }, style: { 'background-color': '#4f46e5', color: '#ffffff', ...pad('14px', '28px'), 'border-radius': '10px', 'font-size': '16px', 'font-weight': '700', 'border-style': 'none' } },
    ],
  },
  Features: {
    label: 'Features',
    component: 'Section',
    style: { ...pad('80px', '64px'), gap: '40px', 'align-items': 'center' },
    tablet: pad('64px', '32px'),
    mobile: { ...pad('56px', '20px'), gap: '28px' },
    children: [
      { component: 'Heading', motion: rise(0), props: { text: 'Why choose us', level: 'h2' }, style: { 'font-size': '36px', 'font-weight': '700', 'text-align': 'center', 'margin-top': '0px', 'margin-bottom': '0px' }, mobile: { 'font-size': '28px' } },
      {
        component: 'Columns',
        motion: { ...rise(100), stagger: 100 },
        style: { gap: '24px', 'align-items': 'stretch', width: '100%', 'max-width': '1000px' },
        mobile: { 'flex-direction': 'column', gap: '16px' },
        children: [card('Fast', 'Lightning quick to build and ship.'), card('Flexible', 'Style anything, pixel by pixel.'), card('Simple', 'No code required at all.')],
      },
    ],
  },
  CTA: {
    label: 'Call to action',
    component: 'Section',
    style: { ...pad('72px', '64px'), 'align-items': 'center', gap: '16px', 'background-color': '#4f46e5' },
    mobile: pad('56px', '20px'),
    children: [
      { component: 'Heading', motion: { ...rise(0), preset: 'zoom-in' }, props: { text: 'Ready to start?', level: 'h2' }, style: { color: '#ffffff', 'font-size': '36px', 'text-align': 'center', 'margin-top': '0px', 'margin-bottom': '0px' }, mobile: { 'font-size': '28px' } },
      { component: 'Button', props: { text: 'Sign up free' }, style: { 'background-color': '#ffffff', color: '#4f46e5', ...pad('14px', '28px'), 'border-radius': '10px', 'font-weight': '700', 'border-style': 'none' } },
    ],
  },
  Footer: {
    label: 'Footer',
    place: 'bottom',
    component: 'Section',
    style: { ...pad('48px', '64px'), 'background-color': '#0b1020', gap: '8px', 'align-items': 'center' },
    mobile: pad('32px', '20px'),
    children: [{ component: 'Text', props: { text: '© 2026 Your Company. All rights reserved.' }, style: { color: 'rgba(255,255,255,0.6)', 'margin-top': '0px', 'margin-bottom': '0px', 'text-align': 'center' } }],
  },
};

export const TEMPLATES = Object.values(SPECS).map((spec) => ({ label: spec.label, place: spec.place || 'after', build: () => build(spec) }));

/**
 * Where a section template lands in the page root: Navbar at the top, Footer at the
 * bottom, anything else right after the top-level section that holds the selection
 * (or at the end when nothing on this page is selected).
 */
export function templateInsertIndex(project, rootId, selectedId, template) {
  const kids = project.instances[rootId]?.children || [];
  if (template.place === 'top') return 0;
  if (template.place === 'bottom' || !selectedId) return kids.length;
  let cur = selectedId;
  for (let parent = findParentId(project.instances, cur); parent && parent !== rootId; parent = findParentId(project.instances, cur)) cur = parent;
  const i = kids.indexOf(cur);
  return i === -1 ? kids.length : i + 1;
}
