import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// ---------------------------------------------------------------------------
// Catalog data — kept in sync with the technology catalog JSON.
// ---------------------------------------------------------------------------
const CATALOG_SKILLS = [
  { id: 'cplusplus', name: 'C++', category: 'language' },
  { id: 'csharp', name: 'C#', category: 'language' },
  { id: 'docker', name: 'Docker', category: 'platform' },
  { id: 'git', name: 'Git', category: 'tool' },
  { id: 'java', name: 'Java', category: 'language' },
  { id: 'javascript', name: 'JavaScript', category: 'language' },
  { id: 'nodejs', name: 'Node.js', category: 'runtime' },
  { id: 'react', name: 'React', category: 'library' },
  { id: 'react-native', name: 'React Native', category: 'framework' },
  { id: 'sql', name: 'SQL', category: 'language' },
] as const;

// ---------------------------------------------------------------------------
// seedCatalog
// ---------------------------------------------------------------------------
/**
 * Idempotent upsert of the technology skill catalog into `app.skills`.
 *
 * Uses `INSERT … ON CONFLICT (id) DO UPDATE` so repeated runs are safe.
 *
 * @param db - A Drizzle database instance (schema not required for this seed).
 * @returns The number of rows affected (inserted or updated).
 */
export async function seedCatalog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: NodePgDatabase<any>,
): Promise<number> {
  // Build a single multi-row INSERT with ON CONFLICT upsert.
  const values = CATALOG_SKILLS.map((s) => sql`(${s.id}, ${s.name}, ${s.category})`);

  const result = await db.execute(sql`
    INSERT INTO app.skills (id, name, category)
    VALUES ${sql.join(values, sql`, `)}
    ON CONFLICT (id) DO UPDATE
      SET name     = EXCLUDED.name,
          category = EXCLUDED.category
  `);

  // `pg` exposes the row count via `rowCount`.
  return (result as unknown as { rowCount: number }).rowCount ?? CATALOG_SKILLS.length;
}
