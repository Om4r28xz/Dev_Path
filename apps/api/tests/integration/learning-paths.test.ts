import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { RequestHandler } from 'express';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { LearningTemplatesDocument } from '../../src/modules/learning-paths/generator.js';
import { learningPathsRouter } from '../../src/modules/learning-paths/router.js';
import { projectsRouter } from '../../src/modules/projects/router.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { HttpError } from '../../src/platform/errors/http-error.js';

const defaultTemplatesDoc = JSON.parse(
  readFileSync(
    new URL('../../../../packages/catalog/learning-templates.json', import.meta.url),
    'utf8',
  ),
) as LearningTemplatesDocument;

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)(
  'LRN-02 learning paths generation and persistence with PostgreSQL',
  () => {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const ownerA = randomUUID();
    const ownerB = randomUUID();
    const analysisWithGapsId = randomUUID();
    const analysisZeroGapsId = randomUUID();
    const analysisOwnerBId = randomUUID();

    const authenticate: RequestHandler = (request, response, next) => {
      const token = request.get('Authorization');
      const owner =
        token === 'Bearer owner-a' ? ownerA : token === 'Bearer owner-b' ? ownerB : undefined;
      if (!owner) {
        return next(
          new HttpError({
            status: 401,
            code: 'UNAUTHENTICATED',
            message: 'Se requiere autenticación.',
          }),
        );
      }
      response.locals.userId = owner;
      next();
    };

    let server: ReturnType<ReturnType<typeof createApp>['listen']>;
    let base: string;

    const call = (
      route: string,
      options: {
        token?: string | null;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      } = {},
    ) => {
      const headers: Record<string, string> = { ...(options.headers ?? {}) };
      const token = options.token === undefined ? 'owner-a' : options.token;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }
      return fetch(`${base}/api/v1${route}`, {
        method: options.method ?? 'GET',
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      });
    };

    beforeAll(async () => {
      for (const [index, id] of [ownerA, ownerB].entries()) {
        await pool.query('INSERT INTO auth.users(id, email, password_hash) VALUES ($1, $2, $3)', [
          id,
          `lrn02-${index}-${id}@example.test`,
          'synthetic-hash',
        ]);
        await pool.query(
          'INSERT INTO app.profiles(id, user_id, full_name, skills_revision, projects_revision) VALUES ($1, $2, $3, 1, 0)',
          [randomUUID(), id, `Learner ${index}`],
        );
      }

      // Owner A has JavaScript in personal skills
      await pool.query('INSERT INTO app.user_skills(id, user_id, skill_id) VALUES ($1, $2, $3)', [
        randomUUID(),
        ownerA,
        'javascript',
      ]);

      // Analysis with gaps for Owner A: required = [docker, javascript, react], matched = [javascript], missing = [docker, react]
      // Note: docker has prerequisite 'git' which is NOT in matchedSkillIds -> should expand 'git' before 'docker'!
      await pool.query(
        `INSERT INTO app.analyses (
         id, user_id, idempotency_key, request_hash, candidate_skill_ids,
         job_title, job_text, required_skill_ids, matched_skill_ids, missing_skill_ids,
         compatibility_percentage, candidate_skills_revision, catalog_version, extractor_version, scoring_version
       )
       VALUES ($1, $2, $3, 'hash-gaps', ARRAY['javascript'], 'Vacante Fullstack', 'React, Docker y JS',
               ARRAY['docker', 'javascript', 'react'], ARRAY['javascript'], ARRAY['docker', 'react'],
               33, 1, '1.0.0', '1.0.0', '1.0.0')`,
        [analysisWithGapsId, ownerA, randomUUID()],
      );

      // Analysis with zero gaps for Owner A
      await pool.query(
        `INSERT INTO app.analyses (
         id, user_id, idempotency_key, request_hash, candidate_skill_ids,
         job_title, job_text, required_skill_ids, matched_skill_ids, missing_skill_ids,
         compatibility_percentage, candidate_skills_revision, catalog_version, extractor_version, scoring_version
       )
       VALUES ($1, $2, $3, 'hash-zero', ARRAY['javascript'], 'Vacante JS', 'Solo JavaScript',
               ARRAY['javascript'], ARRAY['javascript'], ARRAY[]::text[],
               100, 1, '1.0.0', '1.0.0', '1.0.0')`,
        [analysisZeroGapsId, ownerA, randomUUID()],
      );

      // Analysis owned by Owner B
      await pool.query(
        `INSERT INTO app.analyses (
         id, user_id, idempotency_key, request_hash, candidate_skill_ids,
         job_title, job_text, required_skill_ids, matched_skill_ids, missing_skill_ids,
         compatibility_percentage, candidate_skills_revision, catalog_version, extractor_version, scoring_version
       )
       VALUES ($1, $2, $3, 'hash-b', ARRAY[]::text[], 'Vacante B', 'Git',
               ARRAY['git'], ARRAY[]::text[], ARRAY['git'],
               0, 1, '1.0.0', '1.0.0', '1.0.0')`,
        [analysisOwnerBId, ownerB, randomUUID()],
      );

      const app = createApp({
        config: loadConfig({ NODE_ENV: 'test' }),
        configureRoutes: (expressApp) => {
          expressApp.use('/api/v1', projectsRouter(pool, authenticate));
          expressApp.use('/api/v1', learningPathsRouter(pool, authenticate));
        },
      });
      server = app.listen(0, '127.0.0.1');
      await once(server, 'listening');
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await pool.query('DELETE FROM auth.users WHERE id = ANY($1::uuid[])', [[ownerA, ownerB]]);
      await pool.end();
    });

    it('requires Bearer JWT (401) and validates Idempotency-Key and body (400)', async () => {
      const unauth = await call('/learning-paths', {
        token: null,
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { analysisId: analysisWithGapsId },
      });
      expect(unauth.status).toBe(401);

      const missingKey = await call('/learning-paths', {
        method: 'POST',
        body: { analysisId: analysisWithGapsId },
      });
      expect(missingKey.status).toBe(400);

      const invalidBody = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { analysisId: 'not-a-uuid' },
      });
      expect(invalidBody.status).toBe(400);
    });

    it('rejects foreign or non-existent analysisId with 404', async () => {
      const foreignRes = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { analysisId: analysisOwnerBId },
      });
      expect(foreignRes.status).toBe(404);

      const unknownRes = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { analysisId: randomUUID() },
      });
      expect(unknownRes.status).toBe(404);
    });

    it('generates deterministic path expanding uncovered prerequisites, links compatible project, and preserves idempotency across project/catalog changes', async () => {
      // Create a compatible project for Owner A with JavaScript
      const projRes = await call('/projects', {
        method: 'POST',
        body: {
          title: 'Mi Web JS',
          description: 'Proyecto frontend base.',
          url: 'https://example.org/mi-web-js',
          skillIds: ['javascript'],
        },
      });
      expect(projRes.status).toBe(201);
      const createdProject = (await projRes.json()) as { id: string };

      const idempotencyKey = randomUUID();
      const createRes = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: { analysisId: analysisWithGapsId },
      });
      expect(createRes.status).toBe(201);
      const createdPath = await createRes.json();

      expect(createRes.headers.get('location')).toBe(`/api/v1/learning-paths/${createdPath.id}`);
      expect(createdPath.analysisId).toBe(analysisWithGapsId);
      expect(createdPath.projectsRevision).toBe(1);
      expect(createdPath.versions).toEqual({
        catalog: '1.0.0',
        content: '1.0.0',
        generator: 'rules-1',
      });
      expect(createdPath.message).toBeNull();
      expect(createdPath.progress).toEqual({
        completed: 0,
        total: 3,
        percentage: 0,
      });

      // Missing were [docker, react], matched was [javascript].
      // 'git' is uncovered prerequisite for 'docker' (depth 0), while 'react' has prerequisite 'javascript' which is already matched (so 'react' has depth 0!), and 'docker' depends on 'git' (depth 1).
      // Thus ordered skills: ['git', 'react', 'docker']!
      expect(createdPath.steps.map((s: { skillIds: string[] }) => s.skillIds[0])).toEqual([
        'git',
        'react',
        'docker',
      ]);
      // Both 'git' and 'react' are compatible with a 'javascript' project; 'docker' is not compatible with ['javascript'] alone
      expect(createdPath.steps[0].projectId).toBe(createdProject.id);
      expect(createdPath.steps[0].activity).toContain('Mi Web JS');
      expect(createdPath.steps[1].projectId).toBe(createdProject.id);
      expect(createdPath.steps[1].activity).toContain('Mi Web JS');
      expect(createdPath.steps[2].projectId).toBeNull();

      // Verify input_snapshot persisted in DB and analysis score/user skills were not modified
      const dbRow = (
        await pool.query('SELECT input_snapshot FROM app.learning_paths WHERE id = $1', [
          createdPath.id,
        ])
      ).rows[0];
      expect(dbRow.input_snapshot).toEqual({
        analysisId: analysisWithGapsId,
        requiredSkillIds: ['docker', 'javascript', 'react'],
        matchedSkillIds: ['javascript'],
        missingSkillIds: ['docker', 'react'],
        candidateSkillsRevision: 1,
        projectsRevision: 1,
        projectIds: [createdProject.id],
      });

      // Mutate projects (add another project) and replay with the same Idempotency-Key:
      // Must return 200 with the exact original snapshot (projectsRevision = 1)
      await call('/projects', {
        method: 'POST',
        body: {
          title: 'Proyecto Docker posterior',
          description: 'Nuevo proyecto.',
          skillIds: ['docker'],
        },
      });

      const replayRes = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: { analysisId: analysisWithGapsId },
      });
      expect(replayRes.status).toBe(200);
      const replayedPath = await replayRes.json();
      expect(replayedPath).toEqual(createdPath);

      // Reusing the same Idempotency-Key with a different analysisId must return 409 IDEMPOTENCY_KEY_REUSED
      const conflictRes = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: { analysisId: analysisZeroGapsId },
      });
      expect(conflictRes.status).toBe(409);
      const conflictBody = await conflictRes.json();
      expect(conflictBody.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    });

    it('creates an explainable zero-step path when analysis has no missing skills', async () => {
      const res = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { analysisId: analysisZeroGapsId },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.steps).toEqual([]);
      expect(body.progress).toEqual({
        completed: 0,
        total: 0,
        percentage: null,
      });
      expect(body.message).toBe(defaultTemplatesDoc.zeroGapsMessage);
    });

    it('rolls back the learning_paths header if step insertion fails mid-transaction', async () => {
      const beforeCount = Number(
        (await pool.query('SELECT count(*) FROM app.learning_paths WHERE user_id = $1', [ownerA]))
          .rows[0].count,
      );

      // Proxy pool where inserting into app.learning_path_steps throws a database error
      const failingPool = {
        connect: async () => {
          const realClient = await pool.connect();
          const originalQuery = realClient.query.bind(realClient);
          return new Proxy(realClient, {
            get(target, prop, receiver) {
              if (prop === 'query') {
                return async (text: unknown, values?: unknown[]) => {
                  if (
                    typeof text === 'string' &&
                    text.includes('INSERT INTO app.learning_path_steps')
                  ) {
                    throw new Error('Simulated step insert failure');
                  }
                  return originalQuery(text as string, values as unknown[]);
                };
              }
              return Reflect.get(target, prop, receiver);
            },
          });
        },
      } as unknown as pg.Pool;

      const failingApp = createApp({
        config: loadConfig({ NODE_ENV: 'test' }),
        configureRoutes: (expressApp) => {
          expressApp.use('/api/v1', learningPathsRouter(failingPool, authenticate));
        },
      });
      const failingServer = failingApp.listen(0, '127.0.0.1');
      await once(failingServer, 'listening');
      const failingBase = `http://127.0.0.1:${(failingServer.address() as AddressInfo).port}`;

      try {
        const res = await fetch(`${failingBase}/api/v1/learning-paths`, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer owner-a',
            'Content-Type': 'application/json',
            'Idempotency-Key': randomUUID(),
          },
          body: JSON.stringify({ analysisId: analysisWithGapsId }),
        });
        expect(res.status).toBe(503);
      } finally {
        await new Promise<void>((resolve) => failingServer.close(() => resolve()));
      }

      const afterCount = Number(
        (await pool.query('SELECT count(*) FROM app.learning_paths WHERE user_id = $1', [ownerA]))
          .rows[0].count,
      );
      expect(afterCount).toBe(beforeCount);
    });

    it('LRN-03: lists, reads detail, updates step progress coherently, enforces ownership and step membership, preserves activity on project delete, and cascades on analysis delete', async () => {
      const lrn03AnalysisId = randomUUID();
      await pool.query(
        `INSERT INTO app.analyses (
           id, user_id, idempotency_key, request_hash, candidate_skill_ids,
           job_title, job_text, required_skill_ids, matched_skill_ids, missing_skill_ids,
           compatibility_percentage, candidate_skills_revision, catalog_version, extractor_version, scoring_version
         )
         VALUES ($1, $2, $3, 'hash-lrn03', ARRAY['javascript'], 'Vacante LRN-03', 'React y Node.js',
                 ARRAY['javascript', 'nodejs', 'react'], ARRAY['javascript'], ARRAY['nodejs', 'react'],
                 33, 1, '1.0.0', '1.0.0', '1.0.0')`,
        [lrn03AnalysisId, ownerA, randomUUID()],
      );

      const projRes = await call('/projects', {
        method: 'POST',
        body: {
          title: 'API & UI Base',
          description: 'Proyecto para conectar pasos.',
          skillIds: ['javascript'],
        },
      });
      expect(projRes.status).toBe(201);
      const project = (await projRes.json()) as { id: string };

      const createRes = await call('/learning-paths', {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: { analysisId: lrn03AnalysisId },
      });
      expect(createRes.status).toBe(201);
      const pathDto = await createRes.json();
      expect(pathDto.steps).toHaveLength(2);
      const [step1, step2] = pathDto.steps as Array<{
        id: string;
        activity: string;
        projectId: string | null;
      }>;
      expect(step1!.projectId).toBe(project.id);
      expect(step1!.activity).toContain('API & UI Base');

      // GET /learning-paths paginated list (limit=1 + cursor)
      const page1Res = await call('/learning-paths?limit=1');
      expect(page1Res.status).toBe(200);
      const page1 = await page1Res.json();
      expect(page1.items).toHaveLength(1);
      expect(page1.items[0].id).toBe(pathDto.id);
      expect(typeof page1.nextCursor).toBe('string');

      // Account B cannot use Account A's cursor (400 VALIDATION_ERROR)
      const foreignCursorRes = await call(
        `/learning-paths?cursor=${encodeURIComponent(page1.nextCursor)}`,
        { token: 'owner-b' },
      );
      expect(foreignCursorRes.status).toBe(400);

      const page2Res = await call(
        `/learning-paths?limit=1&cursor=${encodeURIComponent(page1.nextCursor)}`,
      );
      expect(page2Res.status).toBe(200);
      const page2 = await page2Res.json();
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0].id).not.toBe(pathDto.id);

      // GET /learning-paths/:id detail and cross-account 404
      const detailRes = await call(`/learning-paths/${pathDto.id}`);
      expect(detailRes.status).toBe(200);
      expect(await detailRes.json()).toEqual(pathDto);

      const foreignDetailRes = await call(`/learning-paths/${pathDto.id}`, { token: 'owner-b' });
      expect(foreignDetailRes.status).toBe(404);

      // Step transitions: pending -> in_progress -> completed -> completed (idempotent timestamp) -> pending (reopened)
      const inProgressRes = await call(`/learning-paths/${pathDto.id}/steps/${step1!.id}`, {
        method: 'PATCH',
        body: { status: 'in_progress' },
      });
      expect(inProgressRes.status).toBe(200);
      const inProgressDto = await inProgressRes.json();
      expect(inProgressDto.steps[0].status).toBe('in_progress');
      expect(inProgressDto.steps[0].completedAt).toBeNull();
      expect(inProgressDto.progress).toEqual({ completed: 0, total: 2, percentage: 0 });

      const completedRes = await call(`/learning-paths/${pathDto.id}/steps/${step1!.id}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      });
      expect(completedRes.status).toBe(200);
      const completedDto = await completedRes.json();
      expect(completedDto.steps[0].status).toBe('completed');
      const firstCompletedAt = completedDto.steps[0].completedAt;
      expect(typeof firstCompletedAt).toBe('string');
      expect(completedDto.progress).toEqual({ completed: 1, total: 2, percentage: 50 });

      // Repeating 'completed' keeps the exact same completedAt timestamp
      const repeatCompletedRes = await call(`/learning-paths/${pathDto.id}/steps/${step1!.id}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      });
      expect(repeatCompletedRes.status).toBe(200);
      const repeatCompletedDto = await repeatCompletedRes.json();
      expect(repeatCompletedDto.steps[0].completedAt).toBe(firstCompletedAt);

      // Completing a step must NEVER add skills to app.user_skills or alter analysis score
      const userSkillsRows = (
        await pool.query(
          'SELECT skill_id FROM app.user_skills WHERE user_id = $1 ORDER BY skill_id ASC',
          [ownerA],
        )
      ).rows;
      expect(userSkillsRows.map((r) => r.skill_id)).toEqual(['javascript']);

      // Reopening a completed step clears completedAt and updates derived progress
      const reopenRes = await call(`/learning-paths/${pathDto.id}/steps/${step1!.id}`, {
        method: 'PATCH',
        body: { status: 'pending' },
      });
      expect(reopenRes.status).toBe(200);
      const reopenedDto = await reopenRes.json();
      expect(reopenedDto.steps[0].status).toBe('pending');
      expect(reopenedDto.steps[0].completedAt).toBeNull();
      expect(reopenedDto.progress).toEqual({ completed: 0, total: 2, percentage: 0 });

      // Step from another path or foreign account returns 404
      const otherPathId = page2.items[0].id as string;
      const wrongPathStepRes = await call(`/learning-paths/${otherPathId}/steps/${step2!.id}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      });
      expect(wrongPathStepRes.status).toBe(404);

      const foreignPatchRes = await call(`/learning-paths/${pathDto.id}/steps/${step1!.id}`, {
        token: 'owner-b',
        method: 'PATCH',
        body: { status: 'completed' },
      });
      expect(foreignPatchRes.status).toBe(404);

      // Deleting the linked project sets projectId to null while keeping historical activity text
      const delProjRes = await call(`/projects/${project.id}`, { method: 'DELETE' });
      expect(delProjRes.status).toBe(204);

      const afterProjDeleteRes = await call(`/learning-paths/${pathDto.id}`);
      expect(afterProjDeleteRes.status).toBe(200);
      const afterProjDeleteDto = await afterProjDeleteRes.json();
      expect(afterProjDeleteDto.steps[0].projectId).toBeNull();
      expect(afterProjDeleteDto.steps[0].activity).toBe(step1!.activity);
      expect(afterProjDeleteDto.steps[0].activity).toContain('API & UI Base');

      // Deleting the analysis cascades and removes dependent learning paths
      await pool.query('DELETE FROM app.analyses WHERE user_id = $1 AND id = $2', [
        ownerA,
        lrn03AnalysisId,
      ]);
      const afterAnalysisDeleteRes = await call(`/learning-paths/${pathDto.id}`);
      expect(afterAnalysisDeleteRes.status).toBe(404);

      // Explicit DELETE /learning-paths/:id on remaining path (and 404 for foreign owner)
      const foreignDeleteRes = await call(`/learning-paths/${otherPathId}`, {
        token: 'owner-b',
        method: 'DELETE',
      });
      expect(foreignDeleteRes.status).toBe(404);

      const deletePathRes = await call(`/learning-paths/${otherPathId}`, {
        method: 'DELETE',
      });
      expect(deletePathRes.status).toBe(204);

      const afterPathDeleteRes = await call(`/learning-paths/${otherPathId}`);
      expect(afterPathDeleteRes.status).toBe(404);
    });
  },
);
