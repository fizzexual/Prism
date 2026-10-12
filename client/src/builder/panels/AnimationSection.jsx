import { Play } from 'lucide-react';
import { useBuilder } from '../store.js';
import { Section, Field, SelectField, ToggleField } from '../controls.jsx';
import { MOTION_PRESETS, EASING_OPTIONS, DURATIONS, DELAYS, STAGGERS, normalizeMotion } from '../motion.js';
import { playOnCanvas } from '../canvasMotion.js';

const ms = (list) => list.map((n) => ({ value: String(n), label: `${n} ms` }));

/** Entrance animation for the selected element: preset grid, timing, stagger, Play. */
export default function AnimationSection({ inst, container }) {
  const motion = normalizeMotion(inst.motion);
  const play = () => playOnCanvas(useBuilder.getState().project, inst.id);
  const update = (patch) => {
    const next = { ...(motion || { preset: 'fade-up' }), ...patch };
    useBuilder.getState().setMotion(inst.id, next);
    play();
  };
  const pick = (preset) => {
    if (preset === 'none') useBuilder.getState().setMotion(inst.id, null);
    else update({ preset });
  };

  return (
    <Section title="Animation">
      <div className="grid grid-cols-3 gap-1">
        {[{ key: 'none', label: 'None' }, ...MOTION_PRESETS].map((p) => {
          const active = (motion?.preset || 'none') === p.key;
          return (
            <button
              key={p.key}
              aria-pressed={active}
              onClick={() => pick(p.key)}
              className={`rounded-md border px-1 py-1.5 text-[11px] ${
                active ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-neutral-200 text-neutral-600 hover:border-indigo-300'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {motion && (
        <>
          <p className="text-[10px] leading-relaxed text-neutral-400">Plays when the element scrolls into view on the published site.</p>
          <Field label="Duration"><SelectField value={String(motion.duration)} onChange={(v) => update({ duration: Number(v) })} options={ms(DURATIONS)} /></Field>
          <Field label="Delay"><SelectField value={String(motion.delay)} onChange={(v) => update({ delay: Number(v) })} options={ms(DELAYS)} /></Field>
          <Field label="Easing"><SelectField value={motion.easing} onChange={(v) => update({ easing: v })} options={EASING_OPTIONS} /></Field>
          {container && (
            <Field label="Stagger">
              <SelectField
                value={String(motion.stagger)}
                onChange={(v) => update({ stagger: Number(v) })}
                options={STAGGERS.map((n) => ({ value: String(n), label: n ? `Children, ${n} ms apart` : 'Off (animate as one)' }))}
              />
            </Field>
          )}
          <ToggleField label="Replay on scroll back" checked={motion.repeat} onChange={(on) => update({ repeat: on })} />
          <button onClick={play} className="flex items-center justify-center gap-1.5 rounded-md border border-neutral-200 px-2 py-1.5 text-xs text-neutral-700 hover:border-indigo-400 hover:text-indigo-600">
            <Play size={12} /> Play
          </button>
        </>
      )}
    </Section>
  );
}
