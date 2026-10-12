import { api } from '../lib/api.js';

// Namespaced separately from the legacy app so old data never contaminates.
const P = 'prismx:project:';
const INDEX = 'prismx:index';
const LAST = 'prismx:lastId';

function readIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX) || '{}');
  } catch {
    return {};
  }
}

/** Record a project in the index (name, server id, last-opened). Small, so it fits even when the full document doesn't. */
export function rememberProject(project, serverId = null) {
  const idx = readIndex();
  idx[project.id] = {
    id: project.id,
    name: project.name,
    serverId: serverId ?? idx[project.id]?.serverId ?? null,
    updatedAt: Date.now(),
  };
  localStorage.setItem(INDEX, JSON.stringify(idx));
  localStorage.setItem(LAST, project.id);
}

/** Write the full document locally. Throws (e.g. QuotaExceededError) when storage is full. */
export function saveLocal(project, serverId = null) {
  localStorage.setItem(P + project.id, JSON.stringify(project));
  rememberProject(project, serverId);
}

export function loadLocal(id) {
  try {
    const raw = localStorage.getItem(P + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function listLocal() {
  return Object.values(readIndex()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getServerId(id) {
  return readIndex()[id]?.serverId || null;
}
export function getLastId() {
  return localStorage.getItem(LAST);
}
export function deleteLocal(id) {
  localStorage.removeItem(P + id);
  const idx = readIndex();
  delete idx[id];
  localStorage.setItem(INDEX, JSON.stringify(idx));
  if (localStorage.getItem(LAST) === id) localStorage.removeItem(LAST);
}

/** Validate a loaded object is a real builder project (guards against stale shapes). */
export function isValidProject(p) {
  return Boolean(p && p.instances && Array.isArray(p.pages) && p.pages[0]?.rootId && p.instances[p.pages[0].rootId]);
}

let serverDownUntil = 0;

/**
 * Save locally, then best-effort to the server. A full localStorage must not
 * stop the server save. Status: 'cloud' | 'local' | 'error' (saved nowhere).
 */
export async function syncSave(project, serverId) {
  let localOk = true;
  try {
    saveLocal(project, serverId);
  } catch {
    localOk = false;
  }
  const offline = { status: localOk ? 'local' : 'error', serverId };
  if (Date.now() < serverDownUntil) return offline;
  try {
    if (serverId) {
      await api.saveProject(serverId, { name: project.name, document: project });
      serverDownUntil = 0;
      return { status: 'cloud', serverId };
    }
    const row = await api.createProject({ name: project.name, document: project });
    try { rememberProject(project, row.id); } catch { /* index is tiny; ignore */ }
    serverDownUntil = 0;
    return { status: 'cloud', serverId: row.id };
  } catch {
    serverDownUntil = Date.now() + 30000;
    return offline;
  }
}

export async function listAll() {
  const local = listLocal().map((p) => ({ ...p, where: 'local' }));
  try {
    const server = await api.listProjects();
    const serverIds = new Set(server.map((p) => p.id));
    const merged = server.map((p) => ({ id: p.id, name: p.name, serverId: p.id, where: 'cloud', updatedAt: new Date(p.updated_at).getTime() }));
    for (const p of local) if (!p.serverId || !serverIds.has(p.serverId)) merged.push(p);
    return merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return local;
  }
}

export async function deleteProject(entry) {
  if (entry.serverId) {
    try {
      await api.deleteProject(entry.serverId);
    } catch {
      /* ignore */
    }
  }
  deleteLocal(entry.id);
}
