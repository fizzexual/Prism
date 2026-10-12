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
