/**
 * Pluggable 3D loader registry. Each entry maps a file extension to an async
 * loader that resolves a THREE.Object3D. Loaders are dynamically imported so
 * they code-split and the registry itself stays dependency-light (and easy to
 * test). Add a format by adding one entry here — see docs/adding-3d-models.md.
 */

async function loadGLTF(url) {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

async function loadOBJ(url) {
  const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
  return new Promise((resolve, reject) => {
    new OBJLoader().load(url, resolve, undefined, reject);
  });
}

async function loadFBX(url) {
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  return new Promise((resolve, reject) => {
    new FBXLoader().load(url, resolve, undefined, reject);
  });
}

const loaders = {
  gltf: loadGLTF,
  glb: loadGLTF,
  obj: loadOBJ,
  fbx: loadFBX,
};

export const supportedExtensions = Object.keys(loaders);

export function normalizeExt(ext) {
  return String(ext || '').toLowerCase().replace(/^\./, '');
}

export function extOf(filename = '') {
  const m = String(filename).toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/);
  return m ? m[1] : null;
}

export function getLoader(ext) {
  return loaders[normalizeExt(ext)];
}

export async function loadModel(url, format) {
  const loader = getLoader(format) || getLoader(extOf(url));
  if (!loader) throw new Error(`Unsupported 3D format: ${format || extOf(url) || 'unknown'}`);
  return loader(url);
}
