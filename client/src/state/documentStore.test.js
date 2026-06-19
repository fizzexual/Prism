import { describe, test, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './documentStore.js';

const blank = () => ({
  id: 'p',
  name: 'P',
  pages: [{ id: 'pg', name: 'Home', canvas: {}, elements: [] }],
});

const el = (id) => ({
  id,
  type: 'box',
  name: 'Box',
  rect: { x: 0, y: 0, width: 10, height: 10, rotation: 0 },
  style: {},
  content: {},
});

const elements = () => useDocumentStore.getState().project.pages[0].elements;

describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.getState().loadProject(blank());
  });

  test('addElement then updateElement merges patch', () => {
    const s = useDocumentStore.getState();
    s.addElement('pg', el('e1'));
    s.updateElement('pg', 'e1', { rect: { x: 50 } });
    expect(elements()[0].rect).toMatchObject({ x: 50, y: 0, width: 10 });
  });

  test('undo reverts last document change', () => {
    useDocumentStore.getState().addElement('pg', el('e1'));
    expect(elements()).toHaveLength(1);
    useDocumentStore.temporal.getState().undo();
    expect(elements()).toHaveLength(0);
  });

  test('redo reapplies after undo', () => {
    useDocumentStore.getState().addElement('pg', el('e1'));
    useDocumentStore.temporal.getState().undo();
    useDocumentStore.temporal.getState().redo();
    expect(elements()).toHaveLength(1);
  });

  test('reorder rewrites zIndex by array order', () => {
    const s = useDocumentStore.getState();
    ['a', 'b', 'c'].forEach((id) => s.addElement('pg', el(id)));
    s.reorder('pg', 'a', 2);
    expect(elements().map((e) => e.id)).toEqual(['b', 'c', 'a']);
    expect(elements().map((e) => e.zIndex)).toEqual([0, 1, 2]);
  });

  test('duplicateElements returns new ids and offsets the copy', () => {
    const s = useDocumentStore.getState();
    s.addElement('pg', el('e1'));
    const [nid] = s.duplicateElements('pg', ['e1']);
    expect(nid).toBeTruthy();
    expect(elements()).toHaveLength(2);
    expect(elements()[1].rect.x).toBe(16);
  });

  test('setBreakpointPatch writes a responsive override and leaves base rect', () => {
    const s = useDocumentStore.getState();
    s.addElement('pg', el('e1'));
    s.setBreakpointPatch('pg', 'e1', 'mobile', { width: 100 });
    expect(elements()[0].responsive.mobile.width).toBe(100);
    expect(elements()[0].rect.width).toBe(10);
  });

  test('patchElementStyle deep-merges base style and per-breakpoint overrides', () => {
    const s = useDocumentStore.getState();
    s.addElement('pg', el('e1'));
    s.patchElementStyle('pg', 'e1', 'desktop', { font: { size: 20 } });
    s.patchElementStyle('pg', 'e1', 'desktop', { color: '#f00' });
    expect(elements()[0].style.font.size).toBe(20);
    expect(elements()[0].style.color).toBe('#f00');
    s.patchElementStyle('pg', 'e1', 'mobile', { font: { size: 12 } });
    expect(elements()[0].responsive.mobile.style.font.size).toBe(12);
    expect(elements()[0].style.font.size).toBe(20); // base untouched
  });
});
