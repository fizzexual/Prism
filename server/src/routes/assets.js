import { Router } from 'express';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';

/** Delete an asset by id (and its file on disk). */
export function assetsRouter(repo, uploadsDir) {
  const router = Router();

  router.delete('/:id', async (req, res, next) => {
    try {
      const deleted = await repo.deleteAsset(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      if (uploadsDir && deleted.filename) {
        await unlink(join(uploadsDir, deleted.filename)).catch(() => {});
      }
      res.status(204).end();
    } catch (err) { next(err); }
  });

  return router;
}
