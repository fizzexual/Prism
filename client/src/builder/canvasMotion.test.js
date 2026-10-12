import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playMotion, playAll } from './canvasMotion.js';

const project = {
  instances: {
    a: { id: 'a', component: 'Box', children: [], props: {}, motion: { preset: 'fade-up', duration: 400, delay: 0 } },
    row: { id: 'row', component: 'Columns', children: ['c1', 'c2'], props: {}, motion: { preset: 'zoom-in', stagger: 100 } },
    c1: { id: 'c1', component: 'Box', children: [], props: {} },
    c2: { id: 'c2', component: 'Box', children: [], props: {} },
    still: { id: 'still', component: 'Box', children: [], props: {} },
  },
};

function makeDoc() {
  document.body.innerHTML = `
    <div data-ws-id="a"></div>
    <div data-ws-id="row"><div data-ws-id="c1"></div><div data-ws-id="c2"></div></div>
    <div data-ws-id="still"></div>`;
  return document;
}
const node = (id) => document.querySelector(`[data-ws-id="${id}"]`);

describe('canvas motion playback', () => {
  beforeEach(() => vi.useFakeTimers());

  it('plays an element: sets the preset, timing and the play class, then cleans up', () => {
    const doc = makeDoc();
    playMotion(doc, project, 'a');
    vi.advanceTimersByTime(20);
    expect(node('a').getAttribute('data-motion')).toBe('fade-up');
    expect(node('a').classList.contains('pm-in')).toBe(true);
    expect(node('a').style.getPropertyValue('--pm-dur')).toBe('400ms');
    vi.advanceTimersByTime(1000);
    expect(node('a').hasAttribute('data-motion')).toBe(false);
    expect(node('a').classList.contains('pm-in')).toBe(false);
  });

  it('a stagger container plays its children with growing delays', () => {
    const doc = makeDoc();
    playMotion(doc, project, 'row');
    vi.advanceTimersByTime(20);
    expect(node('row').hasAttribute('data-motion')).toBe(false);
    expect(node('c1').style.getPropertyValue('--pm-delay')).toBe('0ms');
    expect(node('c2').style.getPropertyValue('--pm-delay')).toBe('100ms');
  });

  it('does nothing for an element without animation', () => {
    const doc = makeDoc();
    playMotion(doc, project, 'still');
    vi.advanceTimersByTime(20);
    expect(node('still').hasAttribute('data-motion')).toBe(false);
  });

  it('playAll plays every animated element', () => {
    const doc = makeDoc();
    playAll(doc, project);
    vi.advanceTimersByTime(20);
    expect(['a', 'c1', 'c2'].every((id) => node(id).classList.contains('pm-in'))).toBe(true);
  });
});
