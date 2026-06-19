import { useEffect } from 'react';
import Palette from './components/Palette.jsx';
import Toolbar from './components/Toolbar.jsx';
import ProjectBar from './components/Projects/ProjectBar.jsx';
import LayersPanel from './components/Layers/LayersPanel.jsx';
import { Inspector } from './components/Inspector/Inspector.jsx';
import CanvasStage from './components/Canvas/CanvasStage.jsx';
import PreviewFrame from './components/Preview/PreviewFrame.jsx';
import { useDocumentStore } from './state/documentStore.js';
import { useEditorStore } from './state/editorStore.js';
import { sampleDocument } from './lib/sampleDocument.js';
import { useAutosave } from './lib/useAutosave.js';
import { getLastId, loadLocal, getServerId } from './lib/local.js';

export default function App() {
  const project = useDocumentStore((s) => s.project);
  const previewMode = useEditorStore((s) => s.previewMode);
  useAutosave();

  useEffect(() => {
    if (project) return;
    const lastId = getLastId();
    const restored = lastId ? loadLocal(lastId) : null;
    const doc = restored || sampleDocument();
    useDocumentStore.getState().loadProject(doc);
    useEditorStore.getState().setActivePage(doc.pages[0].id);
    useEditorStore.getState().setServerId(restored ? getServerId(lastId) : null);
  }, [project]);

  if (!project) return null;

  return (
    <div className="flex h-full flex-col bg-neutral-100 text-neutral-900">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-3">
        <div className="h-5 w-5 rounded bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
        <ProjectBar />
        <div className="ml-auto">
          <Toolbar />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
          <Palette />
          <LayersPanel />
        </div>
        <CanvasStage />
        <aside className="w-72 shrink-0 border-l border-neutral-200 bg-white">
          <Inspector />
        </aside>
      </div>

      {previewMode && <PreviewFrame />}
    </div>
  );
}
