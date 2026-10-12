import { describe, it, expect } from 'vitest';
import { effectiveStyle } from './styleUtils.js';
import { HOVER_PRESETS, PRESSED_PRESETS, presetBatch, stateEditKey, hasState } from './stateStyles.js';

describe('effectiveStyle with a state', () => {
  const perId = { base: { color: 'black', scale: '1' }, mobile: { color: 'blue' }, hover: { color: 'red' }, pressed: { scale: '0.97' } };
  it('normal ignores states', () => {
    expect(effectiveStyle(perId, 'base')).toEqual({ color: 'black', scale: '1' });
  });
  it('hover = current breakpoint + hover', () => {
    expect(effectiveStyle(perId, 'mobile', 'hover')).toEqual({ color: 'red', scale: '1' });
  });
  it('pressed = current breakpoint + hover + pressed', () => {
    expect(effectiveStyle(perId, 'base', 'pressed')).toEqual({ color: 'red', scale: '0.97' });
  });
});

describe('state helpers', () => {
  it('stateEditKey writes to the breakpoint in Normal, else to the state', () => {
    expect(stateEditKey('tablet', 'normal')).toBe('tablet');
    expect(stateEditKey('tablet', 'hover')).toBe('hover');
    expect(stateEditKey('base', 'pressed')).toBe('pressed');
  });
  it('hasState tells whether a state has any styles', () => {
    expect(hasState({ hover: { color: 'red' } }, 'hover')).toBe(true);
    expect(hasState({ hover: {} }, 'hover')).toBe(false);
    expect(hasState(undefined, 'pressed')).toBe(false);
  });
  it('offers hover and pressed presets', () => {
    expect(HOVER_PRESETS.map((p) => p.key)).toEqual(['none', 'lift', 'grow', 'glow', 'dim']);
    expect(PRESSED_PRESETS.map((p) => p.key)).toEqual(['none', 'press', 'sink']);
  });
});

describe('presetBatch', () => {
  it('replaces the state styles (clearing old ones) and sets a default timing in base', () => {
    const perId = { base: { color: 'black' }, hover: { color: 'red' } };
    const batch = presetBatch('a', perId, 'hover', 'grow');
    expect(batch).toEqual([
      { id: 'a', breakpoint: 'hover', decls: { color: '', scale: '1.05' } },
      { id: 'a', breakpoint: 'base', decls: { 'transition-duration': '200ms', 'transition-timing-function': 'ease' } },
    ]);
  });
  it('keeps an existing timing', () => {
    const batch = presetBatch('a', { base: { 'transition-duration': '400ms' } }, 'hover', 'dim');
    expect(batch).toHaveLength(1);
    expect(batch[0].decls).toEqual({ opacity: '0.85' });
  });
  it('none clears the state', () => {
    const batch = presetBatch('a', { hover: { color: 'red', scale: '1.05' } }, 'hover', 'none');
    expect(batch).toEqual([{ id: 'a', breakpoint: 'hover', decls: { color: '', scale: '' } }]);
  });
});
