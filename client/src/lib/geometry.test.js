import { describe, test, expect } from 'vitest';
import { rectBounds, resolveRect, resolveStyle, rotatePoint } from './geometry.js';

describe('rectBounds', () => {
  test('axis-aligned bounds for unrotated rect', () => {
    expect(rectBounds({ x: 10, y: 20, width: 100, height: 50, rotation: 0 })).toEqual({
      left: 10,
      top: 20,
      right: 110,
      bottom: 70,
      cx: 60,
      cy: 45,
    });
  });

  test('90deg rotation swaps extents around center', () => {
    const b = rectBounds({ x: 0, y: 0, width: 100, height: 50, rotation: 90 });
    expect(Math.round(b.right - b.left)).toBe(50);
    expect(Math.round(b.bottom - b.top)).toBe(100);
    expect(b.cx).toBe(50);
    expect(b.cy).toBe(25);
  });
});

describe('rotatePoint', () => {
  test('rotates 90deg around origin', () => {
    const p = rotatePoint(10, 0, 0, 0, 90);
    expect(Math.round(p.x)).toBe(0);
    expect(Math.round(p.y)).toBe(10);
  });
});

describe('resolveRect', () => {
  test('mobile override wins; desktop uses base; cascade through tablet', () => {
    const el = {
      rect: { x: 0, y: 0, width: 1000, height: 10, rotation: 0 },
      responsive: { mobile: { width: 320 } },
    };
    expect(resolveRect(el, 'mobile').width).toBe(320);
    expect(resolveRect(el, 'desktop').width).toBe(1000);
  });

  test('tablet override cascades into mobile when mobile is unset', () => {
    const el = {
      rect: { x: 0, y: 0, width: 1000, height: 10, rotation: 0 },
      responsive: { tablet: { width: 700 } },
    };
    expect(resolveRect(el, 'tablet').width).toBe(700);
    expect(resolveRect(el, 'mobile').width).toBe(700);
  });

  test('ignores non-rect keys (style) in overrides', () => {
    const el = {
      rect: { x: 0, y: 0, width: 100, height: 10, rotation: 0 },
      responsive: { mobile: { width: 50, style: { font: { size: 12 } } } },
    };
    const r = resolveRect(el, 'mobile');
    expect(r.width).toBe(50);
    expect(r.style).toBeUndefined();
  });
});

describe('resolveStyle', () => {
  test('merges a per-breakpoint font override over the base style', () => {
    const el = {
      style: { color: '#111', font: { size: 56, weight: 800 } },
      responsive: { mobile: { style: { font: { size: 34 } } } },
    };
    expect(resolveStyle(el, 'desktop').font.size).toBe(56);
    expect(resolveStyle(el, 'mobile').font.size).toBe(34);
    expect(resolveStyle(el, 'mobile').font.weight).toBe(800); // inherited
    expect(resolveStyle(el, 'mobile').color).toBe('#111'); // inherited
  });
});
