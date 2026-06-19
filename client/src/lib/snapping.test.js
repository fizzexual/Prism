import { describe, test, expect } from 'vitest';
import { snapValue, snapRectToGrid, alignmentGuides } from './snapping.js';

describe('snapValue', () => {
  test('rounds to the nearest grid multiple', () => {
    expect(snapValue(11, 8)).toBe(8);
    expect(snapValue(13, 8)).toBe(16);
    expect(snapValue(7, 0)).toBe(7); // no grid -> unchanged
  });
});

describe('snapRectToGrid', () => {
  test('snaps x and y, leaves size', () => {
    expect(snapRectToGrid({ x: 11, y: 13, width: 50, height: 20 }, 8)).toEqual({
      x: 8,
      y: 16,
      width: 50,
      height: 20,
    });
  });
});

describe('alignmentGuides', () => {
  test('snaps left edges within threshold and reports the guide line', () => {
    const r = alignmentGuides(
      { x: 102, y: 0, width: 50, height: 20 },
      [{ x: 100, y: 200, width: 30, height: 30 }],
      6,
    );
    expect(r.x).toBe(-2);
    expect(r.lines.some((l) => l.axis === 'x' && l.pos === 100)).toBe(true);
  });

  test('returns null deltas when nothing is within threshold', () => {
    const r = alignmentGuides(
      { x: 500, y: 500, width: 50, height: 20 },
      [{ x: 0, y: 0, width: 30, height: 30 }],
      6,
    );
    expect(r.x).toBeNull();
    expect(r.y).toBeNull();
    expect(r.lines).toHaveLength(0);
  });
});
