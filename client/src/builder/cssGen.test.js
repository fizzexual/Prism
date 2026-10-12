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

describe('hover / pressed states', () => {
  const styles = { a: { base: { color: 'black' }, hover: { color: 'red', scale: '1.05' }, pressed: { scale: '0.97' } } };

  it('puts hover inside @media (hover: hover) and pressed as :active after it', () => {
    const css = generateCss(styles);
    expect(css).toMatch(/@media \(hover: hover\) \{\s*\.s-a:hover \{ color: red; scale: 1\.05; \}\s*\}/);
    expect(css).toContain('.s-a:active { scale: 0.97; }');
    expect(css.indexOf(':active')).toBeGreaterThan(css.indexOf(':hover'));
  });

  it('animates exactly the properties that change, with a default timing', () => {
    const css = generateCss(styles);
    expect(css).toMatch(/\.s-a \{ color: black; transition-property: color, scale; transition-duration: 200ms; transition-timing-function: ease; \}/);
  });

  it('keeps an explicit timing and an explicit transition', () => {
    const t = generateCss({ a: { base: { 'transition-duration': '400ms' }, hover: { opacity: '0.8' } } });
    expect(t).toContain('transition-duration: 400ms;');
    expect(t).not.toContain('200ms');
    const full = generateCss({ a: { base: { transition: 'opacity 1s' }, hover: { opacity: '0.8' } } });
    expect(full).not.toContain('transition-property');
  });

  it('adds no transition to elements without states', () => {
    expect(generateCss({ a: { base: { color: 'red' } } })).not.toContain('transition');
  });

  it('editor preview also matches a forced data-ws-state attribute', () => {
    const css = generateCss(styles, undefined, { preview: true });
    expect(css).toContain('.s-a[data-ws-state~="hover"] { color: red; scale: 1.05; }');
    expect(css).toContain('.s-a[data-ws-state~="pressed"] { scale: 0.97; }');
    expect(generateCss(styles)).not.toContain('data-ws-state');
  });

  it('state values are sanitised like any other', () => {
    const css = generateCss({ a: { hover: { color: 'red}</style><script>x</script>' } } });
    expect(css).not.toMatch(/<\/style/i);
  });
});
