import { describe, test, expect } from 'vitest';
import { createElement, ELEMENTS, elementList } from './registry.jsx';

describe('element registry', () => {
  test('every element type has the required fields', () => {
    for (const t of Object.keys(ELEMENTS)) {
      const e = ELEMENTS[t];
      expect(typeof e.render).toBe('function');
      expect(typeof e.exportTag).toBe('function');
      expect(e.defaultSize.width).toBeGreaterThan(0);
      expect(e.defaultSize.height).toBeGreaterThan(0);
      expect(Array.isArray(e.inspector)).toBe(true);
      expect(e.label).toBeTruthy();
    }
  });

  test('elementList covers every registered type, in order', () => {
    expect(elementList).toHaveLength(Object.keys(ELEMENTS).length);
    expect(elementList[0].type).toBe('section');
  });

  test('createElement places at the drop point with default size', () => {
    const el = createElement('button', { x: 30, y: 40 });
    expect(el.type).toBe('button');
    expect(el.rect).toMatchObject({ x: 30, y: 40, width: ELEMENTS.button.defaultSize.width });
    expect(el.content.text).toBeDefined();
    expect(el.id).toBeTruthy();
    expect(el.responsive).toEqual({});
  });

  test('3d element gets a deep-cloned default three config', () => {
    const a = createElement('3d');
    const b = createElement('3d');
    expect(a.three).toBeTruthy();
    expect(Array.isArray(a.three.lights)).toBe(true);
    a.three.lights.push({ type: 'point' });
    expect(b.three.lights).toHaveLength(2); // clone, not shared reference
  });

  test('exportTag maps heading to h2 and a button-with-href to an anchor', () => {
    const h = createElement('heading');
    expect(ELEMENTS.heading.exportTag(h).tag).toBe('h2');
    const btn = createElement('button');
    expect(ELEMENTS.button.exportTag(btn).tag).toBe('a'); // default href '#'
  });
});
