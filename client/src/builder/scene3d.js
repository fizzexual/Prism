/**
 * Prism's 3D engine — one scene used by the editor AND the exported site.
 * Spec: docs/superpowers/specs/2026-10-13-3d-signature-design.md
 *
 * `mountScene` must stay self-contained (only its parameters and browser globals):
 * the export inlines `mountScene.toString()` and calls it with three.js from the CDN.
 */

export const SHAPES = [
  { key: 'torusKnot', label: 'Knot' },
  { key: 'sphere', label: 'Sphere' },
  { key: 'torus', label: 'Ring' },
  { key: 'cube', label: 'Cube' },
  { key: 'cone', label: 'Cone' },
  { key: 'icosahedron', label: 'Gem' },
  { key: 'model', label: 'Your model' },
];
export const MATERIALS = [
  { key: 'satin', label: 'Satin' },
  { key: 'glass', label: 'Glass' },
  { key: 'chrome', label: 'Chrome' },
  { key: 'clay', label: 'Clay' },
  { key: 'neon', label: 'Neon' },
  { key: 'wire', label: 'Wire' },
];
export const MOTIONS = [
  { key: 'orbit', label: 'Drag & spin' },
  { key: 'mouse', label: 'Follow mouse' },
  { key: 'scroll', label: 'Scroll to rotate' },
  { key: 'float', label: 'Float' },
  { key: 'still', label: 'Still' },
];

export const MAX_MODEL_BYTES = 8 * 1024 * 1024;

