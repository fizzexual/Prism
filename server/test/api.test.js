import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Minimal in-memory implementation of the repo interface for API tests. */
function createMemoryRepo() {
  const projects = new Map();
  let seq = 0;
  const uid = () => { seq++; return randomUUID(); };
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

describe('API hardening', () => {
  let app;
  beforeEach(() => {
    app = createApp({ repo: createMemoryRepo() });
  });

  test('a malformed project id is a 404, not a 500 that leaks database text', async () => {
    const r = await request(app).get('/api/projects/not-a-uuid').expect(404);
    expect(JSON.stringify(r.body)).not.toMatch(/uuid|syntax/i);
  });

  test('unexpected errors return a generic message', async () => {
    const repo = createMemoryRepo();
    repo.listProjects = async () => { throw new Error('relation "projects" secret detail'); };
    const r = await request(createApp({ repo })).get('/api/projects').expect(500);
    expect(r.body).toEqual({ error: 'Server error' });
  });

  test('document must be an object', async () => {
    await request(app).post('/api/projects').send({ name: 'T', document: null }).expect(400);
    await request(app).post('/api/projects').send({ name: 'T', document: [] }).expect(400);
    const created = await request(app).post('/api/projects').send({ name: 'T', document: {} }).expect(201);
    await request(app).put(`/api/projects/${created.body.id}`).send({ document: 'x' }).expect(400);
    await request(app).put(`/api/projects/${created.body.id}`).send({ name: 42 }).expect(400);
  });

  test('CORS only answers local origins', async () => {
    const evil = await request(app).get('/api/projects').set('Origin', 'https://evil.example');
    expect(evil.headers['access-control-allow-origin']).toBeUndefined();
    const local = await request(app).get('/api/projects').set('Origin', 'http://localhost:5173');
    expect(local.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});

describe('asset uploads', () => {
  let dir;
  let app;
  let projectId;
  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'prism-up-'));
    const repo = createMemoryRepo();
    repo.addAsset = async (pid, a) => {
      if (!(await repo.getProject(pid))) throw Object.assign(new Error('fk violation'), { code: '23503' });
      return { id: randomUUID(), project_id: pid, ...a };
    };
    app = createApp({ repo, uploadsDir: dir });
    projectId = (await request(app).post('/api/projects').send({ name: 'T', document: {} })).body.id;
  });

  test('accepts an image and serves it with hardened headers', async () => {
    const r = await request(app).post(`/api/projects/${projectId}/assets`)
      .attach('file', Buffer.from([0x89, 0x50, 0x4e, 0x47]), { filename: 'a.png', contentType: 'image/png' }).expect(201);
    expect(r.body.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    const f = await request(app).get(r.body.url).expect(200);
    expect(f.headers['x-content-type-options']).toBe('nosniff');
    expect(f.headers['content-security-policy']).toMatch(/sandbox/);
  });

  test('rejects HTML and SVG uploads and leaves no file behind', async () => {
    await request(app).post(`/api/projects/${projectId}/assets`)
      .attach('file', Buffer.from('<script>alert(1)</script>'), { filename: 'evil.html', contentType: 'text/html' }).expect(415);
    await request(app).post(`/api/projects/${projectId}/assets`)
      .attach('file', Buffer.from('<svg onload=alert(1)/>'), { filename: 'evil.svg', contentType: 'image/svg+xml' }).expect(415);
    await request(app).post(`/api/projects/${projectId}/assets`)
      .attach('file', Buffer.from('x'), { filename: 'evil.html', contentType: 'image/png' }).expect(415);
    expect(readdirSync(dir)).toEqual([]);
  });

  test('an upload to a missing project is removed from disk', async () => {
    await request(app).post(`/api/projects/${randomUUID()}/assets`)
      .attach('file', Buffer.from([1, 2, 3]), { filename: 'a.png', contentType: 'image/png' }).expect(404);
    expect(readdirSync(dir)).toEqual([]);
  });
});
