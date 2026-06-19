import { useEffect } from 'react';
import { useDocumentStore } from '../state/documentStore.js';
import { useEditorStore } from '../state/editorStore.js';
import { syncSave } from './persistence.js';

/**
 * Debounced autosave: whenever the document changes, write to localStorage and
 * best-effort sync to the server, updating the save-status indicator.
 */
export function useAutosave(delay = 800) {
  useEffect(() => {
    let timer = null;
    let cancelled = false;

    const unsub = useDocumentStore.subscribe((state, prev) => {
      if (!state.project || state.project === prev.project) return;
      const ed = useEditorStore.getState();
      ed.setSaveStatus('saving');
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const project = useDocumentStore.getState().project;
        const result = await syncSave(project, useEditorStore.getState().serverId);
        if (cancelled) return;
        if (result.serverId) useEditorStore.getState().setServerId(result.serverId);
        useEditorStore.getState().setSaveStatus(result.status);
      }, delay);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsub();
    };
  }, [delay]);
}
