import { useState } from 'react';
import { useStore } from 'zustand';
import { saveAs } from 'file-saver';
import { Undo2, Redo2, Monitor, Tablet, Smartphone, Grid3x3, ZoomIn, ZoomOut, Eye, Download } from 'lucide-react';
import { useDocumentStore } from '../state/documentStore.js';
import { useEditorStore, BREAKPOINTS } from '../state/editorStore.js';
import { exportProject } from '../export/exportProject.js';

const BP_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const slug = (s) => String(s || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';

export default function Toolbar() {
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const project = useDocumentStore.getState().project;
      const blob = await exportProject(project);
      saveAs(blob, `${slug(project.name)}.zip`);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const breakpoint = useEditorStore((s) => s.breakpoint);
  const zoom = useEditorStore((s) => s.zoom);
  const grid = useEditorStore((s) => s.grid);
  const previewMode = useEditorStore((s) => s.previewMode);
  const pastCount = useStore(useDocumentStore.temporal, (s) => s.pastStates.length);
  const futureCount = useStore(useDocumentStore.temporal, (s) => s.futureStates.length);
  const ed = useEditorStore.getState();
  const temporal = useDocumentStore.temporal.getState();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        <button disabled={!pastCount} onClick={() => temporal.undo()} className="toolbtn" title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </button>
        <button disabled={!futureCount} onClick={() => temporal.redo()} className="toolbtn" title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 p-0.5">
        {Object.entries(BREAKPOINTS).map(([key, bp]) => {
          const Icon = BP_ICONS[key];
          return (
            <button
              key={key}
              onClick={() => ed.setBreakpoint(key)}
              title={`${bp.label} (${bp.width}px)`}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                breakpoint === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => ed.setGrid({ enabled: !grid.enabled, snap: !grid.enabled })}
          className={`toolbtn ${grid.enabled ? 'text-indigo-600' : ''}`}
          title="Toggle grid + snap"
        >
          <Grid3x3 size={16} />
        </button>
        <button onClick={() => ed.setZoom(zoom - 0.1)} className="toolbtn" title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <span className="w-9 text-center text-xs tabular-nums text-neutral-500">{Math.round(zoom * 100)}%</span>
        <button onClick={() => ed.setZoom(zoom + 0.1)} className="toolbtn" title="Zoom in">
          <ZoomIn size={16} />
        </button>
      </div>

      <button
        onClick={() => ed.setPreview(!previewMode)}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
          previewMode ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }`}
      >
        <Eye size={14} /> Preview
      </button>

      <button
        onClick={onExport}
        disabled={exporting}
        className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        <Download size={14} /> {exporting ? 'Exporting…' : 'Export'}
      </button>
    </div>
  );
}
