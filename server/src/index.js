import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createPool, runMigrations } from './db.js';
import { createPgRepo } from './repo.js';
import { createApp } from './app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '..', 'uploads');

const pool = createPool();
const repo = createPgRepo(pool);
const app = createApp({ repo, uploadsDir });

const port = Number(process.env.PORT) || 9998;

async function start() {
  try {
    await runMigrations(pool);
    console.log('[prism] database ready');
  } catch (err) {
    console.warn('[prism] WARNING: database unavailable — API running, but project persistence is disabled.');
    console.warn('[prism] Start PostgreSQL then apply migrations:  docker compose up -d db  &&  npm run migrate');
    console.warn(`[prism] (${err.message || err.code || 'connection failed'})`);
  }
  app.listen(port, () => console.log(`[prism] API listening on http://localhost:${port}`));
}

start();

export { app, pool };
