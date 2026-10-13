import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBuilder } from './store.js';
import { defaultProject } from './model.js';

const B = () => useBuilder.getState();
const P = () => B().project;
const T = () => useBuilder.temporal.getState();
const steps = () => T().pastStates.length;
let now = 1_000_000;
const at = (ms) => { now += ms; vi.setSystemTime(now); };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  B().loadProject(defaultProject('Site'));
});
afterEach(() => vi.useRealTimers());

const type = (text, fn, gap = 120) => { let v = ''; for (const ch of text) { v += ch; at(gap); fn(v); } };

describe('undo coalescing', () => {
  it('typing a project name is ONE undo step, and undo restores the old name', () => {
    type('hello', (v) => B().setName(v));
    expect(steps()).toBe(1);
    T().undo();
    expect(P().name).toBe('Site');
  });

  it('dragging a slider is one undo step', () => {
    const section = P().instances[P().pages[0].rootId].children[0];
    for (let i = 100; i >= 40; i -= 2) { at(16); B().setStyle(section, 'base', 'opacity', String(i / 100)); }
    expect(steps()).toBe(1);
    T().undo();
    expect(P().styles[section].base.opacity).toBeUndefined();
  });

  it('a pause longer than 1 s starts a new step', () => {
    type('ab', (v) => B().setName(v));
    at(1500);
    B().setName('abc');
    expect(steps()).toBe(2);
    T().undo();
    expect(P().name).toBe('ab');
  });

  it('a different field starts a new step', () => {
    const [h] = P().instances[P().instances[P().pages[0].rootId].children[0]].children;
    type('One', (v) => B().setProp(h, 'text', v));
    type('Two', (v) => B().setName(v));
    expect(steps()).toBe(2);
  });

  it('anything recorded in between starts a new step (no merging across actions)', () => {
    type('ab', (v) => B().setName(v));
    at(100);
    B().insert('Box', P().pages[0].rootId);
    at(100);
    B().setName('abc');
    expect(steps()).toBe(3);
    T().undo();
    expect(P().name).toBe('ab');
  });

  it('typing right after an undo starts a new step and clears redo', () => {
    type('ab', (v) => B().setName(v));
    T().undo();
    at(100);
    B().setName('x');
    expect(steps()).toBe(1);
    expect(T().futureStates).toHaveLength(0);
    T().undo();
    expect(P().name).toBe('Site');
  });

  it('page SEO typing, theme colour picking and component overrides coalesce too', () => {
    const pid = P().pages[0].id;
    type('Great title', (v) => B().setPageSeo(pid, { title: v }));
    expect(steps()).toBe(1);
    for (const c of ['#111111', '#222222', '#333333']) { at(30); B().setTheme({ ...P().theme, colors: { ...P().theme.colors, primary: c } }); }
    expect(steps()).toBe(2);
  });
});