const has = (list, key) => list.some((x) => x.key === key);
const HEX = /^#[0-9a-f]{6}$/i;
const THEME_COLOR = /^var\(--pm-(primary|accent|ink|muted|surface|dark)\)$/;
const GLB_DATA = /^data:(model\/gltf-binary|application\/octet-stream);base64,[A-Za-z0-9+/]+=*$/;
const MODEL_URL = /^https:\/\/[^\s"'<>()\\]+\.(glb|gltf)(\?[^\s"'<>()\\]*)?$/i;
const clamp = (v, lo, hi, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
};

/** Validate a 3D element's props (and map old projects onto the current keys). */
export function normalize3D(p = {}) {
  const modelSrc = typeof p.modelSrc === 'string' && (GLB_DATA.test(p.modelSrc) || MODEL_URL.test(p.modelSrc)) ? p.modelSrc : '';
  const shape = has(SHAPES, p.shape) && (p.shape !== 'model' || modelSrc) ? p.shape : 'torusKnot';
  return {
    shape,
    modelSrc,
    material: has(MATERIALS, p.material) ? p.material : p.wireframe ? 'wire' : 'satin',
    color: typeof p.color === 'string' && (HEX.test(p.color) || THEME_COLOR.test(p.color)) ? p.color : '#6366f1',
    motion: has(MOTIONS, p.motion) ? p.motion : p.autoRotate === false ? 'still' : 'orbit',
    speed: Math.round(clamp(p.speed, 0.2, 3, 1) * 10) / 10,
    metalness: clamp(p.metalness, 0, 1, 0.35),
    roughness: clamp(p.roughness, 0, 1, 0.35),
  };
}

/**
 * Mount a 3D scene into `el`. `THREE` is three.js, `addons` = { OrbitControls,
 * RoomEnvironment, GLTFLoader }, `cfg` = normalize3D(props). Returns { dispose }.
 */
export function mountScene(THREE, addons, el, cfg) {
  const win = el.ownerDocument.defaultView || window;
  const reduced = Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const resolveColor = (c) => {
    const m = /^var\((--pm-[a-z]+)\)$/.exec(c || '');
    if (!m) return c;
    return win.getComputedStyle(el).getPropertyValue(m[1]).trim() || '#6366f1';
  };

  const w = el.clientWidth || 320;
  const h = el.clientHeight || 280;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.display = 'block';
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Procedural studio lighting for reflections (glass, chrome) — no HDR download.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new addons.RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 6, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0.6, 6);

  const color = resolveColor(cfg.color);
  const makeMaterial = () => {
    switch (cfg.material) {
      case 'glass': return new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.05, transmission: 1, thickness: 1.2, ior: 1.45, clearcoat: 1, clearcoatRoughness: 0.05 });
      case 'chrome': return new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.08 });
      case 'clay': return new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.95 });
      case 'neon': return new THREE.MeshStandardMaterial({ color: '#111111', emissive: color, emissiveIntensity: 1.8, roughness: 0.4 });
      case 'wire': return new THREE.MeshBasicMaterial({ color, wireframe: true });
      default: return new THREE.MeshStandardMaterial({ color, metalness: cfg.metalness, roughness: cfg.roughness });
    }
  };
  const makeGeometry = () => {
    switch (cfg.shape) {
      case 'sphere': return new THREE.SphereGeometry(1.4, 64, 64);
      case 'torus': return new THREE.TorusGeometry(1.1, 0.42, 48, 128);
      case 'cube': return new THREE.BoxGeometry(1.9, 1.9, 1.9);
      case 'cone': return new THREE.ConeGeometry(1.3, 2.2, 64);
      case 'icosahedron': return new THREE.IcosahedronGeometry(1.5, 0);
      default: return new THREE.TorusKnotGeometry(1, 0.34, 220, 32);
    }
  };

  const pivot = new THREE.Group();
  scene.add(pivot);
  const owned = [];
  let disposed = false;
  const renderOnce = () => { if (!disposed) renderer.render(scene, camera); };

  if (cfg.shape === 'model' && cfg.modelSrc) {
    new addons.GLTFLoader().load(cfg.modelSrc, (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const s = 3 / (Math.max(size.x, size.y, size.z) || 1);
      model.scale.set(s, s, s);
      model.position.set(-center.x * s, -center.y * s, -center.z * s);
      model.traverse((o) => {
        if (o.geometry) owned.push(o.geometry);
        if (o.material) owned.push(...[].concat(o.material));
      });
      pivot.add(model);
      renderOnce();
    }, undefined, () => {});
  } else {
    const geometry = makeGeometry();
    const material = makeMaterial();
    owned.push(geometry, material);
    pivot.add(new THREE.Mesh(geometry, material));
  }

  const motion = cfg.motion;
  const speed = cfg.speed || 1;
  let controls = null;
  if (motion === 'orbit') {
    controls = new addons.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 2 * speed;
  }

  // mouse: tilt toward the cursor; scroll: rotate as the element passes through the viewport.
  const target = { x: 0, y: 0 };
  const onPointer = (e) => {
    target.y = (e.clientX / (win.innerWidth || 1) - 0.5) * 1.2 * speed;
    target.x = (e.clientY / (win.innerHeight || 1) - 0.5) * 0.8 * speed;
  };
  const onScroll = () => {
    const r = el.getBoundingClientRect();
    const vh = win.innerHeight || 1;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    target.y = p * Math.PI * 2 * speed;
    target.x = (p - 0.5) * 0.6;
  };
  if (!reduced && motion === 'mouse') win.addEventListener('pointermove', onPointer);
  if (!reduced && motion === 'scroll') { win.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  // Rendering pauses while the element is off-screen.
  let visible = true;
  const io = win.IntersectionObserver ? new win.IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }) : null;
  if (io) io.observe(el);

  const animated = motion !== 'still' && !(reduced && motion !== 'orbit');
  let raf = 0;
  const t0 = win.performance.now();
  const frame = () => {
    raf = win.requestAnimationFrame(frame);
    if (!visible) return;
    const t = (win.performance.now() - t0) / 1000;
    if (motion === 'mouse' || motion === 'scroll') {
      pivot.rotation.x += (target.x - pivot.rotation.x) * 0.08;
      pivot.rotation.y += (target.y - pivot.rotation.y) * 0.08;
    } else if (motion === 'float') {
      pivot.position.y = Math.sin(t * 1.2 * speed) * 0.18;
      pivot.rotation.y = t * 0.35 * speed;
      pivot.rotation.x = Math.sin(t * 0.6 * speed) * 0.15;
    }
    if (controls) controls.update();
    renderer.render(scene, camera);
  };
  if (animated) frame(); else renderOnce();

  const ro = win.ResizeObserver ? new win.ResizeObserver(() => {
    const W = el.clientWidth;
    const H = el.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    if (!animated) renderOnce();
  }) : null;
  if (ro) ro.observe(el);

  return {
    dispose() {
      disposed = true;
      win.cancelAnimationFrame(raf);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      win.removeEventListener('pointermove', onPointer);
      win.removeEventListener('scroll', onScroll);
      if (controls) controls.dispose();
      owned.forEach((o) => o.dispose && o.dispose());
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
