import { create } from 'zustand';
import { temporal } from 'zundo';
import { newId } from '../lib/ids.js';

/** Replace one page in the project, immutably. */
function mapPage(project, pageId, fn) {
  return { ...project, pages: project.pages.map((p) => (p.id === pageId ? fn(p) : p)) };
}

/** One-level deep merge for known nested element fields (rect/style/content/responsive/three). */
function mergeElement(el, patch) {
  const next = { ...el };
  for (const key of Object.keys(patch)) {
    const val = patch[key];
    const isPlainObj = val && typeof val === 'object' && !Array.isArray(val);
    const baseIsObj = el[key] && typeof el[key] === 'object' && !Array.isArray(el[key]);
    next[key] = isPlainObj && baseIsObj ? { ...el[key], ...val } : val;
  }
  return next;
}

/** Reassign zIndex from array order (index 0 = back, last = front). */
const reindex = (els) => els.map((e, i) => ({ ...e, zIndex: i }));

export const useDocumentStore = create(
  temporal(
    (set, get) => ({
      project: null,

      loadProject(project) {
        set({ project });
        // Loading is not an undoable step.
        useDocumentStore.temporal.getState().clear();
      },

      setProjectMeta(patch) {
        set((s) => (s.project ? { project: { ...s.project, ...patch } } : s));
      },

      addElement(pageId, element) {
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: [...p.elements, { ...element, zIndex: p.elements.length }],
            })),
          };
        });
      },

      updateElement(pageId, id, patch) {
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: p.elements.map((e) => (e.id === id ? mergeElement(e, patch) : e)),
            })),
          };
        });
      },

      updateElements(pageId, ids, patch) {
        const idSet = new Set(ids);
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: p.elements.map((e) => (idSet.has(e.id) ? mergeElement(e, patch) : e)),
            })),
          };
        });
      },

      /**
       * Apply per-element rects in a single undo step. Used by the canvas to
       * commit a move/resize/rotate gesture (writes base rect on desktop, or a
       * responsive override otherwise).
       */
      commitRects(pageId, rectsById, breakpoint = 'desktop') {
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: p.elements.map((e) => {
                const r = rectsById[e.id];
                if (!r) return e;
                if (breakpoint === 'desktop') return { ...e, rect: { ...e.rect, ...r } };
                const responsive = { ...(e.responsive || {}) };
                responsive[breakpoint] = { ...(responsive[breakpoint] || {}), ...r };
                return { ...e, responsive };
              }),
            })),
          };
        });
      },

      /** Write a per-breakpoint override (desktop writes the base rect). */
      setBreakpointPatch(pageId, id, breakpoint, patch) {
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: p.elements.map((e) => {
                if (e.id !== id) return e;
                if (breakpoint === 'desktop') return { ...e, rect: { ...e.rect, ...patch } };
                const responsive = { ...(e.responsive || {}) };
                responsive[breakpoint] = { ...(responsive[breakpoint] || {}), ...patch };
                return { ...e, responsive };
              }),
            })),
          };
        });
      },

      /** Deep-merge a style patch into the base style (desktop) or a per-breakpoint override. */
      patchElementStyle(pageId, id, breakpoint, stylePatch) {
        const merge = (base = {}, patch = {}) => {
          const out = { ...base, ...patch };
          if (base.font || patch.font) out.font = { ...(base.font || {}), ...(patch.font || {}) };
          if (base.border || patch.border) out.border = { ...(base.border || {}), ...(patch.border || {}) };
          return out;
        };
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: p.elements.map((e) => {
                if (e.id !== id) return e;
                if (breakpoint === 'desktop') return { ...e, style: merge(e.style, stylePatch) };
                const responsive = { ...(e.responsive || {}) };
                const cur = responsive[breakpoint] || {};
                responsive[breakpoint] = { ...cur, style: merge(cur.style, stylePatch) };
                return { ...e, responsive };
              }),
            })),
          };
        });
      },

      clearBreakpointOverride(pageId, id, breakpoint) {
        if (breakpoint === 'desktop') return;
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: p.elements.map((e) => {
                if (e.id !== id || !e.responsive) return e;
                const responsive = { ...e.responsive };
                delete responsive[breakpoint];
                return { ...e, responsive };
              }),
            })),
          };
        });
      },

      removeElements(pageId, ids) {
        const idSet = new Set(ids);
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => ({
              ...p,
              elements: reindex(p.elements.filter((e) => !idSet.has(e.id))),
            })),
          };
        });
      },

      duplicateElements(pageId, ids) {
        const idSet = new Set(ids);
        const newIds = [];
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => {
              const dups = p.elements
                .filter((e) => idSet.has(e.id))
                .map((e) => {
                  const nid = newId('el');
                  newIds.push(nid);
                  return {
                    ...structuredClone(e),
                    id: nid,
                    name: `${e.name || e.type} copy`,
                    rect: { ...e.rect, x: (e.rect?.x || 0) + 16, y: (e.rect?.y || 0) + 16 },
                  };
                });
              return { ...p, elements: reindex([...p.elements, ...dups]) };
            }),
          };
        });
        return newIds;
      },

      reorder(pageId, id, toIndex) {
        set((s) => {
          if (!s.project) return s;
          return {
            project: mapPage(s.project, pageId, (p) => {
              const els = [...p.elements];
              const from = els.findIndex((e) => e.id === id);
              if (from === -1) return p;
              const [moved] = els.splice(from, 1);
              const clamped = Math.max(0, Math.min(toIndex, els.length));
              els.splice(clamped, 0, moved);
              return { ...p, elements: reindex(els) };
            }),
          };
        });
      },

      bringToFront(pageId, id) {
        const p = get().project?.pages.find((pg) => pg.id === pageId);
        if (p) get().reorder(pageId, id, p.elements.length - 1);
      },
      sendToBack(pageId, id) {
        get().reorder(pageId, id, 0);
      },

      setElementFlag(pageId, id, flag, value) {
        get().updateElement(pageId, id, { [flag]: value });
      },
      renameElement(pageId, id, name) {
        get().updateElement(pageId, id, { name });
      },

      addPage(name = 'Page') {
        const id = newId('page');
        set((s) => {
          if (!s.project) return s;
          return {
            project: {
              ...s.project,
              pages: [...s.project.pages, { id, name, canvas: { background: '#ffffff' }, elements: [] }],
            },
          };
        });
        return id;
      },
      removePage(pageId) {
        set((s) => {
          if (!s.project || s.project.pages.length <= 1) return s;
          return { project: { ...s.project, pages: s.project.pages.filter((p) => p.id !== pageId) } };
        });
      },
      renamePage(pageId, name) {
        set((s) => (s.project ? { project: mapPage(s.project, pageId, (p) => ({ ...p, name })) } : s));
      },
      updatePageCanvas(pageId, patch) {
        set((s) =>
          s.project
            ? { project: mapPage(s.project, pageId, (p) => ({ ...p, canvas: { ...p.canvas, ...patch } })) }
            : s,
        );
      },
    }),
    {
      limit: 100,
      partialize: (state) => ({ project: state.project }),
    },
  ),
);
