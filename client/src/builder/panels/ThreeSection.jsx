import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useBuilder } from '../store.js';
import { Section, Field, ColorField, TextField, Slider } from '../controls.jsx';
import { SHAPES, MATERIALS, MOTIONS, MAX_MODEL_BYTES, normalize3D, glbDataUrl } from '../scene3d.js';

const grid = 'grid gap-1';
const chip = (active) =>
  `rounded-md border px-1 py-1.5 text-[11px] ${active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-neutral-200 text-neutral-600 hover:border-indigo-300'}`;

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

/** Everything about a 3D element: shape (or your own .glb), material, colour, motion, speed. */
export default function ThreeSection({ inst }) {
  const cfg = normalize3D(inst.props);
  const set = (prop, value) => useBuilder.getState().setProp(inst.id, prop, value);
  const [error, setError] = useState('');
  const [url, setUrl] = useState(inst.props.modelSrc?.startsWith('https://') ? inst.props.modelSrc : '');

  const upload = async (file) => {
    setError('');
    if (!file) return;
    if (file.size > MAX_MODEL_BYTES) { setError(`That model is ${(file.size / 1048576).toFixed(1)} MB; the limit is 8 MB.`); return; }
    const src = glbDataUrl(await readAsDataUrl(file));
    if (!src) { setError('That file is not a .glb model.'); return; }
    set('modelSrc', src);
    set('shape', 'model');
  };
  const useUrl = (value) => {
    setUrl(value);
    if (!value) return;
    if (normalize3D({ shape: 'model', modelSrc: value }).modelSrc) { setError(''); set('modelSrc', value); set('shape', 'model'); }
    else setError('Use an https:// link ending in .glb or .gltf.');
  };

  return (
    <Section title="3D Object">
      <div className={grid} style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {SHAPES.filter((s) => s.key !== 'model').map((s) => (
          <button key={s.key} aria-pressed={cfg.shape === s.key} onClick={() => set('shape', s.key)} className={chip(cfg.shape === s.key)}>{s.label}</button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-neutral-300 p-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-600">Your model</span>
          {cfg.shape === 'model' && <span className="rounded-sm bg-indigo-50 px-1.5 text-[10px] text-indigo-700">in use</span>}
        </div>
        <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-neutral-200 px-2 py-1.5 text-xs text-neutral-600 hover:border-indigo-400 hover:text-indigo-600">
          <Upload size={12} /> Upload .glb (max 8 MB)
          <input type="file" accept=".glb,model/gltf-binary" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <TextField value={url} onChange={useUrl} placeholder="or paste https://….glb" />
        {cfg.shape === 'model' && cfg.modelSrc.startsWith('data:') && (
          <p className="text-[10px] text-neutral-400">Embedded in the project ({Math.round((cfg.modelSrc.length * 3) / 4 / 1024)} KB).</p>
        )}
        {error && <p role="alert" className="text-[10px] text-red-600">{error}</p>}
      </div>

      <div>
        <div className="mb-1 text-[11px] text-neutral-400">Material{cfg.shape === 'model' ? ' (models keep their own)' : ''}</div>
        <div className={grid} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {MATERIALS.map((m) => (
            <button key={m.key} disabled={cfg.shape === 'model'} aria-pressed={cfg.material === m.key} onClick={() => set('material', m.key)} className={`${chip(cfg.material === m.key)} disabled:opacity-40`}>{m.label}</button>
          ))}
        </div>
      </div>

      {cfg.shape !== 'model' && <Field label="Color"><ColorField value={cfg.color} onChange={(v) => set('color', v)} /></Field>}

      <div>
        <div className="mb-1 text-[11px] text-neutral-400">Motion</div>
        <div className={grid} style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {MOTIONS.map((m) => (
            <button key={m.key} aria-pressed={cfg.motion === m.key} onClick={() => set('motion', m.key)} className={chip(cfg.motion === m.key)}>{m.label}</button>
          ))}
        </div>
      </div>
      {cfg.motion !== 'still' && (
        <Field label="Speed"><Slider value={cfg.speed} min={0.2} max={3} step={0.1} onChange={(n) => set('speed', n)} suffix="×" /></Field>
      )}
      <p className="text-[10px] leading-relaxed text-neutral-400">Pauses while off-screen; visitors who prefer reduced motion see it still.</p>
    </Section>
  );
}
