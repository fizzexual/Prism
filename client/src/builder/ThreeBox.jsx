import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useBuilder } from './store.js';
import { mountScene, normalize3D } from './scene3d.js';

const ADDONS = { OrbitControls, RoomEnvironment, GLTFLoader };

/**
 * A 3D element on the canvas, rendered by the same engine as the exported site
 * (scene3d.js). In edit mode the host stylesheet sets `canvas { pointer-events: none }`
 * so the element stays selectable; in preview it is interactive.
 */
export default function ThreeBox({ config = {} }) {
  const ref = useRef(null);
  const cfg = normalize3D(config);
  // A 3D colour can be a theme link, so re-render when the theme colours change.
  const themeColors = useBuilder((s) => JSON.stringify(s.project?.theme?.colors || {}));
  const key = JSON.stringify(cfg) + themeColors;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let handle = null;
    // Next tick: the frame's theme CSS (a parent effect) must be applied before colours are read.
    const t = setTimeout(() => { handle = mountScene(THREE, ADDONS, el, cfg); }, 0);
    return () => {
      clearTimeout(t);
      if (handle) handle.dispose();
    };
    // `key` captures every input of the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}
