import { Boxes, Pencil } from 'lucide-react';
import { useBuilder, useUI } from './store.js';
import { getActivePage, findParentId } from './model.js';
import { isContainer } from './components.jsx';

/** Where a placed instance should land, relative to the current selection. */
function insertTarget() {
  const project = useBuilder.getState().project;
  const { selectedId, activePageId, editingComponentId } = useUI.getState();
  const rootId = editingComponentId ? project.components[editingComponentId]?.rootId : getActivePage(project, activePageId).rootId;
  if (selectedId && project.instances[selectedId]) {
    const sel = project.instances[selectedId];
    if (isContainer(sel.component)) return { parentId: selectedId };
    const pid = findParentId(project.instances, selectedId);
    if (pid) return { parentId: pid, index: project.instances[pid].children.indexOf(selectedId) + 1 };
  }
  return { parentId: rootId };
}

export default function ComponentsPanel() {
  const components = useBuilder((s) => s.project?.components) || {};
  const list = Object.values(components);

  const place = (compId) => {
    const { parentId, index } = insertTarget();
    const id = useBuilder.getState().addComponentInstance(compId, parentId, index);
    if (id) useUI.getState().select(id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-2">
      <div className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Components</div>
      {list.length === 0 ? (
        <p className="px-1 text-[11px] leading-relaxed text-neutral-400">
          Select an element on the canvas, then click the <Boxes size={11} className="inline" /> button in the right panel to turn it into a reusable component. It'll appear here to drop in anywhere.
        </p>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto scroll-thin">
          {list.map((c) => (
            <div key={c.id} className="group flex items-center gap-2 rounded-md border border-neutral-200 px-2 py-1.5 text-xs text-neutral-700 hover:border-indigo-300 hover:bg-indigo-50/40">
              <Boxes size={13} className="shrink-0 text-indigo-500" />
              <button onClick={() => place(c.id)} className="flex-1 truncate text-left" title="Place an instance">{c.name}</button>
              <button onClick={() => useUI.getState().setEditingComponent(c.id)} className="text-neutral-300 opacity-0 hover:text-indigo-600 group-hover:opacity-100" title="Edit component"><Pencil size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
