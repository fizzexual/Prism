import { Move, RotateCw, Maximize, Trash2, Plus } from 'lucide-react';
import { Group, Row, NumberField, ColorField, ToggleField, SelectField } from './fields.jsx';
import UploadButton from './UploadButton.jsx';
import { extOf, supportedExtensions } from '../../three/loaderRegistry.js';
import { useEditorStore } from '../../state/editorStore.js';

const inputCls =
  'w-full rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-800 outline-none focus:border-indigo-400';

const rad2deg = (r) => Math.round((r * 180) / Math.PI);
const deg2rad = (d) => (d * Math.PI) / 180;

const ENV_PRESETS = ['none', 'city', 'sunset', 'dawn', 'night', 'warehouse', 'studio', 'apartment', 'park', 'lobby', 'forest'];

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.05 }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-neutral-400">
        <span>{label}</span>
        <span className="tabular-nums">{Number(value ?? 0).toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function Vec3({ label, value = [0, 0, 0], onChange, step = 0.1 }) {
  return (
    <div>
      <span className="text-[11px] text-neutral-400">{label}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            type="number"
            step={step}
            value={Number((value[i] ?? 0).toFixed ? Number(value[i]).toFixed(2) : value[i])}
            onChange={(e) => {
              const v = [...value];
              v[i] = Number(e.target.value);
              onChange(v);
            }}
            className={inputCls}
          />
        ))}
      </div>
    </div>
  );
}

export function ThreeGroups({ el, ctx }) {
  const three = el.three;
  const gizmo = useEditorStore((s) => s.gizmo);
  if (!three) return null;

  const setThree = (patch) => ctx.update({ three: { ...three, ...patch } });
  const setModel = (p) => setThree({ model: { ...three.model, ...p } });
  const setTransform = (p) => setThree({ transform: { ...three.transform, ...p } });
  const setMaterial = (p) => setThree({ material: { ...three.material, ...p } });
  const setCamera = (p) => setThree({ camera: { ...three.camera, ...p } });
  const setLights = (lights) => setThree({ lights });

  const updateLight = (i, patch) => setLights(three.lights.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const removeLight = (i) => setLights(three.lights.filter((_, j) => j !== i));
  const addLight = (type) =>
    setLights([
      ...three.lights,
      type === 'ambient'
        ? { type: 'ambient', intensity: 0.5, color: '#ffffff' }
        : { type, intensity: 1, color: '#ffffff', position: [3, 4, 3] },
    ]);

  const t = three.transform || {};
  const m = three.material || {};
  const cam = three.camera || {};

  return (
    <>
      <Group title="3D Model">
        <div className="text-[11px] text-neutral-500">
          {three.model?.url ? `Loaded · ${three.model.format || ''}` : 'No model — showing a placeholder cube.'}
        </div>
        <UploadButton
          accept={supportedExtensions.map((e) => `.${e}`).join(',')}
          label="Upload model (GLTF/GLB/OBJ/FBX)"
          onUpload={(url, meta) => setModel({ url, format: extOf(meta.filename), assetId: null })}
        />
        {three.model?.url && (
          <button onClick={() => setModel({ url: null, format: null })} className="text-left text-[11px] text-red-500 hover:underline">
            Remove model
          </button>
        )}
      </Group>

      <Group title="Transform">
        <div className="flex gap-1">
          {[
            ['translate', Move],
            ['rotate', RotateCw],
            ['scale', Maximize],
          ].map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => useEditorStore.getState().setGizmo(mode)}
              title={mode}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[11px] capitalize ${
                gizmo === mode ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-neutral-200 text-neutral-500'
              }`}
            >
              <Icon size={12} /> {mode}
            </button>
          ))}
        </div>
        <Vec3 label="Position" value={t.position} onChange={(v) => setTransform({ position: v })} step={0.1} />
        <Vec3 label="Rotation (°)" value={(t.rotation || [0, 0, 0]).map(rad2deg)} onChange={(v) => setTransform({ rotation: v.map(deg2rad) })} step={5} />
        <Vec3 label="Scale" value={t.scale} onChange={(v) => setTransform({ scale: v })} step={0.1} />
        <p className="text-[10px] text-neutral-400">Tip: select the object and drag the gizmo in the canvas.</p>
      </Group>

      <Group title="Material">
        <ToggleField label="Override model material" checked={m.enabled} onChange={(v) => setMaterial({ enabled: v })} />
        <ColorField label="Color" value={m.color} onChange={(v) => setMaterial({ color: v })} />
        <Slider label="Metalness" value={m.metalness} onChange={(v) => setMaterial({ metalness: v })} />
        <Slider label="Roughness" value={m.roughness} onChange={(v) => setMaterial({ roughness: v })} />
        <Slider label="Opacity" value={m.opacity ?? 1} onChange={(v) => setMaterial({ opacity: v })} />
        <ToggleField label="Wireframe" checked={m.wireframe} onChange={(v) => setMaterial({ wireframe: v })} />
      </Group>

      <Group title="Lighting">
        {three.lights.map((l, i) => (
          <div key={i} className="rounded-md border border-neutral-200 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium capitalize text-neutral-600">{l.type}</span>
              <button onClick={() => removeLight(i)} className="text-neutral-300 hover:text-red-500">
                <Trash2 size={12} />
              </button>
            </div>
            <Slider label="Intensity" value={l.intensity} max={5} step={0.1} onChange={(v) => updateLight(i, { intensity: v })} />
            <ColorField value={l.color} onChange={(v) => updateLight(i, { color: v })} />
            {l.type !== 'ambient' && <Vec3 label="Position" value={l.position} onChange={(v) => updateLight(i, { position: v })} step={0.5} />}
          </div>
        ))}
        <div className="flex gap-1">
          {['ambient', 'directional', 'point'].map((tp) => (
            <button key={tp} onClick={() => addLight(tp)} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-neutral-200 px-1 py-1 text-[10px] capitalize text-neutral-500 hover:border-indigo-400">
              <Plus size={10} /> {tp}
            </button>
          ))}
        </div>
        <SelectField
          label="Env"
          value={three.environment || 'none'}
          onChange={(v) => setThree({ environment: v === 'none' ? null : v })}
          options={ENV_PRESETS.map((p) => ({ value: p, label: p }))}
        />
      </Group>

      <Group title="Camera">
        <NumberField label="FOV" value={cam.fov} onChange={(v) => setCamera({ fov: v })} />
        <ToggleField label="Auto-rotate" checked={cam.autoRotate} onChange={(v) => setCamera({ autoRotate: v })} />
        <ToggleField label="Orbit controls" checked={cam.orbit !== false} onChange={(v) => setCamera({ orbit: v })} />
      </Group>
    </>
  );
}
