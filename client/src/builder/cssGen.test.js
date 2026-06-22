import { describe, it, expect } from 'vitest';
import { generateCss } from './cssGen.js';

describe('generateCss', () => {
  it('defaults to a class selector (.s-<id>) for the editor', () => {
    const css = generateCss({ a: { base: { color: 'red' } } });
    expect(css).toContain('.s-a { color: red; }');
    expect(css).not.toContain('[data-ws-id');
  });

  it('accepts a custom selector (e.g. export uses .c-<id>)', () => {
    const css = generateCss({ a: { base: { color: 'red' } } }, (id) => `.c-${id}`);
    expect(css).toContain('.c-a { color: red; }');
  });

  it('wraps tablet/mobile declarations in max-width media queries', () => {
    const css = generateCss({ a: { tablet: { color: 'blue' }, mobile: { color: 'green' } } });
    expect(css).toContain('@media (max-width: 768px)');
    expect(css).toContain('@media (max-width: 479px)');
  });

  it('skips empty/null declaration values', () => {
    const css = generateCss({ a: { base: { color: '', width: '10px' } } });
    expect(css).toContain('width: 10px;');
    expect(css).not.toContain('color:');
  });
});
