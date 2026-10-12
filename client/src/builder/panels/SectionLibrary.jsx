import { FilePlus2 } from 'lucide-react';
import { useBuilder, useUI } from '../store.js';
import { getActivePage } from '../model.js';
import { TEMPLATES, CATEGORIES, STARTERS, templateInsertIndex, buildStarter } from '../templates.js';

const title = 'px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400';
const btn = 'rounded-md border border-neutral-200 px-2 py-1.5 text-left text-xs text-neutral-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700';

function addSection(tpl) {
  const { project } = useBuilder.getState();
  const rootId = getActivePage(project, useUI.getState().activePageId).rootId;
  const index = templateInsertIndex(project, rootId, useUI.getState().selectedId, tpl);
  const id = useBuilder.getState().pasteSnapshot(rootId, index, tpl.build());
  if (id) useUI.getState().select(id);
}

/** A starter is added as a NEW page (existing pages are never replaced), then opened. */
function addStarter(starter) {
  const pageId = useBuilder.getState().addPageWithSections(starter.label, buildStarter(starter));
  useUI.getState().setActivePage(pageId);
}

/** Add panel: starter pages + the section library grouped by category. */
export default function SectionLibrary() {
  return (
    <div className="flex flex-col gap-3 border-b border-neutral-100 p-2">
      <div>
        <div className={title}>Starter pages</div>
        <div className="flex flex-col gap-1">
          {STARTERS.map((s) => (
            <button key={s.label} onClick={() => addStarter(s)} className={`${btn} flex items-center gap-2`} title={`Adds a new “${s.label}” page with ${s.sections.length} sections`}>
              <FilePlus2 size={13} className="shrink-0 text-indigo-500" />
              <span className="flex-1">{s.label}</span>
              <span className="text-[10px] text-neutral-400">{s.sections.length} sections</span>
            </button>
          ))}
        </div>
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat}>
          <div className={title}>{cat}</div>
          <div className="grid grid-cols-2 gap-1">
            {TEMPLATES.filter((t) => t.category === cat).map((t) => (
              <button key={t.label} onClick={() => addSection(t)} className={btn}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
