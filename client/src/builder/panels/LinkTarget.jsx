import { useBuilder } from '../store.js';

const box = 'w-full min-w-0 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800 outline-hidden focus:border-indigo-400';

/**
 * Where a Link/Button goes: one of the site's pages (stored as page:<id>, exported as
 * its file name), a web address, or — for buttons — nowhere.
 */
export default function LinkTarget({ value = '', onChange, allowNone = false }) {
  const pages = useBuilder((s) => s.project?.pages) || [];
  const isPage = typeof value === 'string' && value.startsWith('page:');
  const mode = isPage ? value : !value && allowNone ? '' : 'url';
  const choose = (v) => {
    if (v === 'url') onChange(isPage || !value ? 'https://' : value);
    else onChange(v);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <select aria-label="Links to" value={mode} onChange={(e) => choose(e.target.value)} className={box}>
        {allowNone && <option value="">No link</option>}
        <optgroup label="Pages">
          {pages.map((p) => <option key={p.id} value={`page:${p.id}`}>{p.name}</option>)}
        </optgroup>
        <option value="url">Web address…</option>
      </select>
      {mode === 'url' && (
        <input aria-label="Web address" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className={box} />
      )}
      {isPage && !pages.some((p) => `page:${p.id}` === value) && (
        <p className="text-[10px] text-amber-600">That page was deleted; the link goes nowhere until you pick another.</p>
      )}
    </div>
  );
}
