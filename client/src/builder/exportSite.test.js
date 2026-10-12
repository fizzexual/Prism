import { describe, it, expect } from 'vitest';
import { exportHtml, pageFileNames } from './exportSite.js';

const project = (children) => ({
  name: 'My Site',
  pages: [{ name: 'Home', rootId: 'root' }],
  styles: {},
  components: {},
  instances: {
    root: { component: 'Box', props: {}, children: Object.keys(children) },
    ...children,
  },
});

describe('exportHtml with 3D objects', () => {
  it('writes the 3D settings onto the element so the exported page can render it', () => {
    const html = exportHtml(project({
      cube: { component: '3D', props: { shape: 'torus', color: '#ff0000', autoRotate: false, metalness: 0.2, roughness: 0.6, wireframe: true }, children: [] },
    }));
    const m = html.match(/data-prism-3d="([^"]*)"/);
    expect(m).not.toBeNull();
    const config = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    expect(config).toMatchObject({ shape: 'torus', color: '#ff0000', autoRotate: false, metalness: 0.2, roughness: 0.6, wireframe: true });
  });

  it('adds a Three.js renderer (same version as the editor) when the page has a 3D object', () => {
    const html = exportHtml(project({ cube: { component: '3D', props: { shape: 'box' }, children: [] } }));
    expect(html).toContain('three@0.169.0');
    expect(html).toContain('OrbitControls');
    expect(html).toContain('[data-prism-3d]');
  });

  it('adds no script to pages without 3D objects', () => {
    const html = exportHtml(project({ t: { component: 'Text', props: { text: 'Hi' }, children: [] } }));
    expect(html).not.toContain('<script');
    expect(html).toContain('Hi');
  });

  it('escapes settings so a crafted color cannot break out of the attribute', () => {
    const html = exportHtml(project({ cube: { component: '3D', props: { color: '"><script>alert(1)</script>' }, children: [] } }));
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});

describe('exportHtml safety and fidelity', () => {
  it('neutralises javascript: and data: link URLs', () => {
    for (const href of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x']) {
      const html = exportHtml(project({ l: { component: 'Link', props: { text: 'x', href }, children: [] } }));
      expect(html, href).toContain('href="#"');
    }
  });

  it('keeps normal link URLs', () => {
    for (const href of ['https://example.com/a?b=1&c=2', 'mailto:a@b.co', 'tel:+359888', '#pricing', '/about.html', 'about.html']) {
      const html = exportHtml(project({ l: { component: 'Link', props: { text: 'x', href }, children: [] } }));
      expect(html, href).toContain(`href="${href.replace(/&/g, '&amp;')}"`);
    }
  });

  it('exports Input/Textarea with their placeholder and Input as a void element', () => {
    const html = exportHtml(project({
      inp: { component: 'Input', props: { placeholder: 'Your email' }, children: [] },
      ta: { component: 'Textarea', props: { placeholder: 'Message "here"' }, children: [] },
    }));
    expect(html).toMatch(/<input class="c-inp" placeholder="Your email" \/>/);
    expect(html).not.toContain('</input>');
    expect(html).toContain('<textarea class="c-ta" placeholder="Message &quot;here&quot;"></textarea>');
  });

  it('exports Icon as an inline SVG instead of an empty span', () => {
    const html = exportHtml(project({ ic: { component: 'Icon', props: { iconName: 'Heart' }, children: [] } }));
    expect(html).toMatch(/<span class="c-ic"[^>]*><svg[^>]*>.*<\/svg><\/span>/s);
  });

  it('does not recurse forever when a component contains an instance of itself', () => {
    const p = project({ inst: { component: 'Instance', props: { componentId: 'A', overrides: {} }, children: [] } });
    p.components = { A: { id: 'A', name: 'A', rootId: 'm', variables: [] } };
    p.instances.m = { component: 'Box', props: {}, children: ['self'] };
    p.instances.self = { component: 'Instance', props: { componentId: 'A', overrides: {} }, children: [] };
    expect(() => exportHtml(p)).not.toThrow();
  });
});

describe('pageFileNames', () => {
  it('gives every page a unique file, home is index.html', () => {
    const names = pageFileNames([{ name: 'Home' }, { name: 'About' }, { name: 'about!' }, { name: 'Index' }, { name: '!!!' }, { name: 'Контакти' }]);
    expect(names[0]).toBe('index.html');
    expect(new Set(names).size).toBe(names.length);
    expect(names[1]).toBe('about.html');
  });
});

describe('exportHtml with hover/pressed states', () => {
  it('exports hover and pressed rules with the export class', () => {
    const p = project({ b: { component: 'Button', props: { text: 'Go' }, children: [] } });
    p.styles = { b: { base: { color: 'white' }, hover: { scale: '1.05' }, pressed: { scale: '0.97' } } };
    const html = exportHtml(p);
    expect(html).toContain('.c-b:hover { scale: 1.05; }');
    expect(html).toContain('.c-b:active { scale: 0.97; }');
    expect(html).toContain('transition-property: scale;');
    expect(html).not.toContain('data-ws-state');
  });
});
