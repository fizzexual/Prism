const BASE = import.meta.env.VITE_API_BASE || '';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => req('/api/health'),
  listProjects: () => req('/api/projects'),
  createProject: (p) => req('/api/projects', { method: 'POST', body: JSON.stringify(p) }),
  getProject: (id) => req(`/api/projects/${id}`),
  saveProject: (id, patch) => req(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteProject: (id) => req(`/api/projects/${id}`, { method: 'DELETE' }),
  listAssets: (projectId) => req(`/api/projects/${projectId}/assets`),
  deleteAsset: (id) => req(`/api/assets/${id}`, { method: 'DELETE' }),
  async uploadAsset(projectId, file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${BASE}/api/projects/${projectId}/assets`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
};
