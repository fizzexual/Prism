import { describe, it, expect } from 'vitest';
import { exportHtml } from './exportSite.js';

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
