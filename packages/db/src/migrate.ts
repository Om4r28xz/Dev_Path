/**
 * Standalone migration runner.
 *
 * Usage (from packages/db):
 *   DATABASE_URL=postgres://... pnpm migrate
 *
 * Reads DATABASE_URL from the environment, applies all pending Drizzle
 * migrations found in ./migrations, then cleanly closes the pool.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createPool } from './pool.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, '..', 'migrations');

const pool = createPool(databaseUrl);

try {
  const db = drizzle(pool);
  console.log('Running migrations from:', migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log('Migrations applied successfully.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
