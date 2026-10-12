import express from 'express';
import cors from 'cors';
import { projectsRouter } from './routes/projects.js';
import { assetsRouter } from './routes/assets.js';

// The API has no auth, so by default only pages served from this machine may call it
// cross-origin (any other website could otherwise list/delete every project).
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/**
 * Build the Express app. `repo` is injected so the API can be tested with an
 * in-memory fake (no database required). `uploadsDir`, when provided, enables
 * multipart upload storage and static serving of uploaded assets.
 * `corsOrigin` (string | RegExp | array) lets a deployment allow its own client origin.
 */
export function createApp({ repo, uploadsDir, corsOrigin = LOCAL_ORIGIN } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/projects', projectsRouter(repo, uploadsDir));
  app.use('/api/assets', assetsRouter(repo, uploadsDir));

  if (uploadsDir) {
    app.use('/uploads', express.static(uploadsDir, {
      setHeaders: (res) => {
        // Uploaded files are data, never a page: no sniffing, no scripts even if one slips through.
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
      },
    }));
  }

  // Centralized error handler. Connection errors (DB down) are common in
  // local/dev use — log them as a single concise line, not a full stack dump.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const code = err.code || err.errors?.[0]?.code;
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      console.warn(`[api] database unavailable (${code}) — ${req.method} ${req.originalUrl}`);
      return res.status(503).json({ error: 'Database unavailable' });
    }
    if (code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Document too large' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      console.error('[api error]', err.message || err);
      return res.status(500).json({ error: 'Server error' }); // never echo internal (e.g. SQL) messages
    }
    return res.status(status).json({ error: err.expose ? err.message : 'Bad request' });
  });

  return app;
}
