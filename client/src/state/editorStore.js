import { create } from 'zustand';

/** UI/editor state. Deliberately NOT tracked by undo/redo. */
export const useEditorStore = create((set) => ({
  selectedIds: [],
  activePageId: null,
  breakpoint: 'desktop', // 'desktop' | 'tablet' | 'mobile'
  zoom: 1,
  grid: { enabled: true, size: 8, snap: true },
  guides: true,
  previewMode: false,
  tool: 'select',
  gizmo: 'translate', // 3D transform gizmo mode: 'translate' | 'rotate' | 'scale'
  serverId: null, // server uuid for the loaded project (null = local-only)
  saveStatus: 'idle', // 'idle' | 'saving' | 'cloud' | 'local'

  select: (ids) => set({ selectedIds: Array.isArray(ids) ? ids : ids ? [ids] : [] }),
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clearSelect: () => set({ selectedIds: [] }),

  setBreakpoint: (breakpoint) => set({ breakpoint }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, Number(zoom) || 1)) }),
  setGrid: (patch) => set((s) => ({ grid: { ...s.grid, ...patch } })),
  setGuides: (guides) => set({ guides }),
  setActivePage: (activePageId) => set({ activePageId, selectedIds: [] }),
  setPreview: (previewMode) => set({ previewMode }),
  setTool: (tool) => set({ tool }),
  setGizmo: (gizmo) => set({ gizmo }),
  setServerId: (serverId) => set({ serverId }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}));

export const BREAKPOINTS = {
  desktop: { label: 'Desktop', width: 1280 },
  tablet: { label: 'Tablet', width: 768 },
  mobile: { label: 'Mobile', width: 375 },
};
