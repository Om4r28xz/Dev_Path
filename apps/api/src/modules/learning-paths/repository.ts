import { createHash } from 'node:crypto';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { HttpError } from '../../platform/errors/http-error.js';
import {
  generateLearningPathPlan,
  type CatalogDocument,
  type LearningTemplatesDocument,
  type ProjectSummaryForPath,
} from './generator.js';

export type LearningStepStatus = 'pending' | 'in_progress' | 'completed';

export interface LearningPathHeaderRow extends QueryResultRow {
  id: string;
  user_id: string;
  analysis_id: string;
  idempotency_key: string;
  request_hash: string;
  projects_revision: number;
  catalog_version: string;
  content_version: string;
  generator_version: string;
  input_snapshot: unknown;
  message: string | null;
  created_at: Date;
  updated_at: Date;
  cursor_created_at?: string;
}

export interface LearningPathStepDbRow extends QueryResultRow {
  id: string;
  learning_path_id: string;
  step_order: number;
  title: string;
  activity: string;
  reason: string;
  skill_ids: string[];
  project_id: string | null;
  resource_url: string | null;
  status: LearningStepStatus;
  completed_at: Date | null;
}

export interface LearningStepDto {
  id: string;
  title: string;
  activity: string;
  reason: string;
  skillIds: string[];
  projectId: string | null;
  resourceUrl: string | null;
  status: LearningStepStatus;
  completedAt: string | null;
}

export interface LearningProgressDto {
  completed: number;
  total: number;
  percentage: number | null;
}

export interface LearningPathDto {
  id: string;
  analysisId: string;
  projectsRevision: number;
  versions: {
    catalog: string;
    content: string;
    generator: string;
  };
  steps: LearningStepDto[];
  progress: LearningProgressDto;
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export function deriveLearningProgress(
  steps: readonly { readonly status: LearningStepStatus }[],
): LearningProgressDto {
  const total = steps.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: null };
  }
  const completed = steps.filter((step) => step.status === 'completed').length;
  return {
    completed,
    total,
    percentage: Math.round((100 * completed) / total),
  };
}

export function learningPathDto(
  header: LearningPathHeaderRow,
  stepRows: readonly LearningPathStepDbRow[],
): LearningPathDto {
  const steps: LearningStepDto[] = stepRows.map((row) => ({
    id: row.id,
    title: row.title,
    activity: row.activity,
    reason: row.reason,
    skillIds: row.skill_ids,
    projectId: row.project_id,
    resourceUrl: row.resource_url,
    status: row.status,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  }));

  return {
    id: header.id,
    analysisId: header.analysis_id,
    projectsRevision: header.projects_revision,
    versions: {
      catalog: header.catalog_version,
      content: header.content_version,
      generator: header.generator_version,
    },
    steps,
    progress: deriveLearningProgress(steps),
    message: header.message,
    createdAt: header.created_at.toISOString(),
    updatedAt: header.updated_at.toISOString(),
  };
}

export function learningPathNotFound(): HttpError {
  return new HttpError({
    status: 404,
    code: 'NOT_FOUND',
    message: 'No se encontró la ruta de aprendizaje solicitada.',
  });
}

function analysisForPathNotFound(): HttpError {
  return new HttpError({
    status: 404,
    code: 'NOT_FOUND',
    message: 'No se encontró el análisis solicitado.',
  });
}

function idempotencyConflict(): HttpError {
  return new HttpError({
    status: 409,
    code: 'IDEMPOTENCY_KEY_REUSED',
    message: 'La clave ya se usó para una solicitud diferente.',
  });
}

function dependencyUnavailable(): HttpError {
  return new HttpError({
    status: 503,
    code: 'DEPENDENCY_UNAVAILABLE',
    message: 'No fue posible acceder a las rutas de aprendizaje.',
  });
}

export interface LearningPathsRepositoryOptions {
  readonly templatesDoc?: LearningTemplatesDocument | undefined;
  readonly catalogDoc?: CatalogDocument | undefined;
}

interface AnalysisSnapshotRow extends QueryResultRow {
  id: string;
  required_skill_ids: string[];
  matched_skill_ids: string[];
  missing_skill_ids: string[];
  candidate_skills_revision: number;
  catalog_version: string;
  projects_revision: number;
}

interface OwnedProjectRow extends QueryResultRow {
  id: string;
  title: string;
  skill_ids: string[];
}

export class LearningPathsRepository {
  constructor(
    private readonly pool: Pool,
    private readonly options?: LearningPathsRepositoryOptions,
  ) {}

