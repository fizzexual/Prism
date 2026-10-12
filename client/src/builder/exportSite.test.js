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
    // Old props are written as the validated, current config (autoRotate:false -> still, wireframe -> wire).
    expect(config).toMatchObject({ shape: 'torus', color: '#ff0000', motion: 'still', material: 'wire', metalness: 0.2, roughness: 0.6 });
  });

  it('inlines the same scene engine the editor uses, with the studio environment and model loader', () => {
    const html = exportHtml(project({ cube: { component: '3D', props: { material: 'glass', motion: 'mouse' }, children: [] } }));
    expect(html).toContain('const mountScene = ');
    expect(html).toContain('RoomEnvironment');
    expect(html).toContain('GLTFLoader');
    expect(html).toContain('MeshPhysicalMaterial'); // engine source, not a copy
    const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
    const body = script.replace(/^\s*import[^\n]*\n/gm, ''); // imports can't run in a Function body
    expect(() => new Function('THREE', 'OrbitControls', 'RoomEnvironment', 'GLTFLoader', body)).not.toThrow();
  });

  it('writes an uploaded model into the config, and drops unsafe model URLs', () => {
    const ok = exportHtml(project({ m: { component: '3D', props: { shape: 'model', modelSrc: 'data:model/gltf-binary;base64,Z2xURg==' }, children: [] } }));
    expect(ok).toContain('Z2xURg==');
    const bad = exportHtml(project({ m: { component: '3D', props: { shape: 'model', modelSrc: 'javascript:alert(1)' }, children: [] } }));
    expect(bad).not.toContain('javascript:');
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

describe('exportHtml with entrance animations', () => {
  const box = (id, extra = {}) => ({ [id]: { component: 'Box', props: {}, children: [], ...extra } });

  it('marks animated elements and adds the runtime + keyframes once', () => {
    const html = exportHtml(project(box('a', { motion: { preset: 'fade-up', duration: 800, delay: 100 } })));
    expect(html).toMatch(/<div class="c-a" style="--pm-dur:800ms;--pm-delay:100ms;--pm-ease:[^"]+" data-motion="fade-up">/);
    expect(html).toContain('@keyframes pm-fade-up');
    expect(html.match(/classList\.add\('prism-motion'\)/g)).toHaveLength(1); // runtime inlined once
    expect(html.indexOf('IntersectionObserver')).toBeLessThan(html.indexOf('</head>'));
  });

  it('adds nothing to pages without animations', () => {
    const html = exportHtml(project(box('a')));
    expect(html).not.toContain('data-motion');
    expect(html).not.toContain('IntersectionObserver');
    expect(html).not.toContain('@keyframes');
  });

  it('a stagger container animates its children one after another, not itself', () => {
    const p = project({
      ...box('row', { motion: { preset: 'zoom-in', stagger: 100, delay: 50 }, children: ['c1', 'c2', 'c3'] }),
      ...box('c1'), ...box('c2'), ...box('c3'),
    });
    p.instances.root.children = ['row'];
    const html = exportHtml(p);
    expect(html).toMatch(/<div class="c-row">/);
    expect(html).toContain('class="c-c1" style="--pm-dur:600ms;--pm-delay:50ms');
    expect(html).toContain('class="c-c2" style="--pm-dur:600ms;--pm-delay:150ms');
    expect(html).toContain('class="c-c3" style="--pm-dur:600ms;--pm-delay:250ms');
  });

  it('ignores a crafted motion preset', () => {
    const html = exportHtml(project(box('a', { motion: { preset: '"><script>alert(1)</script>' } })));
    expect(html).not.toContain('data-motion');
    expect(html).not.toContain('<script>alert');
  });

  it('a component instance with an animation animates its rendered root', () => {
    const p = project({ inst: { component: 'Instance', props: { componentId: 'C', overrides: {} }, children: [], motion: { preset: 'fade' } } });
    p.components = { C: { id: 'C', name: 'C', rootId: 'm', variables: [] } };
    p.instances.m = { component: 'Box', props: {}, children: [] };
    expect(exportHtml(p)).toMatch(/<div class="c-m" style="--pm-dur[^"]*" data-motion="fade">/);
  });
});

describe('exportHtml with Google Fonts', () => {
  it('links the fonts the page uses, with preconnect', () => {
    const p = project({ h: { component: 'Heading', props: { text: 'Hi' }, children: [] } });
    p.styles = { h: { base: { 'font-family': '"Fraunces", ui-serif, Georgia, serif' } } };
    const html = exportHtml(p);
    expect(html).toContain('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />');
    expect(html).toContain('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700;800&amp;display=swap" />');
    expect(html.indexOf('fonts.googleapis.com')).toBeLessThan(html.indexOf('</head>'));
  });

  it('adds no font links when only system fonts are used', () => {
    const html = exportHtml(project({ h: { component: 'Heading', props: { text: 'Hi' }, children: [] } }));
    expect(html).not.toContain('fonts.googleapis.com');
  });
});

describe('exportHtml with a site theme', () => {
  it('declares the theme variables and loads theme fonts', () => {
    const p = project({ h: { component: 'Heading', props: { text: 'Hi' }, children: [] } });
    p.theme = { colors: { primary: '#ea580c', accent: '#e11d48', ink: '#1c1917', muted: '#78716c', surface: '#fffbf5', dark: '#431407' }, fonts: { heading: 'Fraunces', body: 'DM Sans' }, radius: 18 };
    p.styles = { h: { base: { color: 'var(--pm-primary)', 'font-family': 'var(--pm-font-heading)' } } };
    const html = exportHtml(p);
    expect(html).toContain(':root { --pm-primary: #ea580c;');
    expect(html).toContain('--pm-radius: 18px;');
    expect(html).toContain('.c-h { color: var(--pm-primary); font-family: var(--pm-font-heading); }');
    expect(html).toMatch(/fonts\.googleapis\.com\/css2\?family=Fraunces[^"]*family=DM\+Sans/);
  });

  it('an old project without a theme still exports with the default variables', () => {
    const html = exportHtml(project({ h: { component: 'Heading', props: { text: 'Hi' }, children: [] } }));
    expect(html).toContain('--pm-primary: #4f46e5;');
  });
});
