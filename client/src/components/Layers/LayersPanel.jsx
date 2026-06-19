import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Lock, Unlock, Plus, X } from 'lucide-react';
import { useDocumentStore } from '../../state/documentStore.js';
import { useEditorStore } from '../../state/editorStore.js';
import { ELEMENTS } from '../../elements/registry.jsx';

function LayerRow({ el, pageId, selected }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: el.id });
  const doc = useDocumentStore.getState();
  const Icon = ELEMENTS[el.type]?.icon || GripVertical;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onPointerDown={() => useEditorStore.getState().select([el.id])}
      className={`group flex items-center gap-1.5 rounded px-1.5 py-1 text-xs cursor-pointer ${
        selected ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-600 hover:bg-neutral-100'
      }`}
    >
      <span {...attributes} {...listeners} className="cursor-grab text-neutral-300 hover:text-neutral-500">
        <GripVertical size={12} />
      </span>
      <Icon size={13} className="shrink-0 text-neutral-400" />
      <span className="flex-1 truncate">{el.name || ELEMENTS[el.type]?.label}</span>
      <button
        onPointerDown={(e) => { e.stopPropagation(); doc.setElementFlag(pageId, el.id, 'hidden', !el.hidden); }}
        className={el.hidden ? 'text-neutral-400' : 'text-neutral-300 opacity-0 group-hover:opacity-100'}
      >
        {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button
        onPointerDown={(e) => { e.stopPropagation(); doc.setElementFlag(pageId, el.id, 'locked', !el.locked); }}
        className={el.locked ? 'text-neutral-400' : 'text-neutral-300 opacity-0 group-hover:opacity-100'}
      >
        {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
      </button>
    </div>
  );
}

export default function LayersPanel() {
  const project = useDocumentStore((s) => s.project);
  const activePageId = useEditorStore((s) => s.activePageId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const page = project?.pages.find((p) => p.id === activePageId) || project?.pages[0];
  if (!page) return null;

  // front-most (highest z) on top
  const display = [...page.elements].reverse();
  const displayIds = display.map((e) => e.id);

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = displayIds.indexOf(active.id);
    const newIndex = displayIds.indexOf(over.id);
    const newArrayOrder = arrayMove(displayIds, oldIndex, newIndex).reverse();
    useDocumentStore.getState().reorder(page.id, active.id, newArrayOrder.indexOf(active.id));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 scroll-thin">
        {project.pages.map((p) => (
          <button
            key={p.id}
            onClick={() => useEditorStore.getState().setActivePage(p.id)}
            className={`group flex items-center gap-1 rounded px-2 py-0.5 text-[11px] whitespace-nowrap ${
              p.id === page.id ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {p.name}
            {project.pages.length > 1 && (
              <X
                size={10}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); useDocumentStore.getState().removePage(p.id); }}
              />
            )}
          </button>
        ))}
        <button
          onClick={() => {
            const id = useDocumentStore.getState().addPage(`Page ${project.pages.length + 1}`);
            useEditorStore.getState().setActivePage(id);
          }}
          className="grid h-5 w-5 place-items-center rounded text-neutral-400 hover:bg-neutral-100"
          title="Add page"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Layers</div>
      <div className="flex-1 overflow-y-auto scroll-thin px-1 pb-2">
        {display.length === 0 && <p className="px-2 py-3 text-[11px] text-neutral-400">No layers yet.</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={displayIds} strategy={verticalListSortingStrategy}>
            {display.map((el) => (
              <LayerRow key={el.id} el={el} pageId={page.id} selected={selectedIds.includes(el.id)} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
