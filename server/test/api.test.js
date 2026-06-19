import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

/** Minimal in-memory implementation of the repo interface for API tests. */
function createMemoryRepo() {
  const projects = new Map();
  let seq = 0;
  const uid = () => `id-${++seq}`;
  const stamp = () => new Date().toISOString();

  return {
    async listProjects() {
      // eslint-disable-next-line no-unused-vars
      return [...projects.values()].map(({ document, ...rest }) => rest);
    },
    async createProject({ name, document = { pages: [] }, thumbnail = null }) {
      const id = uid();
      const now = stamp();
      const row = { id, name, document, thumbnail, created_at: now, updated_at: now };
      projects.set(id, row);
      return row;
    },
    async getProject(id) {
      return projects.get(id) || null;
    },
    async updateProject(id, patch) {
      const row = projects.get(id);
      if (!row) return null;
      Object.assign(row, patch, { updated_at: stamp() });
      return row;
    },
    async deleteProject(id) {
      return projects.delete(id);
    },
    async addAsset() { throw new Error('not exercised in CRUD tests'); },
    async listAssets() { return []; },
    async getAsset() { return null; },
    async deleteAsset() { return null; },
  };
}

describe('projects API', () => {
  let app;
  beforeEach(() => {
    app = createApp({ repo: createMemoryRepo() });
  });

  test('CRUD roundtrip', async () => {
    const created = await request(app)
      .post('/api/projects')
      .send({ name: 'T', document: { pages: [] } })
      .expect(201);
    const id = created.body.id;
    expect(created.body.name).toBe('T');

    await request(app).get(`/api/projects/${id}`).expect(200)
      .then((r) => expect(r.body.name).toBe('T'));

    await request(app).put(`/api/projects/${id}`).send({ name: 'T2' }).expect(200)
      .then((r) => expect(r.body.name).toBe('T2'));

    await request(app).get('/api/projects').expect(200)
      .then((r) => expect(r.body.some((p) => p.id === id)).toBe(true));

    await request(app).delete(`/api/projects/${id}`).expect(204);
    await request(app).get(`/api/projects/${id}`).expect(404);
  });

  test('POST without a name is rejected with 400', async () => {
    await request(app).post('/api/projects').send({}).expect(400);
  });

  test('health check responds ok', async () => {
    await request(app).get('/api/health').expect(200)
      .then((r) => expect(r.body.ok).toBe(true));
  });
});
