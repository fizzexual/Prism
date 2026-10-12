import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilder } from './store.js';
import { defaultProject, collectSubtree } from './model.js';

const B = () => useBuilder.getState();
const P = () => B().project;
const history = () => useBuilder.temporal.getState().pastStates.length;
const root = () => P().pages[0].rootId;

beforeEach(() => {
  B().loadProject(defaultProject('T'));
});

/** Turn the page's first section into component A; returns { compId, instId, masterId }. */
function makeComponentA() {
  const sectionId = P().instances[root()].children[0];
  const { compId, instId } = B().createComponent(sectionId, 'A');
  return { compId, instId, masterId: sectionId };
}

describe('components cannot contain themselves', () => {
  it('refuses to place A inside A\'s own master', () => {
    const { compId, masterId } = makeComponentA();
    const before = P();
    expect(B().addComponentInstance(compId, masterId)).toBeNull();
    expect(P()).toBe(before);
  });

  it('refuses an indirect cycle (A uses B, then B gets A)', () => {
    const { compId: a, masterId: aMaster } = makeComponentA();
    const boxId = B().insert('Box', root());
    const { compId: b } = B().createComponent(boxId, 'B');
    expect(B().addComponentInstance(b, aMaster)).not.toBeNull(); // A contains B: fine
    expect(B().addComponentInstance(a, boxId)).toBeNull(); // B's master would contain A: cycle
  });

  it('refuses moving an instance of A into A\'s master', () => {
    const { instId, masterId } = makeComponentA();
    const before = P();
    B().move(instId, masterId, 0);
    expect(P()).toBe(before);
  });

  it('still allows placing an instance on a page', () => {
    const { compId } = makeComponentA();
    expect(B().addComponentInstance(compId, root())).not.toBeNull();
  });
});

describe('duplicate', () => {
  it('duplicates a component Instance (keeps its component and overrides)', () => {
    const { instId, compId } = makeComponentA();
    B().setOverride(instId, 'v1', 'Hello');
    const copy = B().duplicate(instId);
    expect(copy).toBeTruthy();
    expect(P().instances[copy]).toMatchObject({ component: 'Instance', props: { componentId: compId, overrides: { v1: 'Hello' } } });
  });

  it('keeps variable bindings on duplicated master nodes', () => {
    const { masterId } = makeComponentA();
    const heading = P().instances[masterId].children[0];
    B().setBinding(heading, 'text', 'v1');
    const copy = B().duplicate(heading);
    expect(P().instances[copy].bindings).toEqual({ text: 'v1' });
  });

  it('gives every duplicated node a fresh id', () => {
    const section = P().instances[root()].children[0];
    const copy = B().duplicate(section);
    const a = collectSubtree(P().instances, section);
    const b = collectSubtree(P().instances, copy);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
  });
});

describe('undo history', () => {
  it('a refused action does not add an undo step', () => {
    const section = P().instances[root()].children[0];
    const n = history();
    B().move(section, section, 0); // into itself: refused
    expect(history()).toBe(n);
  });
});

describe('canvas root + batched styles', () => {
  it('canvasRootId is the active page root, or the component master while editing one', async () => {
    const { canvasRootId } = await import('./model.js');
    const pageId = B().addPage('Two');
    const page2Root = P().pages.find((p) => p.id === pageId).rootId;
    expect(canvasRootId(P(), { activePageId: pageId, editingComponentId: null })).toBe(page2Root);
    const { compId, masterId } = makeComponentA();
    expect(canvasRootId(P(), { activePageId: pageId, editingComponentId: compId })).toBe(masterId);
    expect(canvasRootId(P(), { activePageId: pageId, editingComponentId: 'gone' })).toBe(page2Root);
  });

  it('setStylesBatch changes several elements in one undo step', () => {
    const section = P().instances[root()].children[0];
    const n = history();
    B().setStylesBatch([
      { id: root(), breakpoint: 'base', decls: { position: 'relative' } },
      { id: section, breakpoint: 'mobile', decls: { position: 'absolute', left: '10px' } },
    ]);
    expect(history()).toBe(n + 1);
    expect(P().styles[root()].base.position).toBe('relative');
    expect(P().styles[section].mobile).toMatchObject({ position: 'absolute', left: '10px' });
  });
});

