import { describe, it, expect } from 'vitest';
import { TEMPLATES, templateInsertIndex } from './templates.js';
import { defaultProject } from './model.js';
import { tagFor } from './components.jsx';
import { exportHtml } from './exportSite.js';

const tpl = (label) => TEMPLATES.find((t) => t.label === label);
const nodes = (snap, component) => Object.values(snap.instances).filter((i) => i.component === component);

describe('section templates are responsive', () => {
  it('Features stacks its cards into one column on phones', () => {
    const snap = tpl('Features').build();
    const cols = nodes(snap, 'Columns')[0];
    expect(snap.styles[cols.id].mobile?.['flex-direction']).toBe('column');
  });

  it('every template tightens its side padding on phones', () => {
    for (const t of TEMPLATES) {
      const snap = t.build();
      const pad = snap.styles[snap.rootId].mobile?.['padding-left'];
      expect(pad, t.label).toBeDefined();
      expect(parseInt(pad, 10), t.label).toBeLessThanOrEqual(24);
    }
  });

  it('big headings scale down on phones', () => {
    const snap = tpl('Hero').build();
    const h = nodes(snap, 'Heading')[0];
    expect(parseInt(snap.styles[h.id].mobile['font-size'], 10)).toBeLessThanOrEqual(36);
  });

  it('the exported page carries the phone rules', () => {
    const p = defaultProject();
    const snap = tpl('Features').build();
    Object.assign(p.instances, snap.instances);
    Object.assign(p.styles, snap.styles);
    p.instances[p.pages[0].rootId].children.push(snap.rootId);
    const html = exportHtml(p);
    expect(html).toMatch(/@media \(max-width: 479px\)[^@]*flex-direction: column;/);
  });
});

describe('headings', () => {
  it('Hero uses an h1 (one main heading per page for SEO)', () => {
    const snap = tpl('Hero').build();
    expect(tagFor(nodes(snap, 'Heading')[0])).toBe('h1');
  });

  it('tagFor honours a valid level and ignores junk', () => {
    expect(tagFor({ component: 'Heading', props: { level: 'h3' } })).toBe('h3');
    expect(tagFor({ component: 'Heading', props: { level: 'script' } })).toBe('h2');
    expect(tagFor({ component: 'Text', props: { level: 'h1' } })).toBe('p');
  });
});

describe('templateInsertIndex', () => {
  const page = () => {
    const p = defaultProject();
    const root = p.pages[0].rootId;
    const first = p.instances[root].children[0];
    const heading = p.instances[first].children[0];
    p.instances.s2 = { id: 's2', component: 'Section', children: [], props: {} };
    p.instances[root].children.push('s2');
    return { p, root, first, heading };
  };

  it('Navbar goes to the top', () => {
    const { p, root } = page();
    expect(templateInsertIndex(p, root, null, tpl('Navbar'))).toBe(0);
  });

  it('Footer goes to the bottom even with a selection', () => {
    const { p, root, first } = page();
    expect(templateInsertIndex(p, root, first, tpl('Footer'))).toBe(2);
  });

  it('other sections go right after the selected section', () => {
    const { p, root, first } = page();
    expect(templateInsertIndex(p, root, first, tpl('Features'))).toBe(1);
  });

  it('selecting something inside a section inserts after that section', () => {
    const { p, root, heading } = page();
    expect(templateInsertIndex(p, root, heading, tpl('Call to action'))).toBe(1);
  });

  it('no selection appends', () => {
    const { p, root } = page();
    expect(templateInsertIndex(p, root, null, tpl('Hero'))).toBe(2);
  });
});

describe('templates come animated', () => {
  it('Hero content fades up in sequence', () => {
    const snap = tpl('Hero').build();
    const root = snap.instances[snap.rootId];
    const delays = root.children.map((id) => snap.instances[id].motion?.delay);
    expect(root.children.every((id) => snap.instances[id].motion?.preset === 'fade-up')).toBe(true);
    expect(delays).toEqual([0, 100, 200]); // values the Delay dropdown offers
  });

  it('Features cards stagger in', () => {
    const snap = tpl('Features').build();
    const cols = nodes(snap, 'Columns')[0];
    expect(cols.motion).toMatchObject({ preset: 'fade-up' });
    expect(cols.motion.stagger).toBeGreaterThan(0);
  });

  it('Navbar does not animate (it should be there instantly)', () => {
    const snap = tpl('Navbar').build();
    expect(Object.values(snap.instances).some((i) => i.motion)).toBe(false);
  });
});

describe('templates follow the site theme', () => {
  const all = () => TEMPLATES.map((t) => t.build());
  it('every heading uses the theme heading font and text colour unless it sits on a dark/colour band', () => {
    for (const snap of all()) {
      for (const h of nodes(snap, 'Heading')) expect(snap.styles[h.id].base['font-family']).toBe('var(--pm-font-heading)');
    }
  });
  it('accent surfaces use theme colours and corners use the theme radius', () => {
    const hero = tpl('Hero').build();
    const btn = nodes(hero, 'Button')[0];
    expect(hero.styles[hero.rootId].base['background-color']).toBe('var(--pm-dark)');
    expect(hero.styles[btn.id].base).toMatchObject({ 'background-color': 'var(--pm-primary)', 'border-radius': 'var(--pm-radius)' });
    const cta = tpl('Call to action').build();
    expect(cta.styles[cta.rootId].base['background-color']).toBe('var(--pm-primary)');
    const features = tpl('Features').build();
    for (const c of nodes(features, 'Card')) expect(features.styles[c.id].base['border-radius']).toBe('var(--pm-radius)');
  });
});

describe('new elements follow the site theme', async () => {
  const { COMPONENTS } = await import('./components.jsx');
  it('Body, Heading and Button defaults use theme variables', () => {
    expect(COMPONENTS.Body.defaultStyle).toMatchObject({ 'background-color': 'var(--pm-surface)', color: 'var(--pm-ink)', 'font-family': 'var(--pm-font-body)' });
    expect(COMPONENTS.Heading.defaultStyle).toMatchObject({ color: 'var(--pm-ink)', 'font-family': 'var(--pm-font-heading)' });
    expect(COMPONENTS.Button.defaultStyle).toMatchObject({ 'background-color': 'var(--pm-primary)', 'border-radius': 'var(--pm-radius)' });
    expect(COMPONENTS.Link.defaultStyle.color).toBe('var(--pm-primary)');
  });
});

describe('the starter section of a new project is phone-ready too', () => {
  it('tightens padding and scales the heading on phones', () => {
    const p = defaultProject();
    const section = p.instances[p.pages[0].rootId].children[0];
    const heading = p.instances[section].children[0];
    expect(parseInt(p.styles[section].mobile['padding-left'], 10)).toBeLessThanOrEqual(24);
    expect(parseInt(p.styles[heading].mobile['font-size'], 10)).toBeLessThanOrEqual(36);
  });
});
