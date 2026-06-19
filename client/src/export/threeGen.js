/**
 * Generate a standalone ES-module script that rebuilds every 3D scene on the
 * page from serialized config, loading three.js from a CDN (via importmap in
 * the HTML). Returns null when there are no 3D elements.
 */
export function threeGen(page) {
  const scenes = page.elements
    .filter((el) => el.type === '3d')
    .map((el) => ({ id: el.id, three: el.three }));
  if (!scenes.length) return null;

  return `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const SCENES = ${JSON.stringify(scenes, null, 2)};

function load(format, url, cb) {
  const f = (format || '').toLowerCase();
  if (f === 'gltf' || f === 'glb') new GLTFLoader().load(url, (g) => cb(g.scene));
  else if (f === 'obj') new OBJLoader().load(url, cb);
  else if (f === 'fbx') new FBXLoader().load(url, cb);
}

SCENES.forEach((cfg) => {
  const el = document.querySelector('[data-three="' + cfg.id + '"]');
  if (!el) return;
  const three = cfg.three || {};
  const cam = three.camera || {};
  let w = el.clientWidth || 360, h = el.clientHeight || 300;

  const scene = new THREE.Scene();
  if (three.background) scene.background = new THREE.Color(three.background);

  const camera = new THREE.PerspectiveCamera(cam.fov || 50, w / h, 0.1, 1000);
  camera.position.set(...(cam.position || [3, 2, 4]));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  (three.lights || []).forEach((l) => {
    let light;
    if (l.type === 'ambient') light = new THREE.AmbientLight(l.color, l.intensity);
    else if (l.type === 'directional') { light = new THREE.DirectionalLight(l.color, l.intensity); light.position.set(...(l.position || [5, 5, 5])); }
    else { light = new THREE.PointLight(l.color, l.intensity); light.position.set(...(l.position || [0, 3, 0])); }
    scene.add(light);
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = !!cam.autoRotate;
  if (cam.orbit === false) controls.enableRotate = false;

  const t = three.transform || {};
  const group = new THREE.Group();
  group.position.set(...(t.position || [0, 0, 0]));
  group.rotation.set(...(t.rotation || [0, 0, 0]));
  group.scale.set(...(t.scale || [1, 1, 1]));
  scene.add(group);

  function place(obj) {
    const m = three.material;
    if (m && m.enabled) {
      obj.traverse((c) => {
        if (c.isMesh) c.material = new THREE.MeshStandardMaterial({
          color: m.color, metalness: m.metalness, roughness: m.roughness,
          wireframe: m.wireframe, transparent: (m.opacity ?? 1) < 1, opacity: m.opacity ?? 1,
        });
      });
    }
    group.add(obj);
  }

  if (three.model && three.model.url) {
    load(three.model.format, three.model.url, place);
  } else {
    place(new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.MeshStandardMaterial({ color: (three.material && three.material.color) || '#9aa6ff' }),
    ));
  }

  function resize() {
    w = el.clientWidth; h = el.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  (function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();
});
`;
}
