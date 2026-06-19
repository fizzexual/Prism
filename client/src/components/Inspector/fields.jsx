import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

export function Group({ title, children }) {
  return (
    <div className="border-b border-neutral-100 px-3 py-3">
      {title && (
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{title}</div>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function Row({ children }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

const inputCls =
  'w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800 outline-none focus:border-indigo-400';

export function NumberField({ label, value, onChange, testId, step = 1, min }) {
  return (
    <label className="flex items-center gap-1.5">
      {label && <span className="w-7 shrink-0 text-[11px] text-neutral-400">{label}</span>}
      <input
        type="number"
        data-testid={testId}
        value={value ?? ''}
        step={step}
        min={min}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className={inputCls}
      />
    </label>
  );
}

export function TextField({ label, value, onChange, placeholder, testId }) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-[11px] text-neutral-400">{label}</span>}
      <input
        type="text"
        data-testid={testId}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

export function TextArea({ label, value, onChange, testId }) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-[11px] text-neutral-400">{label}</span>}
      <textarea
        data-testid={testId}
        rows={3}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} resize-none`}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options, testId }) {
  return (
    <label className="flex items-center gap-1.5">
      {label && <span className="w-14 shrink-0 text-[11px] text-neutral-400">{label}</span>}
      <select
        data-testid={testId}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function ColorField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const color = value || '#000000';
  return (
    <div className="relative flex items-center gap-2">
      {label && <span className="w-14 shrink-0 text-[11px] text-neutral-400">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-6 w-6 shrink-0 rounded border border-neutral-300"
        style={{ background: color }}
        title="Pick color"
      />
      <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} placeholder="#000000" />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-50 rounded-lg bg-white p-2 shadow-xl ring-1 ring-black/10">
            <HexColorPicker color={color} onChange={onChange} />
          </div>
        </>
      )}
    </div>
  );
}
