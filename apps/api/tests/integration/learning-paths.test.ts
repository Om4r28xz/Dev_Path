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
  },
);
