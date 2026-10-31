import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

export * from './pool.js';
export * from './schema/index.js';

export type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// ---------------------------------------------------------------------------
// createDb
// ---------------------------------------------------------------------------
/**
 * Creates a Drizzle ORM database instance bound to the provided `pg.Pool`.
 *
 * @param pool - An active `pg.Pool`, typically created with {@link createPool}.
 * @returns A fully-typed Drizzle database instance with the full DevPath schema.
 *
 * @example
 * ```ts
 * import { createPool, createDb } from '@devpath/db';
 *
 * const pool = createPool(process.env.DATABASE_URL!);
 * const db = createDb(pool);
 * ```
 */
export function createDb(pool: import('pg').Pool) {
  return drizzle(pool, { schema });
}
