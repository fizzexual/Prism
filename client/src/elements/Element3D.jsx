import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useModel } from '../three/useModel.js';
import SceneBoundary from '../three/SceneBoundary.jsx';
import { useEditorStore } from '../state/editorStore.js';
import { useDocumentStore } from '../state/documentStore.js';

function applyMaterial(object, material) {
  object.traverse((c) => {
    if (c.isMesh) {
      c.material = new THREE.MeshStandardMaterial({
        color: material.color || '#ffffff',
        metalness: material.metalness ?? 0.1,
        roughness: material.roughness ?? 0.6,
        wireframe: !!material.wireframe,
        transparent: (material.opacity ?? 1) < 1,
        opacity: material.opacity ?? 1,
      });
    }
  });
}

function Lights({ lights = [] }) {
  return lights.map((l, i) => {
    if (l.type === 'ambient') return <ambientLight key={i} intensity={l.intensity} color={l.color} />;
    if (l.type === 'directional')
      return <directionalLight key={i} intensity={l.intensity} color={l.color} position={l.position || [5, 5, 5]} />;
    if (l.type === 'point')
      return <pointLight key={i} intensity={l.intensity} color={l.color} position={l.position || [0, 3, 0]} />;
    return null;
  });
}

function FallbackCube({ material = {} }) {
  return (
    <mesh>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <meshStandardMaterial
        color={material.color || '#9aa6ff'}
        metalness={material.metalness ?? 0.2}
        roughness={material.roughness ?? 0.5}
        wireframe={!!material.wireframe}
      />
    </mesh>
  );
}

function ModelScene({ three, editable, gizmo, onCommit }) {
  const { object } = useModel(three.model?.url, three.model?.format);
  const groupRef = useRef();
  const controlsRef = useRef();

  useEffect(() => {
    if (object && three.material?.enabled) applyMaterial(object, three.material);
  }, [object, three.material]);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return undefined;
    const onUp = () => {
      const g = groupRef.current;
      if (g) {
        onCommit({
          position: g.position.toArray(),
          rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
          scale: g.scale.toArray(),
        });
      }
    };
    c.addEventListener('mouseUp', onUp);
    return () => c.removeEventListener('mouseUp', onUp);
  }, [onCommit, object]);

  const t = three.transform || {};
  const content = (
    <group ref={groupRef} position={t.position || [0, 0, 0]} rotation={t.rotation || [0, 0, 0]} scale={t.scale || [1, 1, 1]}>
      {object ? <primitive object={object} /> : <FallbackCube material={three.material} />}
    </group>
  );

  if (editable) {
    return (
      <TransformControls ref={controlsRef} mode={gizmo} size={0.7}>
        {content}
      </TransformControls>
    );
  }
  return content;
}

/** A 3D viewport element backed by @react-three/fiber. */
export default function Element3D({ element, mode }) {
  const three = element.three || {};
  const selected = useEditorStore((s) => s.selectedIds.includes(element.id));
  const gizmo = useEditorStore((s) => s.gizmo);
  const editable = mode === 'edit' && selected;
  const interactive = mode === 'preview' || selected;
  const cam = three.camera || { fov: 50, position: [3, 2, 4] };

  const onCommit = (transform) => {
    const pageId = useEditorStore.getState().activePageId;
    useDocumentStore.getState().updateElement(pageId, element.id, {
      three: { ...element.three, transform },
    });
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: element.style?.radius || 0,
        overflow: 'hidden',
        background: three.background || '#0b1020',
      }}
    >
      <Canvas
        camera={{ position: cam.position || [3, 2, 4], fov: cam.fov || 50 }}
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        dpr={[1, 1.75]}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          <Lights lights={three.lights} />
          {three.environment && (
            <SceneBoundary fallback={null}>
              <Environment preset={three.environment} />
            </SceneBoundary>
          )}
          <ModelScene three={three} editable={editable} gizmo={gizmo} onCommit={onCommit} />
        </Suspense>
        <OrbitControls makeDefault enabled={interactive} autoRotate={!!three.camera?.autoRotate} autoRotateSpeed={2} enableDamping />
      </Canvas>
    </div>
  );
}
