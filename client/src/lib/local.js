/** localStorage-backed project cache (offline-first autosave + fast restore). */
const P = 'prism:project:';
const INDEX = 'prism:index';
const LAST = 'prism:lastId';

function readIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX) || '{}');
  } catch {
    return {};
  }
}

export function saveLocal(project, serverId = null) {
  localStorage.setItem(P + project.id, JSON.stringify(project));
  const index = readIndex();
  index[project.id] = {
    id: project.id,
    name: project.name,
    serverId: serverId ?? index[project.id]?.serverId ?? null,
    updatedAt: Date.now(),
  };
  localStorage.setItem(INDEX, JSON.stringify(index));
  localStorage.setItem(LAST, project.id);
}

export function loadLocal(id) {
  const raw = localStorage.getItem(P + id);
  return raw ? JSON.parse(raw) : null;
}

export function listLocal() {
  return Object.values(readIndex()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getServerId(id) {
  return readIndex()[id]?.serverId || null;
}

export function deleteLocal(id) {
  localStorage.removeItem(P + id);
  const index = readIndex();
  delete index[id];
  localStorage.setItem(INDEX, JSON.stringify(index));
  if (localStorage.getItem(LAST) === id) localStorage.removeItem(LAST);
}

export function getLastId() {
  return localStorage.getItem(LAST);
}
