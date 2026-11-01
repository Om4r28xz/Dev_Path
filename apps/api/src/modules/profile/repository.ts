import type { Pool, PoolClient } from 'pg';

import { HttpError } from '../../platform/errors/http-error.js';

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  location: string | null;
  skills_revision: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProfileUpdate {
  name?: string | undefined;
  headline?: string | null | undefined;
  location?: string | null | undefined;
}

export interface SkillRow {
  id: string;
  name: string;
  category: string;
}

const PROFILE_SELECT =
  'SELECT u.id,u.email,u.created_at,p.full_name AS name,p.headline,p.location,p.skills_revision,p.updated_at FROM auth.users u JOIN app.profiles p ON p.user_id=u.id WHERE u.id=$1';

export class ProfileRepository {
  constructor(private readonly pool: Pool) {}

  async getProfile(userId: string): Promise<ProfileRow | undefined> {
    const result = await this.pool.query<ProfileRow>(PROFILE_SELECT, [userId]);
    return result.rows[0];
  }

  async updateProfile(userId: string, update: ProfileUpdate): Promise<ProfileRow | undefined> {
    const columns: string[] = [];
    const values: unknown[] = [userId];
    if (update.name !== undefined) {
      values.push(update.name);
      columns.push('full_name=$' + values.length);
    }
    if (update.headline !== undefined) {
      values.push(update.headline);
      columns.push('headline=$' + values.length);
    }
    if (update.location !== undefined) {
      values.push(update.location);
      columns.push('location=$' + values.length);
    }
    columns.push('updated_at=now()');
    const result = await this.pool.query<ProfileRow>(
      'WITH changed AS (UPDATE app.profiles SET ' +
        columns.join(',') +
        ' WHERE user_id=$1 RETURNING user_id,full_name AS name,headline,location,skills_revision,updated_at) ' +
        'SELECT u.id,u.email,u.created_at,c.name,c.headline,c.location,c.skills_revision,c.updated_at FROM auth.users u JOIN changed c ON c.user_id=u.id',
      values,
    );
    return result.rows[0];
  }

  async listSkills(
    search: string | undefined,
    after: string | undefined,
    limit: number,
  ): Promise<SkillRow[]> {
    const pattern = search === undefined ? null : '%' + search.replace(/[%_\\]/gu, '\\$&') + '%';
    const result = await this.pool.query<SkillRow>(
      "SELECT id,name,category FROM app.skills WHERE ($1::text IS NULL OR name ILIKE $1 ESCAPE '\\' OR id ILIKE $1 ESCAPE '\\') AND ($2::text IS NULL OR id>$2) ORDER BY id LIMIT $3",
      [pattern, after ?? null, limit + 1],
    );
    return result.rows;
  }

  async getUserSkills(
    userId: string,
  ): Promise<{ skillIds: string[]; revision: number } | undefined> {
    const result = await this.pool.query<{ skills_revision: number; skill_ids: string[] }>(
      'SELECT p.skills_revision,COALESCE(array_agg(s.skill_id ORDER BY s.skill_id) FILTER (WHERE s.skill_id IS NOT NULL),ARRAY[]::text[]) AS skill_ids FROM app.profiles p LEFT JOIN app.user_skills s ON s.user_id=p.user_id WHERE p.user_id=$1 GROUP BY p.skills_revision',
      [userId],
    );
    const row = result.rows[0];
    return row === undefined
      ? undefined
      : { skillIds: row.skill_ids, revision: row.skills_revision };
  }

  async replaceUserSkills(
    userId: string,
    skillIds: readonly string[],
  ): Promise<{ skillIds: string[]; revision: number } | undefined> {
    return this.transaction(async (client) => {
      const profile = await client.query<{ skills_revision: number }>(
        'SELECT skills_revision FROM app.profiles WHERE user_id=$1 FOR UPDATE',
        [userId],
      );
      if (profile.rows[0] === undefined) return undefined;
      if (skillIds.length > 0) {
        const found = await client.query<{ id: string }>(
          'SELECT id FROM app.skills WHERE id=ANY($1::text[])',
          [skillIds],
        );
        if (found.rows.length !== skillIds.length)
          throw new HttpError({
            status: 400,
            code: 'VALIDATION_ERROR',
            message: 'Hay habilidades desconocidas.',
          });
      }
      await client.query('DELETE FROM app.user_skills WHERE user_id=$1', [userId]);
      if (skillIds.length > 0)
        await client.query(
          'INSERT INTO app.user_skills(user_id,skill_id) SELECT $1,unnest($2::text[])',
          [userId, skillIds],
        );
      const updated = await client.query<{ skills_revision: number }>(
        'UPDATE app.profiles SET skills_revision=skills_revision+1,updated_at=now() WHERE user_id=$1 RETURNING skills_revision',
        [userId],
      );
      return {
        skillIds: [...skillIds].sort(),
        revision: updated.rows[0]!.skills_revision,
      };
    });
  }

  private async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
