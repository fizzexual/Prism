/**
 * Debounced, serialized autosave.
 *
 * - schedule(project): debounce a save of the latest version.
 * - flush(): write the pending version to local storage right now (page hide /
 *   unload), then queue the server save. Nothing typed in the last `delay` ms
 *   is lost on reload.
 * - Switching to another project flushes the old one first.
 * - Saves run one at a time, so a slow first create can't be duplicated and an
 *   older PUT can't land after a newer one.
 * - Results for a project the user already left don't touch the UI.
 */
export function createAutosaver({
  delay = 800,
  save, // async (project, serverId) => { status, serverId }
  saveLocalNow, // (project, serverId) => void, may throw
  getServerId, // (projectId) => serverId | null
  rememberServerId, // (projectId, serverId) => void
  getCurrentId, // () => id of the project open in the editor
  onStatus, // (status) => void
  onServerId, // (serverId) => void
}) {
  let timer = null;
  let pending = null;
  let chain = Promise.resolve();

  const isCurrent = (id) => getCurrentId() === id;

  function enqueue(project) {
    chain = chain.then(async () => {
      let result;
      try {
        result = await save(project, getServerId(project.id));
      } catch {
        result = { status: 'error', serverId: null };
      }
      if (result.serverId) rememberServerId(project.id, result.serverId);
      if (!isCurrent(project.id)) return;
      if (result.serverId) onServerId(result.serverId);
      onStatus(result.status);
    });
    return chain;
  }

  function fire() {
    clearTimeout(timer);
    timer = null;
    const project = pending;
    pending = null;
    if (project) enqueue(project);
  }

  return {
    schedule(project) {
      if (pending && pending.id !== project.id) this.flush();
      pending = project;
      onStatus('saving');
      clearTimeout(timer);
      timer = setTimeout(fire, delay);
    },
    flush() {
      if (!pending) return;
      try {
        saveLocalNow(pending, getServerId(pending.id));
      } catch {
        /* storage full: the queued save below still tries the server */
      }
      fire();
    },
    dispose() {
      clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
