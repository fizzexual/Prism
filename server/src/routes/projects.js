import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { unlink } from 'node:fs/promises';

const withUrl = (asset) => ({ ...asset, url: `/uploads/${asset.filename}` });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Images and 3D models only. SVG and HTML can carry script, so they are refused.
// The stored extension comes from this list, never from the client's file name alone.
const ALLOWED = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.avif': ['image/avif'],
  '.glb': ['model/gltf-binary', 'application/octet-stream'],
  '.gltf': ['model/gltf+json', 'application/json', 'application/octet-stream'],
  '.obj': ['model/obj', 'text/plain', 'application/octet-stream'],
  '.fbx': ['application/octet-stream'],
};
const allowedUpload = (file) => {
  const ext = extname(file.originalname || '').toLowerCase();
  return Boolean(ALLOWED[ext]?.includes(file.mimetype));
};
const isDocument = (d) => d !== null && typeof d === 'object' && !Array.isArray(d);

/** Project CRUD + project-scoped asset upload/list. */
export function projectsRouter(repo, uploadsDir) {
  const router = Router();

  // Ids are UUIDs: anything else can't exist (and would make Postgres throw a 500).
  router.param('id', (req, res, next, id) => (UUID.test(id) ? next() : res.status(404).json({ error: 'Not found' })));

  const upload = uploadsDir
    ? multer({
        storage: multer.diskStorage({
          destination: uploadsDir,
          filename: (req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (allowedUpload(file)) return cb(null, true);
          cb(Object.assign(new Error('Only images (png, jpg, gif, webp, avif) and 3D models (glb, gltf, obj, fbx) are allowed'), { status: 415, expose: true }));
        },
      })
    : multer();

  router.get('/', async (req, res, next) => {
    try {
      res.json(await repo.listProjects());
    } catch (err) { next(err); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { name, document, thumbnail } = req.body || {};
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'name is required' });
      }
      if (document !== undefined && !isDocument(document)) {
        return res.status(400).json({ error: 'document must be an object' });
      }
      res.status(201).json(await repo.createProject({ name, document, thumbnail }));
    } catch (err) { next(err); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const project = await repo.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: 'Not found' });
      res.json(project);
    } catch (err) { next(err); }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const patch = {};
      const body = req.body || {};
      for (const key of ['name', 'document', 'thumbnail']) {
        if (key in body) patch[key] = body[key];
      }
      if ('name' in patch && (typeof patch.name !== 'string' || !patch.name)) {
        return res.status(400).json({ error: 'name must be a non-empty string' });
      }
      if ('document' in patch && !isDocument(patch.document)) {
        return res.status(400).json({ error: 'document must be an object' });
      }
      const project = await repo.updateProject(req.params.id, patch);
      if (!project) return res.status(404).json({ error: 'Not found' });
      res.json(project);
    } catch (err) { next(err); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const ok = await repo.deleteProject(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch (err) { next(err); }
  });

  router.post('/:id/assets', upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'file is required' });
      const asset = await repo.addAsset(req.params.id, {
        filename: req.file.filename,
        original: req.file.originalname,
        mime: req.file.mimetype,
        size: req.file.size,
      });
      res.status(201).json(withUrl(asset));
    } catch (err) {
      if (req.file?.path) await unlink(req.file.path).catch(() => {}); // don't leave orphan files
      if (err.code === '23503') return res.status(404).json({ error: 'Not found' }); // project doesn't exist
      next(err);
    }
  });

  router.get('/:id/assets', async (req, res, next) => {
    try {
      const assets = await repo.listAssets(req.params.id);
      res.json(assets.map(withUrl));
    } catch (err) { next(err); }
  });

  return router;
}