  private async transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch {
      throw dependencyUnavailable();
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
        /* Preserve the original failure. */
      }
      if (error instanceof HttpError) throw error;
      throw dependencyUnavailable();
    } finally {
      client.release();
    }
  }

  protected async loadByIdWithClient(
    client: PoolClient,
    owner: string,
    id: string,
  ): Promise<LearningPathDto> {
    const headerResult = await client.query<LearningPathHeaderRow>(
      `SELECT * FROM app.learning_paths WHERE user_id = $1 AND id = $2`,
      [owner, id],
    );
    const header = headerResult.rows[0];
    if (!header) throw learningPathNotFound();

    const stepsResult = await client.query<LearningPathStepDbRow>(
      `SELECT * FROM app.learning_path_steps
       WHERE learning_path_id = $1
       ORDER BY step_order ASC, id ASC`,
      [header.id],
    );
    return learningPathDto(header, stepsResult.rows);
  }

  async create(
    owner: string,
    idempotencyKey: string,
    analysisId: string,
  ): Promise<{ status: 200 | 201; body: LearningPathDto }> {
    const requestHash = createHash('sha256').update(JSON.stringify({ analysisId })).digest('hex');

    return this.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [
        owner,
        idempotencyKey,
      ]);

      const existingResult = await client.query<{ id: string; request_hash: string }>(
        `SELECT id, request_hash
         FROM app.learning_paths
         WHERE user_id = $1 AND idempotency_key = $2`,
        [owner, idempotencyKey],
      );
      const existing = existingResult.rows[0];
      if (existing) {
        if (existing.request_hash !== requestHash) {
          throw idempotencyConflict();
        }
        const storedDto = await this.loadByIdWithClient(client, owner, existing.id);
        return { status: 200, body: storedDto };
      }

      const analysisResult = await client.query<AnalysisSnapshotRow>(
        `SELECT a.id,
                a.required_skill_ids,
                a.matched_skill_ids,
                a.missing_skill_ids,
                a.candidate_skills_revision,
                a.catalog_version,
                p.projects_revision
         FROM app.analyses a
         JOIN app.profiles p ON p.user_id = a.user_id
         WHERE a.user_id = $1 AND a.id = $2`,
        [owner, analysisId],
      );
      const analysis = analysisResult.rows[0];
      if (!analysis) {
        throw analysisForPathNotFound();
      }

      const projectsResult = await client.query<OwnedProjectRow>(
        `SELECT p.id,
                p.title,
                COALESCE(s.skill_ids, ARRAY[]::text[]) AS skill_ids
         FROM app.projects p
         LEFT JOIN LATERAL (
           SELECT array_agg(skill_id ORDER BY skill_id) AS skill_ids
           FROM app.project_skills
           WHERE project_id = p.id
         ) s ON true
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC, p.id DESC`,
        [owner],
      );

      const projects: ProjectSummaryForPath[] = projectsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        skillIds: row.skill_ids,
      }));

      const plan = generateLearningPathPlan(
        {
          catalogVersion: analysis.catalog_version,
          matchedSkillIds: analysis.matched_skill_ids,
          missingSkillIds: analysis.missing_skill_ids,
          projects,
        },
        this.options?.templatesDoc,
        this.options?.catalogDoc,
      );

      const inputSnapshot = {
        analysisId: analysis.id,
        requiredSkillIds: analysis.required_skill_ids,
        matchedSkillIds: analysis.matched_skill_ids,
        missingSkillIds: analysis.missing_skill_ids,
        candidateSkillsRevision: analysis.candidate_skills_revision,
        projectsRevision: analysis.projects_revision,
        projectIds: projects.map((proj) => proj.id),
      };

      const insertedHeaderResult = await client.query<LearningPathHeaderRow>(
        `INSERT INTO app.learning_paths (
           user_id,
           analysis_id,
           idempotency_key,
           request_hash,
           projects_revision,
           catalog_version,
           content_version,
           generator_version,
           input_snapshot,
           message
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
         RETURNING *`,
        [
          owner,
          analysis.id,
          idempotencyKey,
          requestHash,
          analysis.projects_revision,
          plan.versions.catalog,
          plan.versions.content,
          plan.versions.generator,
          JSON.stringify(inputSnapshot),
          plan.message,
        ],
      );
      const insertedHeader = insertedHeaderResult.rows[0]!;

      const insertedSteps: LearningPathStepDbRow[] = [];
      for (const step of plan.steps) {
        const stepResult = await client.query<LearningPathStepDbRow>(
          `INSERT INTO app.learning_path_steps (
             learning_path_id,
             step_order,
             title,
             activity,
             reason,
             skill_ids,
             project_id,
             resource_url,
             status,
             completed_at
           )
           VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8, 'pending', NULL)
           RETURNING *`,
          [
            insertedHeader.id,
            step.stepOrder,
            step.title,
            step.activity,
            step.reason,
            step.skillIds,
            step.projectId,
            step.resourceUrl,
          ],
        );
        insertedSteps.push(stepResult.rows[0]!);
      }

      return {
        status: 201,
        body: learningPathDto(insertedHeader, insertedSteps),
      };
    });
  }
}
