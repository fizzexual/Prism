import express from 'express';
import cors from 'cors';
import { projectsRouter } from './routes/projects.js';
import { assetsRouter } from './routes/assets.js';

/**
 * Build the Express app. `repo` is injected so the API can be tested with an
 * in-memory fake (no database required). `uploadsDir`, when provided, enables
 * multipart upload storage and static serving of uploaded assets.
 */
export function createApp({ repo, uploadsDir } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/projects', projectsRouter(repo, uploadsDir));
  app.use('/api/assets', assetsRouter(repo, uploadsDir));

  if (uploadsDir) app.use('/uploads', express.static(uploadsDir));

  // Centralized error handler. Connection errors (DB down) are common in
  // local/dev use — log them as a single concise line, not a full stack dump.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const code = err.code || err.errors?.[0]?.code;
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      console.warn(`[api] database unavailable (${code}) — ${req.method} ${req.originalUrl}`);
      return res.status(503).json({ error: 'Database unavailable' });
    }
    console.error('[api error]', err.message || err);
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  });

  return app;
}
