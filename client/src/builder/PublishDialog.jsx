import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Download, X, Upload } from 'lucide-react';
import { useBuilder } from './store.js';
import { normalizeSite, publishChecklist } from './seo.js';

const box = 'w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 outline-hidden focus:border-indigo-400';
const h = 'mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400';
const MAX_FAVICON = 100 * 1024;

const HOSTS = [
  { name: 'Netlify Drop (free, no setup)', steps: ['Download the site below and unzip it.', 'Open app.netlify.com/drop and sign in.', 'Drag the unzipped folder onto the page — your site is live in seconds.'] },
  { name: 'GitHub Pages (free)', steps: ['Create a public repository on github.com.', 'Upload every file from the ZIP (Add file → Upload files) and commit.', 'Settings → Pages → Deploy from branch → main / root. The address appears there.'] },
  { name: 'Any web host', steps: ['Upload every file from the ZIP to your site’s web root (often public_html).', 'index.html is your home page.'] },
];

/** Publish: site settings, a checklist that explains what's missing, the site ZIP and hosting steps. */
export default function PublishDialog({ onClose }) {
  const project = useBuilder((s) => s.project);
  const raw = project.site || {};
  const site = normalizeSite(raw);
  const set = (patch) => useBuilder.getState().setSite(patch);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const uploadFavicon = (file) => {
    setError('');
    if (!file) return;
    if (file.size > MAX_FAVICON) { setError('Favicons must be under 100 KB.'); return; }
    const r = new FileReader();
    r.onload = () => {
      const v = String(r.result);
      if (normalizeSite({ favicon: v }).favicon) set({ favicon: v });
      else setError('Use a PNG, ICO, SVG, GIF, JPEG or WebP image.');
    };
    r.readAsDataURL(file);
  };
  const download = async () => {
    setBusy(true);
    try { await (await import('./exportSite.js')).downloadSite(useBuilder.getState().project); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Publish" onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <span className="text-sm font-semibold text-neutral-800">Publish your site</span>
          <button onClick={onClose} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"><X size={15} /></button>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          <section>
            <div className={h}>Site</div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-neutral-500">Site address
                <input aria-label="Site address" value={raw.url || ''} onChange={(e) => set({ url: e.target.value })} placeholder="https://yourname.netlify.app" className={`${box} mt-1`} />
              </label>
              {raw.url && !site.url && <p className="text-[10px] text-amber-600">Use the full https:// address of your site.</p>}
              <label className="text-[11px] text-neutral-500">Language
                <input aria-label="Language" value={raw.lang || ''} onChange={(e) => set({ lang: e.target.value })} placeholder="en" className={`${box} mt-1`} />
              </label>
              <div className="flex items-center gap-2">
                {site.favicon ? <img src={site.favicon} alt="" className="h-8 w-8 rounded-sm border border-neutral-200 object-contain" /> : <div className="h-8 w-8 rounded-sm border border-dashed border-neutral-300" />}
                <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2 py-1.5 text-xs text-neutral-600 hover:border-indigo-400 hover:text-indigo-600">
                  <Upload size={12} /> {site.favicon ? 'Change favicon' : 'Upload favicon'}
                  <input aria-label="Favicon" type="file" accept="image/png,image/x-icon,image/svg+xml,image/gif,image/jpeg,image/webp,.ico" className="hidden" onChange={(e) => { uploadFavicon(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
                {site.favicon && <button onClick={() => set({ favicon: '' })} className="text-[11px] text-neutral-400 hover:text-red-500">Remove</button>}
              </div>
              {error && <p role="alert" className="text-[10px] text-red-600">{error}</p>}
            </div>
          </section>

          <section>
            <div className={h}>Checklist</div>
            <ul className="flex flex-col gap-2">
              {publishChecklist(project).map((i) => (
                <li key={i.key} className="flex gap-2 text-xs">
                  {i.ok ? <CheckCircle2 size={15} className="mt-px shrink-0 text-emerald-600" /> : <Circle size={15} className="mt-px shrink-0 text-neutral-300" />}
                  <div>
                    <div className="font-medium text-neutral-800">{i.label}{!i.ok && i.detail ? <span className="font-normal text-neutral-500"> — missing on {i.detail}</span> : null}</div>
                    {!i.ok && <div className="text-[11px] text-neutral-500">{i.why}{i.key === 'seo' ? ' Add them in the Pages tab.' : ''}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <button onClick={download} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
            <Download size={15} /> {busy ? 'Preparing…' : 'Download site (.zip)'}
          </button>

          <section>
            <div className={h}>Put it online</div>
            <div className="flex flex-col gap-3">
              {HOSTS.map((host) => (
                <div key={host.name}>
                  <div className="text-xs font-medium text-neutral-800">{host.name}</div>
                  <ol className="ml-4 list-decimal text-[11px] leading-relaxed text-neutral-600">
                    {host.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
