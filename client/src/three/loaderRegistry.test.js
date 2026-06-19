import { describe, test, expect } from 'vitest';
import { getLoader, supportedExtensions, extOf, normalizeExt } from './loaderRegistry.js';

describe('loaderRegistry', () => {
  test('supports gltf, glb, obj, fbx', () => {
    expect(supportedExtensions).toEqual(expect.arrayContaining(['gltf', 'glb', 'obj', 'fbx']));
  });

  test('getLoader resolves a function for known formats, case/dot-insensitive', () => {
    expect(typeof getLoader('glb')).toBe('function');
    expect(typeof getLoader('.GLB')).toBe('function');
    expect(typeof getLoader('GLTF')).toBe('function');
    expect(getLoader('xyz')).toBeUndefined();
  });

  test('extOf parses the extension from a filename or url', () => {
    expect(extOf('model.GLB')).toBe('glb');
    expect(extOf('/a/b/c.gltf')).toBe('gltf');
    expect(extOf('https://x/y.fbx?token=1')).toBe('fbx');
    expect(extOf('noext')).toBeNull();
  });

  test('normalizeExt strips dots and lowercases', () => {
    expect(normalizeExt('.OBJ')).toBe('obj');
  });
});
