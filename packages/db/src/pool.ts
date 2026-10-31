import pg from 'pg';

const { Pool } = pg;
export type { Pool };

// ---------------------------------------------------------------------------
// RuntimeResource — minimal lifecycle interface used by the API server.
// ---------------------------------------------------------------------------
export interface RuntimeResource {
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// createPool
// ---------------------------------------------------------------------------
/**
 * Creates a new `pg.Pool` with production-safe defaults.
 *
 * @param databaseUrl - Full PostgreSQL connection string, e.g.
 *   `postgres://user:pass@host:5432/dbname`.
 */
export function createPool(databaseUrl: string): pg.Pool {
  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

// ---------------------------------------------------------------------------
// poolResource
// ---------------------------------------------------------------------------
/**
 * Wraps a `pg.Pool` as a {@link RuntimeResource} so it can be registered with
 * `installGracefulShutdown` in the API package.
 */
export function poolResource(pool: pg.Pool): RuntimeResource {
  return {
    close: () => pool.end(),
  };
}
