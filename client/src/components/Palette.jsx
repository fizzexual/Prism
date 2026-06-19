import { elementList } from '../elements/registry.jsx';

/**
 * Element palette. Items use native HTML5 drag so the canvas receives exact
 * drop coordinates for the freeform layout.
 */
export default function Palette() {
  return (
    <div className="shrink-0 border-b border-neutral-200">
      <div className="flex h-9 items-center px-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        Elements
      </div>
      <div className="grid grid-cols-2 gap-2 px-2 pb-3">
        {elementList.map((def) => {
          const Icon = def.icon;
          return (
            <div
              key={def.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/prism-type', def.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              title={`Drag ${def.label} onto the canvas`}
              className="group flex cursor-grab flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 transition-colors hover:border-indigo-400 hover:bg-indigo-50 active:cursor-grabbing"
            >
              <Icon size={18} className="text-neutral-500 group-hover:text-indigo-600" />
              <span className="text-[11px] text-neutral-600 group-hover:text-indigo-700">{def.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
