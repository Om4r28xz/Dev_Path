import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { HttpError } from '../../platform/errors/http-error.js';

export interface CvRow extends QueryResultRow {
  id: string;
  user_id: string;
  storage_key: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: Date;
}
export function cvDto(row: CvRow) {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at.toISOString(),
  };
}
export function cvMissing(): HttpError {
  return new HttpError({ status: 404, code: 'NOT_FOUND', message: 'No se encontró el CV.' });
}
function unavailable(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'No fue posible acceder a los metadatos del CV.',
  });
}
export class CvRepository {
  constructor(private readonly pool: Pool) {}
  private async query<T extends QueryResultRow>(sql: string, values: unknown[]): Promise<T[]> {
    try {
      return (await this.pool.query<T>(sql, values)).rows;
    } catch {
      throw unavailable();
    }
  }
  private async transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch {
      throw unavailable();
    }
    try {
      await client.query('BEGIN');
      const result = await run(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* Preserve original error. */
      }
      if (error instanceof HttpError) throw error;
      throw unavailable();
    } finally {
      client.release();
    }
  }
  async get(owner: string): Promise<CvRow | undefined> {
    return (await this.query<CvRow>('SELECT * FROM app.cv_files WHERE user_id=$1', [owner]))[0];
  }
  async replace(
    owner: string,
    storageKey: string,
    originalName: string,
    sizeBytes: number,
  ): Promise<{ current: CvRow; oldKey: string | undefined }> {
    return this.transaction(async (client) => {
      const profile = await client.query(
        'SELECT user_id FROM app.profiles WHERE user_id=$1 FOR UPDATE',
        [owner],
      );
      if (!profile.rows[0]) throw cvMissing();
      const old = (
        await client.query<CvRow>('SELECT * FROM app.cv_files WHERE user_id=$1', [owner])
      ).rows[0];
      const current = (
        await client.query<CvRow>(
          `INSERT INTO app.cv_files(user_id,storage_key,original_name,mime_type,size_bytes)
         VALUES($1,$2,$3,'application/pdf',$4)
         ON CONFLICT (user_id) DO UPDATE SET id=gen_random_uuid(),storage_key=EXCLUDED.storage_key,
           original_name=EXCLUDED.original_name,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,created_at=now()
         RETURNING *`,
          [owner, storageKey, originalName, sizeBytes],
        )
      ).rows[0]!;
      if (old)
        await client.query(
          'INSERT INTO app.cv_cleanup(storage_key) VALUES($1) ON CONFLICT DO NOTHING',
          [old.storage_key],
        );
      return { current, oldKey: old?.storage_key };
    });
  }
  async detach(owner: string): Promise<string | undefined> {
    return this.transaction(async (client) => {
      const profile = await client.query(
        'SELECT user_id FROM app.profiles WHERE user_id=$1 FOR UPDATE',
        [owner],
      );
      if (!profile.rows[0]) throw cvMissing();
      const old = (
        await client.query<CvRow>('DELETE FROM app.cv_files WHERE user_id=$1 RETURNING *', [owner])
      ).rows[0];
      if (old)
        await client.query(
          'INSERT INTO app.cv_cleanup(storage_key) VALUES($1) ON CONFLICT DO NOTHING',
          [old.storage_key],
        );
      return old?.storage_key;
    });
  }
  async pendingKeys(): Promise<string[]> {
    return (
      await this.query<{ storage_key: string }>(
        'SELECT storage_key FROM app.cv_cleanup ORDER BY created_at LIMIT 100',
        [],
      )
    ).map((row) => row.storage_key);
  }
  async isReferenced(key: string): Promise<boolean> {
    return (await this.query('SELECT 1 FROM app.cv_files WHERE storage_key=$1', [key])).length > 0;
  }
  async clearPending(key: string): Promise<void> {
    await this.query('DELETE FROM app.cv_cleanup WHERE storage_key=$1', [key]);
  }
}
