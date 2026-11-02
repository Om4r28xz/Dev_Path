import type { Pool, QueryResultRow } from 'pg';
import { HttpError } from '../../platform/errors/http-error.js';
import { analysisDto, type AnalysisRow } from './repository.js';
import { encodeHistoryCursor, type HistoryCursor } from './history-cursor.js';
interface HistoryRow extends AnalysisRow {
  current_revision: number;
  cursor_created_at: string;
}
const selectHistory = `SELECT a.*,p.skills_revision AS current_revision,
  to_char(a.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_created_at
  FROM app.analyses a JOIN app.profiles p ON p.user_id=a.user_id`;
export function analysisNotFound(): HttpError {
  return new HttpError({
    status: 404,
    code: 'NOT_FOUND',
    message: 'No se encontró el análisis solicitado.',
  });
}
function unavailable(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'No fue posible acceder al historial de análisis.',
  });
}
export class AnalysisHistoryRepository {
  constructor(private readonly pool: Pool) {}
  private async query<T extends QueryResultRow>(text: string, values: unknown[]): Promise<T[]> {
    try {
      return (await this.pool.query<T>(text, values)).rows;
    } catch {
      throw unavailable();
    } // Raw driver errors can contain connection details/parameters.
  }
  async list(owner: string, limit: number, after: HistoryCursor | undefined) {
    // Preserve microseconds in the keyset boundary; JavaScript Date truncates them.
    const rows = await this.query<HistoryRow>(
      selectHistory +
        ' WHERE a.user_id=$1 AND ($2::timestamptz IS NULL OR (a.created_at,a.id)<($2::timestamptz,$3::uuid)) ORDER BY a.created_at DESC NULLS LAST,a.id DESC NULLS LAST LIMIT $4',
      [owner, after?.createdAt ?? null, after?.id ?? null, limit + 1],
    );
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((row) => ({
        id: row.id,
        source: { type: 'text' as const, title: row.job_title },
        compatibilityPercentage: row.compatibility_percentage,
        skillsOutdated: row.current_revision !== row.candidate_skills_revision,
        createdAt: row.created_at.toISOString(),
      })),
      nextCursor:
        rows.length > limit && last
          ? encodeHistoryCursor(owner, last.cursor_created_at, last.id)
          : null,
    };
  }
  async detail(owner: string, id: string) {
    const row = (
      await this.query<HistoryRow>(selectHistory + ' WHERE a.user_id=$1 AND a.id=$2', [owner, id])
    )[0];
    if (!row) throw analysisNotFound();
    return analysisDto(row, row.current_revision);
  }
  async delete(owner: string, id: string): Promise<void> {
    // A single owner-filtered delete prevents authorization/check-then-delete races.
    const rows = await this.query<{ id: string }>(
      'DELETE FROM app.analyses WHERE user_id=$1 AND id=$2 RETURNING id',
      [owner, id],
    );
    if (rows.length === 0) throw analysisNotFound();
  }
}
