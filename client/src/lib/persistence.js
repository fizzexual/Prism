import { api } from './api.js';
import * as local from './local.js';

// When the server is unreachable, stop hammering it for a cooldown window so we
// don't spam failed requests on every keystroke. localStorage still saves.
const SERVER_COOLDOWN_MS = 30000;
let serverDownUntil = 0;

/**
 * Persist a project: always to localStorage (instant, offline-safe), then
 * best-effort to the server. Backs off for a cooldown after a failure.
 * Returns the sync status and any server id so the caller can remember it.
 */
export async function syncSave(project, serverId) {
  local.saveLocal(project, serverId);
  if (Date.now() < serverDownUntil) return { status: 'local', serverId };
  try {
    if (serverId) {
      await api.saveProject(serverId, { name: project.name, document: project });
      serverDownUntil = 0;
      return { status: 'cloud', serverId };
    }
    const row = await api.createProject({ name: project.name, document: project });
    local.saveLocal(project, row.id);
    serverDownUntil = 0;
    return { status: 'cloud', serverId: row.id };
  } catch {
    serverDownUntil = Date.now() + SERVER_COOLDOWN_MS;
    return { status: 'local', serverId };
  }
}

/** Merge server + local project listings (server entries win on id collision). */
export async function listAllProjects() {
  const localList = local.listLocal().map((p) => ({ ...p, where: 'local' }));
  try {
    const serverList = await api.listProjects();
    const serverIds = new Set(serverList.map((p) => p.id));
    const merged = serverList.map((p) => ({ id: p.id, name: p.name, serverId: p.id, where: 'cloud', updatedAt: new Date(p.updated_at).getTime() }));
    for (const p of localList) {
      if (!p.serverId || !serverIds.has(p.serverId)) merged.push(p);
    }
    return merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return localList;
  }
}

export async function deleteProject(entry) {
  if (entry.serverId) {
    try {
      await api.deleteProject(entry.serverId);
    } catch {
      /* ignore — still remove locally */
    }
  }
  local.deleteLocal(entry.id);
}
