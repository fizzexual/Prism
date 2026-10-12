import { describe, it, expect, vi, afterEach } from 'vitest';
import { normalize3D, mountScene, SHAPES, MATERIALS, MOTIONS } from './scene3d.js';

describe('normalize3D', () => {
  it('fills defaults', () => {
    expect(normalize3D({})).toEqual({ shape: 'torusKnot', modelSrc: '', material: 'satin', color: '#6366f1', motion: 'orbit', speed: 1, metalness: 0.35, roughness: 0.35 });
  });
  it('maps old projects onto the new keys', () => {
    expect(normalize3D({ autoRotate: false }).motion).toBe('still');
    expect(normalize3D({ wireframe: true }).material).toBe('wire');
    expect(normalize3D({ metalness: 0.9, roughness: 0.1 })).toMatchObject({ material: 'satin', metalness: 0.9, roughness: 0.1 });
  });
  it('accepts uploaded GLB data and https model URLs only', () => {
    expect(normalize3D({ shape: 'model', modelSrc: 'data:model/gltf-binary;base64,Z2xURg==' }).modelSrc).toBe('data:model/gltf-binary;base64,Z2xURg==');
    expect(normalize3D({ shape: 'model', modelSrc: 'https://cdn.example.com/a/duck.glb?v=2' }).modelSrc).toBe('https://cdn.example.com/a/duck.glb?v=2');
    for (const bad of ['javascript:alert(1)', 'http://x.com/a.glb', 'data:text/html;base64,PHNjcmlwdD4=', 'https://x.com/a.glb" onload="x']) {
      expect(normalize3D({ shape: 'model', modelSrc: bad }).modelSrc, bad).toBe('');
    }
  });
  it('a model shape without a valid source falls back to the default shape', () => {
    expect(normalize3D({ shape: 'model', modelSrc: 'nope' }).shape).toBe('torusKnot');
  });
  it('validates colour, shape, material, motion and speed', () => {
    expect(normalize3D({ color: 'var(--pm-primary)' }).color).toBe('var(--pm-primary)');
    expect(normalize3D({ color: 'red;}' }).color).toBe('#6366f1');
    expect(normalize3D({ shape: 'teapot', material: 'lava', motion: 'warp', speed: 99 })).toMatchObject({ shape: 'torusKnot', material: 'satin', motion: 'orbit', speed: 3 });
  });
  it('lists the options the panel offers', () => {
    expect(SHAPES.map((s) => s.key)).toEqual(['torusKnot', 'sphere', 'torus', 'cube', 'cone', 'icosahedron', 'model']);
    expect(MATERIALS.map((m) => m.key)).toEqual(['satin', 'glass', 'chrome', 'clay', 'neon', 'wire']);
    expect(MOTIONS.map((m) => m.key)).toEqual(['orbit', 'mouse', 'scroll', 'float', 'still']);
  });
});

/** A fake three.js that records what the scene engine builds (no WebGL in jsdom). */
function fakeThree() {
  const created = [];
  const vec = () => ({ x: 0, y: 0, z: 0, set(x, y, z) { Object.assign(this, { x, y, z }); }, copy() {}, multiplyScalar() {}, sub() { return this; } });
  const make = (type, args) => {
    const t = { __type: type, args, calls: [], position: vec(), rotation: vec(), scale: vec(), domElement: document.createElement('canvas'), children: [] };
    return new Proxy(t, {
      get(o, k) {
        if (k in o) return o[k];
        if (k === 'then') return undefined;
        return (...a) => { o.calls.push([k, a]); return make(`${type}.${String(k)}`, a); };
      },
      set(o, k, v) { o[k] = v; return true; },
    });
  };
  const THREE = new Proxy({}, { get: (_, name) => function Fake(...args) { const o = make(name, args); created.push(o); return o; } });
  const addons = {
    OrbitControls: function OrbitControls(...args) { const o = make('OrbitControls', args); created.push(o); return o; },
    RoomEnvironment: function RoomEnvironment() { const o = make('RoomEnvironment', []); created.push(o); return o; },
    GLTFLoader: function GLTFLoader() { const o = make('GLTFLoader', []); created.push(o); return o; },
  };
  const of = (type) => created.filter((c) => c.__type === type);
  return { THREE, addons, created, of };
}

// The export inlines mountScene's SOURCE, so test the function rebuilt from its own text.
const rebuilt = new Function(`return (${mountScene.toString()})`)();

function mount(config, el = document.createElement('div')) {
  const f = fakeThree();
  document.body.appendChild(el);
  const handle = rebuilt(f.THREE, f.addons, el, normalize3D(config));
  return { ...f, handle, el };
}

describe('mountScene (rebuilt from source, as in the export)', () => {
  afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

  it('builds the material each preset promises', () => {
    expect(mount({ material: 'glass' }).of('MeshPhysicalMaterial')[0].args[0]).toMatchObject({ transmission: 1 });
    expect(mount({ material: 'chrome' }).of('MeshStandardMaterial')[0].args[0]).toMatchObject({ metalness: 1 });
    expect(mount({ material: 'neon' }).of('MeshStandardMaterial')[0].args[0]).toHaveProperty('emissive');
    expect(mount({ material: 'wire' }).of('MeshBasicMaterial')[0].args[0]).toMatchObject({ wireframe: true });
  });

  it('adds a reflective studio environment', () => {
    expect(mount({}).of('RoomEnvironment')).toHaveLength(1);
  });

  it('resolves a theme colour from the page CSS variables', () => {
    const el = document.createElement('div');
    el.style.setProperty('--pm-primary', '#123456');
    const { of } = mount({ color: 'var(--pm-primary)' }, el);
    expect(of('MeshStandardMaterial')[0].args[0].color).toBe('#123456');
  });

  it('orbit uses drag controls; mouse/scroll listen to the page; still renders once without a loop', () => {
    expect(mount({ motion: 'orbit' }).of('OrbitControls')).toHaveLength(1);
    const add = vi.spyOn(window, 'addEventListener');
    mount({ motion: 'mouse' });
    expect(add.mock.calls.map((c) => c[0])).toContain('pointermove');
    mount({ motion: 'scroll' });
    expect(add.mock.calls.map((c) => c[0])).toContain('scroll');
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const still = mount({ motion: 'still' });
    expect(raf).not.toHaveBeenCalled();
    expect(still.of('WebGLRenderer')[0].calls.some(([k]) => k === 'render')).toBe(true);
  });

  it('loads an uploaded model instead of a primitive', () => {
    const { of } = mount({ shape: 'model', modelSrc: 'data:model/gltf-binary;base64,Z2xURg==' });
    const loader = of('GLTFLoader')[0];
    expect(loader.calls.find(([k]) => k === 'load')[1][0]).toBe('data:model/gltf-binary;base64,Z2xURg==');
    expect(of('TorusKnotGeometry')).toHaveLength(0);
  });

  it('dispose frees the GPU context, listeners and the canvas', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { handle, of, el } = mount({ motion: 'mouse' });
    handle.dispose();
    const r = of('WebGLRenderer')[0];
    expect(r.calls.map(([k]) => k)).toEqual(expect.arrayContaining(['dispose', 'forceContextLoss']));
    expect(remove.mock.calls.map((c) => c[0])).toContain('pointermove');
    expect(el.querySelector('canvas')).toBeNull();
  });
});
