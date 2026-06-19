import { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '../../state/documentStore.js';
import { useEditorStore, BREAKPOINTS } from '../../state/editorStore.js';
import { ELEMENTS, createElement } from '../../elements/registry.jsx';
import { ElementRenderer } from '../../elements/ElementRenderer.jsx';
import { resolveRect, rectBounds } from '../../lib/geometry.js';
import { snapValue, alignmentGuides } from '../../lib/snapping.js';
import GridOverlay from './GridOverlay.jsx';
import GuideLines from './GuideLines.jsx';
import SelectionLayer from './SelectionLayer.jsx';

const rotVec = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
const addVec = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const subVec = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const MIN_SIZE = 8;

export default function CanvasStage() {
  const project = useDocumentStore((s) => s.project);
  const activePageId = useEditorStore((s) => s.activePageId);
  const breakpoint = useEditorStore((s) => s.breakpoint);
  const zoom = useEditorStore((s) => s.zoom);
  const grid = useEditorStore((s) => s.grid);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const previewMode = useEditorStore((s) => s.previewMode);

  const artboardRef = useRef(null);
  const interaction = useRef(null);
  const draftRef = useRef({});
  const [draftRects, setDraftRects] = useState({});
  const [guideLines, setGuideLines] = useState([]);

  const page = project?.pages.find((p) => p.id === activePageId) || project?.pages[0];

  const setDrafts = (d) => {
    draftRef.current = d;
    setDraftRects(d);
  };

  const toArtboard = (clientX, clientY) => {
    const r = artboardRef.current.getBoundingClientRect();
    return { x: (clientX - r.left) / zoom, y: (clientY - r.top) / zoom };
  };

  /* ----------------------------- gestures ----------------------------- */

  const startInteraction = (type, ids, e, handle = null) => {
    const startRects = {};
    ids.forEach((id) => {
      const el = page.elements.find((x) => x.id === id);
      if (el) startRects[id] = resolveRect(el, breakpoint);
    });
    interaction.current = {
      type,
      ids,
      handle,
      primary: ids[0],
      startPointer: { x: e.clientX, y: e.clientY },
      startPointerArtboard: toArtboard(e.clientX, e.clientY),
      startRects,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  const onPointerMove = (e) => {
    const it = interaction.current;
    if (!it) return;
    if (it.type === 'move') doMove(it, e);
    else if (it.type === 'resize') doResize(it, e);
    else if (it.type === 'rotate') doRotate(it, e);
  };

  const onPointerUp = () => {
    window.removeEventListener('pointermove', onPointerMove);
    const it = interaction.current;
    interaction.current = null;
    const drafts = draftRef.current;
    if (it && Object.keys(drafts).length) {
      useDocumentStore.getState().commitRects(activePageId, drafts, breakpoint);
    }
    setDrafts({});
    setGuideLines([]);
  };

  const doMove = (it, e) => {
    const z = useEditorStore.getState().zoom;
    const g = useEditorStore.getState().grid;
    const guidesOn = useEditorStore.getState().guides;
    const dx = (e.clientX - it.startPointer.x) / z;
    const dy = (e.clientY - it.startPointer.y) / z;

    const start = it.startRects[it.primary];
    let snapDx = dx;
    let snapDy = dy;
    if (g.snap) {
      snapDx = snapValue(start.x + dx, g.size) - start.x;
      snapDy = snapValue(start.y + dy, g.size) - start.y;
    }

    let lines = [];
    if (guidesOn && !e.altKey) {
      const moving = { ...start, x: start.x + snapDx, y: start.y + snapDy };
      const others = page.elements
        .filter((el) => !it.ids.includes(el.id))
        .map((el) => resolveRect(el, breakpoint));
      const res = alignmentGuides(moving, others, 6);
      if (res.x != null) snapDx += res.x;
      if (res.y != null) snapDy += res.y;
      lines = res.lines;
    }

    const drafts = {};
    it.ids.forEach((id) => {
      const s = it.startRects[id];
      drafts[id] = { ...s, x: Math.round(s.x + snapDx), y: Math.round(s.y + snapDy) };
    });
    setDrafts(drafts);
    setGuideLines(lines);
  };

  const doResize = (it, e) => {
    const g = useEditorStore.getState().grid;
    const id = it.primary;
    const s = it.startRects[id];
    const theta = ((s.rotation || 0) * Math.PI) / 180;
    const C0 = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    const P = toArtboard(e.clientX, e.clientY);
    const { hx, hy } = it.handle;

    const anchorLocal = { x: -hx * (s.width / 2), y: -hy * (s.height / 2) };
    const A = addVec(C0, rotVec(anchorLocal, theta));
    const Pl = rotVec(subVec(P, C0), -theta);

    let newW = hx !== 0 ? Math.max(MIN_SIZE, Math.abs(Pl.x - anchorLocal.x)) : s.width;
    let newH = hy !== 0 ? Math.max(MIN_SIZE, Math.abs(Pl.y - anchorLocal.y)) : s.height;
    if (g.snap) {
      if (hx !== 0) newW = Math.max(MIN_SIZE, snapValue(newW, g.size));
      if (hy !== 0) newH = Math.max(MIN_SIZE, snapValue(newH, g.size));
    }

    const newCenter = addVec(A, rotVec({ x: hx * (newW / 2), y: hy * (newH / 2) }, theta));
    const draft = {
      ...s,
      width: Math.round(newW),
      height: Math.round(newH),
      x: Math.round(newCenter.x - newW / 2),
      y: Math.round(newCenter.y - newH / 2),
    };
    setDrafts({ [id]: draft });
  };

  const doRotate = (it, e) => {
    const id = it.primary;
    const s = it.startRects[id];
    const C0 = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    const P = toArtboard(e.clientX, e.clientY);
    const a0 = Math.atan2(it.startPointerArtboard.y - C0.y, it.startPointerArtboard.x - C0.x);
    const a1 = Math.atan2(P.y - C0.y, P.x - C0.x);
    let deg = (s.rotation || 0) + ((a1 - a0) * 180) / Math.PI;
    deg = e.shiftKey ? Math.round(deg / 15) * 15 : Math.round(deg);
    setDrafts({ [id]: { ...s, rotation: ((deg % 360) + 360) % 360 } });
  };

  /* --------------------------- element events --------------------------- */

  const onElementPointerDown = (e, el) => {
    if (previewMode) return;
    e.stopPropagation();
    const ed = useEditorStore.getState();
    let ids;
    if (e.shiftKey) {
      ed.toggleSelect(el.id);
      ids = ed.selectedIds.includes(el.id)
        ? ed.selectedIds.filter((x) => x !== el.id)
        : [...ed.selectedIds, el.id];
    } else if (ed.selectedIds.includes(el.id)) {
      ids = ed.selectedIds;
    } else {
      ed.select([el.id]);
      ids = [el.id];
    }
    if (el.locked || !ids.length) return;
    startInteraction('move', ids, e);
  };

  const onResizeStart = (handle, e) => {
    if (selectedIds.length !== 1) return;
    startInteraction('resize', [selectedIds[0]], e, handle);
  };
  const onRotateStart = (e) => {
    if (selectedIds.length !== 1) return;
    startInteraction('rotate', [selectedIds[0]], e);
  };

  /* ------------------------------ drop ------------------------------ */

  const onDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/prism-type');
    if (!type || !ELEMENTS[type]) return;
    const pt = toArtboard(e.clientX, e.clientY);
    const def = ELEMENTS[type];
    let x = pt.x - def.defaultSize.width / 2;
    let y = pt.y - def.defaultSize.height / 2;
    if (grid.snap) {
      x = snapValue(x, grid.size);
      y = snapValue(y, grid.size);
    }
    const el = createElement(type, { x: Math.max(0, x), y: Math.max(0, y) });
    useDocumentStore.getState().addElement(activePageId, el);
    useEditorStore.getState().select([el.id]);
  };

  /* ---------------------------- keyboard ---------------------------- */

  useEffect(() => {
    const onKey = (e) => {
      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
      const ed = useEditorStore.getState();
      const doc = useDocumentStore.getState();
      const pageId = ed.activePageId;
      if (!pageId || !doc.project) return;
      const sel = ed.selectedIds;
      const meta = e.ctrlKey || e.metaKey;
      const temporal = useDocumentStore.temporal.getState();

      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        temporal.redo();
        return;
      }
      if (!sel.length) return;
      if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        ed.select(doc.duplicateElements(pageId, sel));
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        doc.removeElements(pageId, sel);
        ed.clearSelect();
        return;
      }
      if (e.key === 'Escape') {
        ed.clearSelect();
        return;
      }
      if (e.key === '[') {
        sel.forEach((id) => doc.sendToBack(pageId, id));
        return;
      }
      if (e.key === ']') {
        sel.forEach((id) => doc.bringToFront(pageId, id));
        return;
      }
      const nudges = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (nudges[e.key]) {
        e.preventDefault();
        const [nx, ny] = nudges[e.key];
        const step = e.shiftKey ? 10 : 1;
        const bp = ed.breakpoint;
        const pg = doc.project.pages.find((p) => p.id === pageId);
        const rectsById = {};
        sel.forEach((id) => {
          const el = pg.elements.find((x) => x.id === id);
          if (el) {
            const r = resolveRect(el, bp);
            rectsById[id] = { x: r.x + nx * step, y: r.y + ny * step };
          }
        });
        doc.commitRects(pageId, rectsById, bp);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!page) return null;

  const bpWidth = BREAKPOINTS[breakpoint].width;
  const contentBottom = page.elements.reduce((max, el) => {
    const b = rectBounds(resolveRect(el, breakpoint));
    return Math.max(max, b.bottom);
  }, 0);
  const artboardHeight = Math.max(760, contentBottom + 180);

  const single = selectedIds.length === 1 ? page.elements.find((el) => el.id === selectedIds[0]) : null;
  const singleRect = single ? draftRects[single.id] || resolveRect(single, breakpoint) : null;

  return (
    <main
      className="flex-1 min-w-0 overflow-auto bg-canvas scroll-thin"
      onPointerDown={() => {
        if (!previewMode) useEditorStore.getState().clearSelect();
      }}
    >
      <div className="min-h-full w-full flex justify-center py-10 px-10">
        <div style={{ width: bpWidth * zoom, height: artboardHeight * zoom, flex: '0 0 auto' }}>
          <div
            ref={artboardRef}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            style={{
              width: bpWidth,
              height: artboardHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'relative',
              background: page.canvas?.background || '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,.12), 0 10px 40px rgba(0,0,0,.08)',
            }}
          >
            {/* Clip elements to the page bounds; handles/guides stay outside the clip. */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              {grid.enabled && !previewMode && <GridOverlay size={grid.size} />}

              {page.elements.map((el) => {
                const draft = draftRects[el.id];
                const renderEl = draft ? { ...el, rect: draft, responsive: {} } : el;
                return (
                  <ElementRenderer
                    key={el.id}
                    element={renderEl}
                    mode="edit"
                    breakpoint={breakpoint}
                    selected={selectedIds.includes(el.id)}
                    onPointerDown={(e) => onElementPointerDown(e, el)}
                  />
                );
              })}
            </div>

            {!previewMode && <GuideLines lines={guideLines} zoom={zoom} />}

            {!previewMode && single && singleRect && (
              <SelectionLayer
                rect={singleRect}
                zoom={zoom}
                onResizeStart={onResizeStart}
                onRotateStart={onRotateStart}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
