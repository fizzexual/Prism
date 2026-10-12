import { useBuilder } from '../store.js';
import { Field, SelectField } from '../controls.jsx';
import { GOOGLE_FONTS } from '../fonts.js';
import { THEME_PRESETS, THEME_COLORS, RADII, normalizeTheme } from '../theme.js';

const FONT_CHOICES = [{ value: '', label: 'System' }, ...GOOGLE_FONTS.map((f) => ({ value: f.family, label: f.family }))];
const heading = 'mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400';
const same = (a, b) => JSON.stringify(normalizeTheme(a)) === JSON.stringify(normalizeTheme(b));

/** Site-wide look (shown when nothing is selected): presets, colours, corners, fonts, swatches. */
export default function ThemePanel({ project }) {
  const theme = normalizeTheme(project.theme);
  const B = () => useBuilder.getState();
  // Live edits change only the theme; font changes also point roots/headings at the theme (applyTheme).
  const setColor = (key, value) => B().setTheme({ ...theme, colors: { ...theme.colors, [key]: value } });
  const setFont = (key, family) => B().applyTheme({ ...theme, fonts: { ...theme.fonts, [key]: family } });
  const swatches = project.tokens?.colors || [];
  const setSwatches = (c) => B().setColorTokens(c);

  return (
    <div className="flex flex-col gap-5 p-3">
      <section>
        <div className={heading}>Theme</div>
        <div className="grid grid-cols-2 gap-1.5">
          {THEME_PRESETS.map((p) => {
            const active = same(p.theme, theme);
            return (
              <button
                key={p.key}
                aria-pressed={active}
                onClick={() => B().applyTheme(p.theme)}
                className={`rounded-lg border p-2 text-left ${active ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-neutral-200 hover:border-indigo-300'}`}
              >
                <div className="flex gap-0.5">
                  {['primary', 'accent', 'dark', 'surface'].map((k) => (
                    <span key={k} className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.theme.colors[k] }} />
                  ))}
                </div>
                <div className="mt-1 text-[11px] font-medium text-neutral-800">{p.label}</div>
                <div className="truncate text-[10px] text-neutral-400">{p.theme.fonts.heading}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className={heading}>Colors</div>
        <div className="grid grid-cols-3 gap-2">
          {THEME_COLORS.map(({ key, label }) => (
            <label key={key} className="flex flex-col items-center gap-1 text-[10px] text-neutral-500">
              <input
                type="color"
                aria-label={`${label} color`}
                value={theme.colors[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-8 w-full cursor-pointer rounded-sm border border-neutral-200 bg-white p-0"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className={heading}>Corners</div>
        <div className="flex gap-1" role="radiogroup" aria-label="Corner radius">
          {RADII.map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={theme.radius === r}
              title={`${r}px`}
              onClick={() => B().setTheme({ ...theme, radius: r })}
              className={`grid h-8 flex-1 place-items-center border ${theme.radius === r ? 'border-indigo-400 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-300'}`}
              style={{ borderRadius: Math.min(r, 12) }}
            >
              <span className="text-[10px] text-neutral-600">{r}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className={heading}>Fonts</div>
        <div className="flex flex-col gap-2">
          <Field label="Headings"><SelectField value={theme.fonts.heading} onChange={(v) => setFont('heading', v)} options={FONT_CHOICES} /></Field>
          <Field label="Body"><SelectField value={theme.fonts.body} onChange={(v) => setFont('body', v)} options={FONT_CHOICES} /></Field>
        </div>
      </section>

      <section>
        <div className={heading}>Swatches</div>
        <div className="grid grid-cols-6 gap-2">
          {swatches.map((c, i) => (
            <div key={i} className="group relative">
              <input
                type="color"
                aria-label={`Swatch ${c}`}
                value={c}
                onChange={(e) => { const n = [...swatches]; n[i] = e.target.value; setSwatches(n); }}
                className="h-8 w-full cursor-pointer rounded-sm border border-neutral-200 bg-white p-0"
              />
              <button
                aria-label={`Remove swatch ${c}`}
                onClick={() => setSwatches(swatches.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 hidden h-4 w-4 place-items-center rounded-full bg-neutral-700 text-[10px] leading-none text-white group-hover:grid"
              >
                ×
              </button>
            </div>
          ))}
          <button
            aria-label="Add swatch"
            onClick={() => setSwatches([...swatches, '#000000'])}
            className="grid h-8 place-items-center rounded-sm border border-dashed border-neutral-300 text-neutral-400 hover:border-indigo-400 hover:text-indigo-500"
          >
            +
          </button>
        </div>
      </section>

      <p className="text-center text-[11px] leading-relaxed text-neutral-400">
        Select an element on the canvas to edit it. Theme colors appear first in every color picker and stay linked to the theme.
      </p>
    </div>
  );
}
