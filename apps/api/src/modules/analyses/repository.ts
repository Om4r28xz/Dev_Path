import { withStoredEvidence } from './evidence.js';
import { createHash, randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryConfig, QueryResultRow } from 'pg';
import { HttpError } from '../../platform/errors/http-error.js';
import type { JobsProvider } from '../jobs/services/provider.js';
import { deadlineFailure, dependencyFailure, type AnalysisEngine } from './engine-client.js';
import { CATALOG_VERSION, type AnalysisCommand } from './schemas.js';

export interface AnalysisRow extends QueryResultRow {
  id: string;
  user_id: string;
  request_hash: string;
  job_title: string | null;
  job_text: unknown;
  evidence: unknown;
  required_skill_ids: string[];
  matched_skill_ids: string[];
  missing_skill_ids: string[];
  compatibility_percentage: number | null;
  candidate_skills_revision: number;
  catalog_version: string;
  extractor_version: string;
  scoring_version: string;
  warnings: string[];
  created_at: Date;
}
export function analysisDto(row: AnalysisRow, currentRevision: number, jsearchProviderId?: string) {
  return withStoredEvidence(
    {
      id: row.id,
      source: jsearchProviderId
        ? { type: 'jsearch' as const, title: row.job_title, providerId: jsearchProviderId }
        : { type: 'text' as const, title: row.job_title },
      candidateSkillsRevision: row.candidate_skills_revision,
      requiredSkillIds: row.required_skill_ids,
      matchedSkillIds: row.matched_skill_ids,
      missingSkillIds: row.missing_skill_ids,
      compatibilityPercentage: row.compatibility_percentage,
      versions: {
        catalog: row.catalog_version,
        extractor: row.extractor_version,
        scoring: row.scoring_version,
      },
      warnings: row.warnings,
      skillsOutdated: currentRevision !== row.candidate_skills_revision,
      createdAt: row.created_at.toISOString(),
    },
    row.evidence,
    row.job_text,
  );
}
function conflict(): HttpError {
  return new HttpError({
    status: 409,
    code: 'IDEMPOTENCY_KEY_REUSED',
    message: 'La clave ya se usó para una solicitud diferente.',
  });
}
function retentionNotPermitted(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message:
      'El almacenamiento de análisis para vacantes live de JSearch permanece deshabilitado hasta confirmar permisos de retención del proveedor.',
  });
}
export interface AnalysesRepositoryOptions {
  readonly jobsProvider?: JobsProvider | undefined;
  readonly liveRetentionPermitted?: boolean | undefined;
}
export class AnalysesRepository {
  constructor(
    private readonly pool: Pool,
    private readonly engine: AnalysisEngine,
    private readonly budgetMs = 5000,
    private readonly options?: AnalysesRepositoryOptions,
  ) {}
  async create(owner: string, key: string, command: AnalysisCommand, requestId: string) {
    const deadline = Date.now() + this.budgetMs;
    const signal = AbortSignal.timeout(this.budgetMs);
    const hashPayload =
      command.source.type === 'text'
        ? {
            source: {
              type: 'text',
              title: command.source.title ?? null,
              text: command.source.text,
            },
          }
        : {
            source: {
              type: 'jsearch',
              providerId: command.source.providerId,
            },
          };
    const hash = createHash('sha256').update(JSON.stringify(hashPayload)).digest('hex');
    const jsearchProviderId =
      command.source.type === 'jsearch' ? command.source.providerId : undefined;
    let client: PoolClient | undefined;
    let acquired = false;
    const pending = this.pool.connect();
    try {
      // A queued pool acquisition must not silently exceed the manual API budget.
      client = await new Promise<PoolClient>((resolve, reject) => {
        const abort = () => reject(deadlineFailure());
        signal.addEventListener('abort', abort, { once: true });
        pending.then(
          (connection) => {
            signal.removeEventListener('abort', abort);
            if (signal.aborted) {
              connection.release();
              return;
            }
            acquired = true;
            resolve(connection);
          },
          (error: unknown) => {
            signal.removeEventListener('abort', abort);
            reject(error);
          },
        );
      });
      const connection = client;
      const query = async <T extends QueryResultRow = QueryResultRow>(
        text: string,
        values: unknown[] = [],
      ): Promise<T[]> => {
        const remaining = deadline - Date.now();
        if (remaining <= 0 || signal.aborted) throw deadlineFailure();
        const config = (
          sql: string,
          parameters: unknown[],
          timeout: number,
        ): QueryConfig<unknown[]> & { query_timeout: number } => ({
          text: sql,
          values: parameters,
          query_timeout: Math.max(1, timeout),
        });
        // pg supports query_timeout per query; its pinned older typings omit that optional field.
        // statement_timeout cancels server work too; query_timeout bounds a lost network response.
        if (text !== 'BEGIN' && text !== 'COMMIT')
          await connection.query(
            config(
              "SELECT set_config('statement_timeout',$1,true)",
              [String(Math.max(1, remaining))],
              remaining,
            ),
          );
        return (await connection.query<T>(config(text, values, deadline - Date.now()))).rows;
      };
      await query('BEGIN');
      // Serialize only this owner's idempotency key, before inspecting the stored result.
      await query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [owner + ':' + key]);
      const profile = (
        await query<{ skills_revision: number }>(
          'SELECT skills_revision FROM app.profiles WHERE user_id=$1 FOR SHARE',
          [owner],
        )
      )[0];
      if (!profile)
        throw new HttpError({
          status: 404,
          code: 'NOT_FOUND',
          message: 'No se encontró el perfil.',
        });
      const existing = (
        await query<AnalysisRow>(
          'SELECT * FROM app.analyses WHERE user_id=$1 AND idempotency_key=$2',
          [owner, key],
        )
      )[0];
      if (existing) {
        if (existing.request_hash !== hash) throw conflict();
        await query('COMMIT');
        return {
          created: false,
          analysis: analysisDto(existing, profile.skills_revision, jsearchProviderId),
        };
      }
      let resolvedTitle: string | null;
      let resolvedText: string;
      if (command.source.type === 'text') {
        resolvedTitle = command.source.title ?? null;
        resolvedText = command.source.text;
      } else {
        const provider = this.options?.jobsProvider;
        if (!provider) throw dependencyFailure();
        if (provider.mode === 'live' && this.options?.liveRetentionPermitted !== true) {
          throw retentionNotPermitted();
        }
        const detailsResult = await provider.details({
          providerId: command.source.providerId,
          signal,
        });
        resolvedTitle = detailsResult.job.title.trim().slice(0, 120) || null;
        resolvedText = detailsResult.job.description;
      }
      const skills = await query<{ skill_id: string }>(
        'SELECT skill_id FROM app.user_skills WHERE user_id=$1 ORDER BY skill_id',
        [owner],
      );
      const known = await query<{ id: string }>('SELECT id FROM app.skills ORDER BY id');
      const ids = skills.map((row) => row.skill_id);
      if (ids.length > 100) throw dependencyFailure();
      const result = await this.engine.analyze(
        { catalogVersion: CATALOG_VERSION, jobText: resolvedText, candidateSkillIds: ids },
        new Set(known.map((row) => row.id)),
        requestId,
        signal,
      );
      const warnings = result.requiredSkillIds.length === 0 ? ['NO_TECHNOLOGIES_DETECTED'] : [];
      const rows = await query<AnalysisRow>(
        'INSERT INTO app.analyses(id,user_id,idempotency_key,request_hash,job_title,job_text,candidate_skill_ids,required_skill_ids,matched_skill_ids,missing_skill_ids,compatibility_percentage,candidate_skills_revision,catalog_version,extractor_version,scoring_version,evidence,warnings) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *',
        [
          randomUUID(),
          owner,
          key,
          hash,
          resolvedTitle,
          resolvedText,
          ids,
          result.requiredSkillIds,
          result.matchedSkillIds,
          result.missingSkillIds,
          result.matchPercentage,
          profile.skills_revision,
          result.versions.catalog,
          result.versions.extractor,
          result.versions.scoring,
          JSON.stringify(result.evidence),
          warnings,
        ],
      );
      await query('COMMIT');
      return {
        created: true,
        analysis: analysisDto(rows[0]!, profile.skills_revision, jsearchProviderId),
      };
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => undefined);
      if (error instanceof HttpError) throw error;
      if (
        signal.aborted ||
        (typeof error === 'object' && error !== null && 'code' in error && error.code === '57014')
      )
        throw deadlineFailure();
      throw dependencyFailure();
    } finally {
      if (acquired) client?.release();
    }
  }
}
