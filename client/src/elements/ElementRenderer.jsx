import clsx from 'clsx';
import { ELEMENTS } from './registry.jsx';
import { resolveRect, resolveStyle, isHiddenAt } from '../lib/geometry.js';

/**
 * Renders a single element in an absolutely-positioned wrapper. Shared by the
 * editor canvas (mode="edit") and the live preview (mode="preview") so the two
 * can never drift. Interaction props are only supplied by the canvas.
 */
export function ElementRenderer({ element, mode = 'edit', breakpoint = 'desktop', selected = false, onPointerDown }) {
  const def = ELEMENTS[element.type];
  if (!def) return null;

  const hidden = isHiddenAt(element, breakpoint);
  if (hidden && mode === 'preview') return null;

  const rect = resolveRect(element, breakpoint);
  const resolvedStyle = resolveStyle(element, breakpoint);
  const renderEl = resolvedStyle === element.style ? element : { ...element, style: resolvedStyle };
  const style = {
    position: 'absolute',
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    transform: rect.rotation ? `rotate(${rect.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    zIndex: element.zIndex ?? 0,
    opacity: hidden ? 0.35 : undefined,
    pointerEvents: element.locked && mode === 'edit' ? 'none' : undefined,
  };

  return (
    <div
      data-el-id={element.id}
      onPointerDown={onPointerDown}
      style={style}
      className={clsx('prism-el', mode === 'edit' && 'select-none', selected && mode === 'edit' && 'ring-2 ring-indigo-500')}
    >
      {def.render(renderEl, mode)}
    </div>
  );
}
