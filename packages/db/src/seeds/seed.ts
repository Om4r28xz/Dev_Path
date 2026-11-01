/**
 * Seed entry point.
 *
 * Usage (from packages/db):
 *   DATABASE_URL=postgres://... pnpm seed
 */

import { createPool, createDb } from '../index.js';
import { seedCatalog } from './catalog-seed.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const pool = createPool(databaseUrl);
const db = createDb(pool);

try {
  console.log('Seeding skill catalog…');
  const count = await seedCatalog(db);
  console.log(`✓ app.skills — ${count} row(s) upserted.`);
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
