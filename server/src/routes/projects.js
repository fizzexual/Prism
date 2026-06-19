import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

const withUrl = (asset) => ({ ...asset, url: `/uploads/${asset.filename}` });

/** Project CRUD + project-scoped asset upload/list. */
export function projectsRouter(repo, uploadsDir) {
  const router = Router();

  const upload = uploadsDir
    ? multer({
        storage: multer.diskStorage({
          destination: uploadsDir,
          filename: (req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname) || ''}`),
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
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
    } catch (err) { next(err); }
  });

  router.get('/:id/assets', async (req, res, next) => {
    try {
      const assets = await repo.listAssets(req.params.id);
      res.json(assets.map(withUrl));
    } catch (err) { next(err); }
  });

  return router;
}
