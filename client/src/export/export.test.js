import { describe, test, expect } from 'vitest';
import { cssGen, htmlGen, threeGen, exportProject } from './index.js';
import { fixturePage, fixtureProject } from '../test/fixtures.js';

describe('cssGen', () => {
  test('emits an absolute rule for an element', () => {
    const css = cssGen(fixturePage);
    expect(css).toMatch(/\.el-h1\s*\{[^}]*position:\s*absolute/);
  });
  test('emits a mobile media query for responsive overrides (position + style)', () => {
    const css = cssGen(fixturePage);
    expect(css).toMatch(/@media \(max-width: 375px\)/);
    expect(css).toMatch(/\.el-h1\s*\{\s*left:10px/);
    expect(css).toMatch(/font-size: 24px/); // responsive font override
  });
});

describe('htmlGen', () => {
  test('maps heading to <h2> with element class', () => {
    expect(htmlGen(fixturePage)).toMatch(/<h2[^>]*class="el-h1"/);
  });
  test('maps a button with href to an anchor', () => {
    expect(htmlGen(fixturePage)).toMatch(/<a[^>]*href="#"[^>]*class="el-btn prism-btn"/);
  });
  test('emits a data-three container for 3D', () => {
    expect(htmlGen(fixturePage)).toMatch(/data-three="cube"/);
  });
});

describe('threeGen', () => {
  test('produces a script with OrbitControls when 3D is present', () => {
    expect(threeGen(fixturePage)).toContain('OrbitControls');
  });
  test('returns null when there is no 3D', () => {
    expect(threeGen({ elements: [{ type: 'text' }] })).toBeNull();
  });
});

describe('exportProject', () => {
  test('produces a non-empty zip blob', async () => {
    const blob = await exportProject(fixtureProject, async () => new ArrayBuffer(8));
    expect(blob).toBeTruthy();
    expect(blob.size).toBeGreaterThan(0);
  });
});
