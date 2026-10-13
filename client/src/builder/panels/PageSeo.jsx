import { useBuilder } from '../store.js';
import { ToggleField } from '../controls.jsx';
import { normalizeSeo, normalizeSite, pageTitle, pageFileNames, TITLE_MAX, DESCRIPTION_MAX } from '../seo.js';

const box = 'w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800 outline-hidden focus:border-indigo-400';
const label = 'mb-1 flex justify-between text-[11px] text-neutral-500';

/** Search & sharing settings for one page, with a live search-result preview. */
export default function PageSeo({ project, page }) {
  const seo = normalizeSeo(page.seo);
  const raw = page.seo || {};
  const set = (patch) => useBuilder.getState().setPageSeo(page.id, patch);
  const site = normalizeSite(project.site);
  const file = pageFileNames(project.pages)[project.pages.indexOf(page)];
  const shownUrl = `${site.url || 'your-site.com'}/${file === 'index.html' ? '' : file}`.replace(/^https:\/\//, '');

  return (
    <div className="flex flex-col gap-2 border-t border-neutral-100 px-1 pt-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Search & sharing — {page.name}</div>

      <div>
        <div className={label}><span>Title</span><span className={(raw.title || '').length > TITLE_MAX ? 'text-amber-600' : ''}>{(raw.title || '').length}/{TITLE_MAX}</span></div>
        <input aria-label="Page title" value={raw.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder={pageTitle(project, page)} className={box} />
      </div>
      <div>
        <div className={label}><span>Description</span><span className={(raw.description || '').length > DESCRIPTION_MAX ? 'text-amber-600' : ''}>{(raw.description || '').length}/{DESCRIPTION_MAX}</span></div>
        <textarea aria-label="Page description" rows={3} value={raw.description || ''} onChange={(e) => set({ description: e.target.value })} placeholder="One or two sentences people see in search results." className={`${box} resize-none`} />
      </div>
      <div>
        <div className={label}><span>Share image</span></div>
        <input aria-label="Share image" value={raw.image || ''} onChange={(e) => set({ image: e.target.value })} placeholder="https://… or /og.png (1200×630)" className={box} />
        {raw.image && !seo.image && <p className="mt-1 text-[10px] text-amber-600">Use an https:// address or a path on your site like /og.png.</p>}
      </div>
      <ToggleField label="Hide from search engines" checked={seo.noindex} onChange={(on) => set({ noindex: on })} />

      <div className="rounded-md border border-neutral-200 bg-white p-2" aria-label="Search result preview">
        <div className="truncate text-[11px] text-emerald-700">{shownUrl}</div>
        <div className="truncate text-[13px] font-medium text-blue-700">{pageTitle(project, page)}</div>
        <div className="line-clamp-2 text-[11px] text-neutral-600">{seo.description || 'Add a description so people know what this page is about.'}</div>
      </div>
    </div>
  );
}
