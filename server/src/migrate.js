import 'dotenv/config';
import { createPool, runMigrations } from './db.js';

const pool = createPool();

runMigrations(pool)
  .then(() => {
    console.log('[migrate] all migrations applied');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] failed:', err.message || err.code || 'is PostgreSQL running and DATABASE_URL set?');
    process.exit(1);
  });
