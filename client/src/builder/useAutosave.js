import { useEffect } from 'react';
import { useBuilder, useUI } from './store.js';
import { syncSave, saveLocal, getServerId } from './persist.js';
import { createAutosaver } from './autosaver.js';

/** Debounced autosave (local + best-effort server), flushed when the page is hidden or closed. */
export function useAutosave(delay = 800) {
  useEffect(() => {
    const saver = createAutosaver({
      delay,
      save: syncSave,
      saveLocalNow: saveLocal,
      // The local index is the per-project source of truth; the UI copy covers a project not yet indexed.
      getServerId: (id) => getServerId(id) || (useBuilder.getState().project?.id === id ? useUI.getState().serverId : null),
      rememberServerId: () => {}, // syncSave already records a newly created server id in the index
      getCurrentId: () => useBuilder.getState().project?.id ?? null,
      onStatus: (s) => useUI.getState().setSaveStatus(s),
      onServerId: (sid) => useUI.getState().setServerId(sid),
    });
    const unsub = useBuilder.subscribe((state, prev) => {
      if (!state.project || state.project === prev.project) return;
      saver.schedule(state.project);
    });
    const flush = () => saver.flush();
    const onVisibility = () => { if (document.visibilityState === 'hidden') saver.flush(); };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      saver.flush();
      saver.dispose();
      unsub();
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [delay]);
}
