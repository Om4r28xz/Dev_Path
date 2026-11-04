import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { HttpError } from '../../platform/errors/http-error.js';
import {
  encodeProjectCursor,
  type ProjectCursor,
  type ProjectCreate,
  type ProjectUpdate,
} from './validation.js';

interface ProjectRow extends QueryResultRow {
  id: string;
  title: string;
  description: string;
  url: string | null;
  skill_ids: string[];
  created_at: Date;
  updated_at: Date;
  cursor_created_at: string;
}
const selectProject = `SELECT p.id,p.title,p.description,p.url,p.created_at,p.updated_at,
  to_char(p.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_created_at,
  COALESCE(s.skill_ids, ARRAY[]::text[]) AS skill_ids
  FROM app.projects p LEFT JOIN LATERAL (
    SELECT array_agg(skill_id ORDER BY skill_id) AS skill_ids FROM app.project_skills WHERE project_id=p.id
  ) s ON true`;
function dto(row: ProjectRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    skillIds: row.skill_ids,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
export function projectNotFound(): HttpError {
  return new HttpError({ status: 404, code: 'NOT_FOUND', message: 'No se encontró el proyecto.' });
}
function unavailable(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'No fue posible acceder a proyectos.',
  });
}
async function validateSkills(client: PoolClient, ids: readonly string[]) {
  if (ids.length === 0) return;
  const result = await client.query<{ id: string }>(
    'SELECT id FROM app.skills WHERE id=ANY($1::text[])',
    [ids],
  );
  if (result.rows.length !== ids.length)
    throw new HttpError({
      status: 400,
      code: 'SKILL_IDS_UNKNOWN',
      message: 'Hay tecnologías desconocidas.',
      fields: { skillIds: ['Selecciona tecnologías del catálogo.'] },
    });
}
async function replaceSkills(client: PoolClient, id: string, ids: readonly string[]) {
  await client.query('DELETE FROM app.project_skills WHERE project_id=$1', [id]);
  if (ids.length > 0)
    await client.query(
      'INSERT INTO app.project_skills(project_id,skill_id) SELECT $1,unnest($2::text[])',
      [id, ids],
    );
}
export class ProjectsRepository {
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
        /* Preserve the original error. */
      }
      if (error instanceof HttpError) throw error;
      throw unavailable();
    } finally {
      client.release();
    }
  }
  private async load(client: PoolClient, owner: string, id: string) {
    const row = (
      await client.query<ProjectRow>(selectProject + ' WHERE p.user_id=$1 AND p.id=$2', [owner, id])
    ).rows[0];
    if (!row) throw projectNotFound();
    return dto(row);
  }
  async list(owner: string, limit: number, after: ProjectCursor | undefined) {
    const rows = await this.query<ProjectRow>(
      selectProject +
        ' WHERE p.user_id=$1 AND ($2::timestamptz IS NULL OR (p.created_at,p.id)<($2::timestamptz,$3::uuid)) ORDER BY p.created_at DESC,p.id DESC LIMIT $4',
      [owner, after?.createdAt ?? null, after?.id ?? null, limit + 1],
    );
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map(dto),
      nextCursor:
        rows.length > limit && last
          ? encodeProjectCursor(owner, last.cursor_created_at, last.id)
          : null,
    };
  }
  async get(owner: string, id: string) {
    const row = (
      await this.query<ProjectRow>(selectProject + ' WHERE p.user_id=$1 AND p.id=$2', [owner, id])
    )[0];
    if (!row) throw projectNotFound();
    return dto(row);
  }
  async create(owner: string, value: ProjectCreate) {
    return this.transaction(async (client) => {
      const profile = await client.query(
        'SELECT user_id FROM app.profiles WHERE user_id=$1 FOR UPDATE',
        [owner],
      );
      if (!profile.rows[0]) throw projectNotFound();
      await validateSkills(client, value.skillIds);
      const created = await client.query<{ id: string }>(
        'INSERT INTO app.projects(user_id,title,description,url) VALUES($1,$2,$3,$4) RETURNING id',
        [owner, value.title, value.description, value.url ?? null],
      );
      const id = created.rows[0]!.id;
      await replaceSkills(client, id, value.skillIds);
      await client.query(
        'UPDATE app.profiles SET projects_revision=projects_revision+1 WHERE user_id=$1',
        [owner],
      );
      return this.load(client, owner, id);
    });
  }
  async update(owner: string, id: string, value: ProjectUpdate) {
    return this.transaction(async (client) => {
      const profile = await client.query(
        'SELECT user_id FROM app.profiles WHERE user_id=$1 FOR UPDATE',
        [owner],
      );
      if (!profile.rows[0]) throw projectNotFound();
      const exists = await client.query(
        'SELECT id FROM app.projects WHERE user_id=$1 AND id=$2 FOR UPDATE',
        [owner, id],
      );
      if (!exists.rows[0]) throw projectNotFound();
      if (value.skillIds !== undefined) await validateSkills(client, value.skillIds);
      const columns: string[] = ['updated_at=now()'];
      const parameters: unknown[] = [owner, id];
      for (const key of ['title', 'description', 'url'] as const) {
        if (value[key] !== undefined) {
          parameters.push(value[key]);
          columns.push(key + '=$' + parameters.length);
        }
      }
      await client.query(
        'UPDATE app.projects SET ' + columns.join(',') + ' WHERE user_id=$1 AND id=$2',
        parameters,
      );
      if (value.skillIds !== undefined) await replaceSkills(client, id, value.skillIds);
      await client.query(
        'UPDATE app.profiles SET projects_revision=projects_revision+1 WHERE user_id=$1',
        [owner],
      );
      return this.load(client, owner, id);
    });
  }
  async delete(owner: string, id: string): Promise<void> {
    await this.transaction(async (client) => {
      const profile = await client.query(
        'SELECT user_id FROM app.profiles WHERE user_id=$1 FOR UPDATE',
        [owner],
      );
      if (!profile.rows[0]) throw projectNotFound();
      const deleted = await client.query(
        'DELETE FROM app.projects WHERE user_id=$1 AND id=$2 RETURNING id',
        [owner, id],
      );
      if (!deleted.rows[0]) throw projectNotFound();
      await client.query(
        'UPDATE app.profiles SET projects_revision=projects_revision+1 WHERE user_id=$1',
        [owner],
      );
    });
  }
}
