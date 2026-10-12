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

describe('generateCss safety (user-controlled values must not escape the rule or the <style> element)', () => {
  it('a value cannot close the <style> element', () => {
    const css = generateCss({ a: { base: { 'line-height': 'red; } </style><script>alert(1)</script><style>' } } });
    expect(css).not.toMatch(/<\/style/i);
    expect(css).not.toContain('<script>');
  });

  it('a value cannot close the rule and start a new one', () => {
    const css = generateCss({ a: { base: { color: 'red } body { display:none' } } });
    expect(css.match(/\{/g).length).toBe(1);
    expect(css.match(/\}/g).length).toBe(1);
  });

  it('drops property names that are not plain CSS identifiers', () => {
    const css = generateCss({ a: { base: { 'x}</style><img src=x onerror=alert(2)>{': '1', color: 'red' } } });
    expect(css).not.toContain('onerror');
    expect(css).toContain('color: red;');
  });

  it('keeps ordinary values intact (quotes, url(), data URLs, custom properties)', () => {
    const css = generateCss({ a: { base: {
      'font-family': '"Inter", sans-serif',
      'background-image': 'url("data:image/png;base64,iVBOR==")',
      '--brand': '#4f46e5',
    } } });
    expect(css).toContain('font-family: "Inter", sans-serif;');
    expect(css).toContain('background-image: url("data:image/png;base64,iVBOR==");');
    expect(css).toContain('--brand: #4f46e5;');
  });
});
