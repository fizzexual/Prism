import { useBuilder, useUI } from '../store.js';
import { Section, Field, SelectField } from '../controls.jsx';
import { STYLE_STATES, presetsFor, presetBatch, activePreset, hasState, DURATIONS, EASINGS, DEFAULT_TRANSITION } from '../stateStyles.js';

/** Normal / Hover / Pressed switch. A dot marks states that already have styles. */
export function StateSwitch({ perId }) {
  const state = useUI((s) => s.styleState);
  return (
    <div className="mx-3 mt-2 flex gap-0.5 rounded-md bg-neutral-100 p-0.5" role="tablist" aria-label="Style state">
      {STYLE_STATES.map((s) => {
        const active = state === s.key;
        return (
          <button
            key={s.key}
            role="tab"
            aria-selected={active}
            onClick={() => useUI.getState().setStyleState(s.key)}
            className={`flex flex-1 items-center justify-center gap-1 rounded px-1.5 py-1 text-[11px] ${
              active ? 'bg-white font-medium text-indigo-600 shadow-xs' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {s.label}
            {s.key !== 'normal' && hasState(perId, s.key) && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-label="has styles" />}
          </button>
        );
      })}
    </div>
  );
}

/** One-click presets + transition timing for the hover/pressed state being edited. */
export function StateEffects({ id, perId, state }) {
  const presets = presetsFor(state);
  const current = activePreset(perId, state);
  const base = perId.base || {};
  const apply = (key) => useBuilder.getState().setStylesBatch(presetBatch(id, perId, state, key));
  const setBase = (prop, value) => useBuilder.getState().setStyle(id, 'base', prop, value);

  return (
    <Section title={state === 'pressed' ? 'Pressed effect' : 'Hover effect'}>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${presets.length}, minmax(0, 1fr))` }}>
        {presets.map((p) => (
          <button
            key={p.key}
            aria-pressed={current === p.key}
            onClick={() => apply(p.key)}
            className={`rounded-md border px-1 py-1.5 text-[11px] ${
              current === p.key ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-neutral-200 text-neutral-600 hover:border-indigo-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] leading-relaxed text-neutral-400">
        Applies at every screen size. Change any style below to fine-tune the {state === 'pressed' ? 'pressed' : 'hover'} look.
      </p>
      <Field label="Duration">
        <SelectField value={base['transition-duration'] || DEFAULT_TRANSITION['transition-duration']} onChange={(v) => setBase('transition-duration', v)} options={DURATIONS} />
      </Field>
      <Field label="Easing">
        <SelectField value={base['transition-timing-function'] || DEFAULT_TRANSITION['transition-timing-function']} onChange={(v) => setBase('transition-timing-function', v)} options={EASINGS} />
      </Field>
    </Section>
  );
}
