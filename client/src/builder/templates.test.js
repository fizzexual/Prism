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