describe('style state in the UI store', () => {
  it('selecting another element goes back to Normal', async () => {
    const { useUI } = await import('./store.js');
    useUI.getState().setStyleState('hover');
    expect(useUI.getState().styleState).toBe('hover');
    useUI.getState().select('x');
    expect(useUI.getState().styleState).toBe('normal');
  });
});

describe('setMotion', () => {
  it('sets and clears an element animation in one undo step each', () => {
    const section = P().instances[root()].children[0];
    const n = history();
    B().setMotion(section, { preset: 'fade-up', duration: 800 });
    expect(P().instances[section].motion).toEqual({ preset: 'fade-up', duration: 800 });
    expect(history()).toBe(n + 1);
    B().setMotion(section, null);
    expect(P().instances[section].motion).toBeUndefined();
    expect(history()).toBe(n + 2);
  });

  it('duplicate keeps the animation', () => {
    const section = P().instances[root()].children[0];
    B().setMotion(section, { preset: 'zoom-in' });
    const copy = B().duplicate(section);
    expect(P().instances[copy].motion).toEqual({ preset: 'zoom-in' });
  });

  it('copy/paste keeps the animation', async () => {
    const { snapshotSubtree } = await import('./model.js');
    const section = P().instances[root()].children[0];
    B().setMotion(section, { preset: 'blur-in' });
    const pasted = B().pasteSnapshot(root(), undefined, snapshotSubtree(P(), section));
    expect(P().instances[pasted].motion).toEqual({ preset: 'blur-in' });
  });
});

describe('themes', () => {
  it('a new project has the default theme', async () => {
    const { DEFAULT_THEME } = await import('./theme.js');
    expect(P().theme).toEqual(DEFAULT_THEME);
  });

  it('applyTheme sets the theme and links the page to it in one undo step', async () => {
    const { THEME_PRESETS } = await import('./theme.js');
    const section = P().instances[root()].children[0];
    B().setStyle(section, 'base', 'background-color', '#4f46e5'); // a "primary" colour typed as hex
    const n = history();
    const sunset = THEME_PRESETS.find((p) => p.key === 'sunset').theme;
    B().applyTheme(sunset);
    expect(history()).toBe(n + 1);
    expect(P().theme).toEqual(sunset);
    expect(P().styles[section].base['background-color']).toBe('var(--pm-primary)');
    expect(P().styles[root()].base['font-family']).toBe('var(--pm-font-body)');
  });

  it('setTheme changes only the theme (live colour edits)', () => {
    const n = history();
    B().setTheme({ ...P().theme, radius: 24 });
    expect(P().theme.radius).toBe(24);
    expect(history()).toBe(n + 1);
  });
});

describe('addPageWithSections (starter pages)', () => {
  it('adds a new page filled with the sections in order, in one undo step, leaving other pages alone', async () => {
    const { STARTERS, buildStarter } = await import('./templates.js');
    const before = P().pages.map((p) => ({ ...p }));
    const homeKids = [...P().instances[root()].children];
    const n = history();
    const starter = STARTERS.find((s) => s.label === 'Portfolio');
    const pageId = B().addPageWithSections('Portfolio', buildStarter(starter));
    expect(history()).toBe(n + 1);
    const page = P().pages.find((p) => p.id === pageId);
    expect(page.name).toBe('Portfolio');
    expect(P().instances[page.rootId].children.map((id) => P().instances[id].label)).toEqual(starter.sections);
    expect(P().pages.slice(0, before.length)).toEqual(before);
    expect(P().instances[root()].children).toEqual(homeKids);
  });

  it('gives every inserted node a fresh id (two starters never collide)', async () => {
    const { STARTERS, buildStarter } = await import('./templates.js');
    const a = B().addPageWithSections('A', buildStarter(STARTERS[1]));
    const b = B().addPageWithSections('B', buildStarter(STARTERS[1]));
    const ids = (pid) => collectSubtree(P().instances, P().pages.find((p) => p.id === pid).rootId);
    expect(ids(a).filter((x) => ids(b).includes(x))).toEqual([]);
  });
});
