import { useEffect } from 'react';
import { X, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useDocumentStore } from '../../state/documentStore.js';
import { useEditorStore, BREAKPOINTS } from '../../state/editorStore.js';
import { ElementRenderer } from '../../elements/ElementRenderer.jsx';
import { resolveRect, rectBounds, isHiddenAt } from '../../lib/geometry.js';

const BP_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

/**
 * Full-screen live preview. Renders the active page with the shared
 * ElementRenderer (mode="preview") at the active breakpoint, no editor chrome,
 * interactions live. Esc closes.
 */
export default function PreviewFrame() {
  const project = useDocumentStore((s) => s.project);
  const activePageId = useEditorStore((s) => s.activePageId);
  const breakpoint = useEditorStore((s) => s.breakpoint);
  const page = project?.pages.find((p) => p.id === activePageId) || project?.pages[0];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') useEditorStore.getState().setPreview(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!page) return null;

  const width = BREAKPOINTS[breakpoint].width;
  const contentBottom = page.elements.reduce(
    (m, el) => (isHiddenAt(el, breakpoint) ? m : Math.max(m, rectBounds(resolveRect(el, breakpoint)).bottom)),
    0,
  );
  const minHeight = Math.max(480, contentBottom + 60);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-neutral-800">
      <div className="flex h-12 shrink-0 items-center justify-between bg-neutral-900 px-4 text-white">
        <span className="text-sm font-medium">Preview · {page.name}</span>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/10 p-0.5">
          {Object.entries(BREAKPOINTS).map(([key, bp]) => {
            const Icon = BP_ICONS[key];
            return (
              <button
                key={key}
                onClick={() => useEditorStore.getState().setBreakpoint(key)}
                title={bp.label}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${
                  breakpoint === key ? 'bg-white text-neutral-900' : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => useEditorStore.getState().setPreview(false)}
          className="flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-sm hover:bg-white/20"
        >
          <X size={16} /> Close
        </button>
      </div>

      <div className="flex flex-1 justify-center overflow-auto py-8 scroll-thin">
        <div
          style={{
            width,
            minHeight,
            background: page.canvas?.background || '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 50px rgba(0,0,0,.45)',
            flex: '0 0 auto',
          }}
        >
          {page.elements.map((el) => (
            <ElementRenderer key={el.id} element={el} mode="preview" breakpoint={breakpoint} />
          ))}
        </div>
      </div>
    </div>
  );
}
