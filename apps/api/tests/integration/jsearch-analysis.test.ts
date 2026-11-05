import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { RequestHandler } from 'express';
import type { Pool, PoolClient, QueryResult } from 'pg';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { AnalysisEngine } from '../../src/modules/analyses/engine-client.js';
import type { AnalysisRow } from '../../src/modules/analyses/repository.js';
import { analysesRouter } from '../../src/modules/analyses/router.js';
import {
  FixtureJobsProvider,
  LiveJSearchProvider,
  providerRateLimited,
  providerTimeout,
  providerUnavailable,
  type JobsProvider,
} from '../../src/modules/jobs/services/provider.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { HttpError } from '../../src/platform/errors/http-error.js';

function createInMemoryPool(
  ownerId: string,
  candidateSkillIds: string[] = ['javascript', 'react'],
) {
  const storedByKey = new Map<string, AnalysisRow>();
  const storedById = new Map<string, AnalysisRow>();

  const client: Partial<PoolClient> = {
    query: (async (configOrText: unknown, valuesArg?: unknown[]) => {
      const text =
        typeof configOrText === 'string' ? configOrText : (configOrText as { text: string }).text;
      const values =
        typeof configOrText === 'string'
          ? (valuesArg ?? [])
          : ((configOrText as { values?: unknown[] }).values ?? []);

      if (
        text === 'BEGIN' ||
        text === 'COMMIT' ||
        text === 'ROLLBACK' ||
        text.includes('set_config') ||
        text.includes('pg_advisory_xact_lock')
      ) {
        return { rows: [], rowCount: 0 } as unknown as QueryResult;
      }

      if (text.includes('FROM app.profiles')) {
        const userId = String(values[0]);
        if (userId !== ownerId) return { rows: [], rowCount: 0 } as unknown as QueryResult;
        return { rows: [{ skills_revision: 3 }], rowCount: 1 } as unknown as QueryResult;
      }

      if (text.includes('SELECT * FROM app.analyses WHERE user_id=$1 AND idempotency_key=$2')) {
        const key = `${String(values[0])}:${String(values[1])}`;
        const existing = storedByKey.get(key);
        return {
          rows: existing ? [existing] : [],
          rowCount: existing ? 1 : 0,
        } as unknown as QueryResult;
      }

      if (text.includes('SELECT skill_id FROM app.user_skills')) {
        return {
          rows: candidateSkillIds.map((skill_id) => ({ skill_id })),
          rowCount: candidateSkillIds.length,
        } as unknown as QueryResult;
      }

      if (text.includes('SELECT id FROM app.skills')) {
        return {
          rows: [{ id: 'git' }, { id: 'javascript' }, { id: 'react' }, { id: 'typescript' }],
          rowCount: 4,
        } as unknown as QueryResult;
      }

      if (text.startsWith('INSERT INTO app.analyses')) {
        const row: AnalysisRow = {
          id: String(values[0]),
          user_id: String(values[1]),
          request_hash: String(values[3]),
          job_title: (values[4] as string | null) ?? null,
          job_text: String(values[5]),
          required_skill_ids: values[7] as string[],
          matched_skill_ids: values[8] as string[],
          missing_skill_ids: values[9] as string[],
          compatibility_percentage: (values[10] as number | null) ?? null,
          candidate_skills_revision: Number(values[11]),
          catalog_version: String(values[12]),
          extractor_version: String(values[13]),
          scoring_version: String(values[14]),
          evidence: JSON.parse(String(values[15])),
          warnings: values[16] as string[],
          created_at: new Date('2026-11-05T12:00:00.000Z'),
        };
        storedByKey.set(`${row.user_id}:${String(values[2])}`, row);
        storedById.set(row.id, row);
        return { rows: [row], rowCount: 1 } as unknown as QueryResult;
      }

      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    }) as PoolClient['query'],
    release: () => undefined,
  };

  const pool: Partial<Pool> = {
    connect: async () => client as PoolClient,
    query: (async (text: string, values: unknown[]) => {
      if (text.includes('WHERE a.user_id=$1 AND a.id=$2')) {
        const row = storedById.get(String(values[1]));
        if (!row || row.user_id !== String(values[0])) {
          return { rows: [], rowCount: 0 } as unknown as QueryResult;
        }
        return {
          rows: [{ ...row, current_revision: 3, cursor_created_at: row.created_at.toISOString() }],
          rowCount: 1,
        } as unknown as QueryResult;
      }
      return { rows: [], rowCount: 0 } as unknown as QueryResult;
    }) as Pool['query'],
  };

  return { pool: pool as Pool, storedById };
}

const deterministicEngine: AnalysisEngine = {
  async analyze(input) {
    const required = ['git', 'javascript', 'react'].filter((skill) =>
      input.jobText.toLowerCase().includes(skill),
    );
    const candidate = new Set(input.candidateSkillIds);
    const matched = required.filter((id) => candidate.has(id));
    const missing = required.filter((id) => !candidate.has(id));
    const matchPercentage =
      required.length === 0 ? null : Math.round((100 * matched.length) / required.length);
    const evidence = required.map((skillId) => {
      const regex = new RegExp(skillId, 'iu');
      const found = regex.exec(input.jobText);
      const start = found?.index ?? 0;
      const text = found?.[0] ?? skillId;
      return {
        skillId,
        matches: [{ text, start, end: start + text.length }],
      };
    });
    return {
      requiredSkillIds: required,
      matchedSkillIds: matched,
      missingSkillIds: missing,
      matchPercentage,
      versions: { catalog: '1.0.0', extractor: '1.0.0', scoring: '1.0.0' },
      evidence,
    };
  },
};

describe('JSR-03 provider analysis via POST /api/v1/analyses', () => {
  const ownerId = randomUUID();
  const authenticate: RequestHandler = (request, response, next) => {
    if (request.get('Authorization') !== 'Bearer valid-jwt') {
      return next(
        new HttpError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'Se requiere autenticación.',
        }),
      );
    }
    response.locals.userId = ownerId;
    next();
  };

  let activeServer: ReturnType<ReturnType<typeof createApp>['listen']> | undefined;

  afterEach(async () => {
    if (activeServer) {
      const serverToClose = activeServer;
      activeServer = undefined;
      await new Promise<void>((resolve) => serverToClose.close(() => resolve()));
    }
  });

  async function startServer(options: {
    jobsProvider: JobsProvider;
    liveRetentionPermitted?: boolean;
  }) {
    const { pool, storedById } = createInMemoryPool(ownerId);
    const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX_REQUESTS: '1000' });
    const app = createApp({
      config,
      configureRoutes: (expressApp) => {
        expressApp.use(
          '/api/v1',
          analysesRouter(pool, authenticate, deterministicEngine, {
            jobsProvider: options.jobsProvider,
            liveRetentionPermitted: options.liveRetentionPermitted,
          }),
        );
      },
    });
    activeServer = app.listen(0, '127.0.0.1');
    await once(activeServer, 'listening');
    const port = (activeServer.address() as AddressInfo).port;
    return { base: `http://127.0.0.1:${port}`, storedById };
  }

  it('requires JWT (401), creates 201 analysis from fixture providerId, replays 200 idempotently, and rejects 409 on key reuse', async () => {
    const { base, storedById } = await startServer({
      jobsProvider: new FixtureJobsProvider(),
    });
    const idemKey = randomUUID();

    // 1. 401 without JWT
    const unauthRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'synthetic-job-001' },
      }),
    });
    expect(unauthRes.status).toBe(401);

    // 2. 201 Created with valid fixture providerId
    const createRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'synthetic-job-001' },
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created).toMatchObject({
      source: {
        type: 'jsearch',
        title: 'Frontend junior (sintético)',
        providerId: 'synthetic-job-001',
      },
      candidateSkillsRevision: 3,
      requiredSkillIds: ['git', 'javascript', 'react'],
      matchedSkillIds: ['javascript', 'react'],
      missingSkillIds: ['git'],
      compatibilityPercentage: 67,
      skillsOutdated: false,
    });
    expect(storedById.has(created.id)).toBe(true);

    // 3. 200 Replay with same Idempotency-Key and same payload
    const replayRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'synthetic-job-001' },
      }),
    });
    expect(replayRes.status).toBe(200);
    const replayed = await replayRes.json();
    expect(replayed.id).toBe(created.id);
    expect(replayed.source).toEqual(created.source);

    // 4. 409 Conflict when reusing key with different providerId
    const conflictRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'synthetic-job-002' },
      }),
    });
    expect(conflictRes.status).toBe(409);
  });

  it('rejects arbitrary URLs or client-supplied text in jsearch source (400), and maps unknown providerId (404), quota (429), timeout (504)', async () => {
    let errorMode: 'none' | '429' | '504' = 'none';
    const baseFixture = new FixtureJobsProvider();
    const customProvider: JobsProvider = {
      mode: 'fixture',
      country: 'mx',
      language: 'es',
      search: (input) => baseFixture.search(input),
      details: async (input) => {
        if (errorMode === '429') throw providerRateLimited('60');
        if (errorMode === '504') throw providerTimeout();
        return baseFixture.details(input);
      },
    };

    const { base } = await startServer({ jobsProvider: customProvider });

    // Rejects arbitrary URL as providerId
    const urlRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'https://internal.example/ssrf' },
      }),
    });
    expect(urlRes.status).toBe(400);

    // Rejects injected text alongside jsearch providerId
    const injectedTextRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        source: {
          type: 'jsearch',
          providerId: 'synthetic-job-001',
          text: 'Fake trusted text',
        },
      }),
    });
    expect(injectedTextRes.status).toBe(400);

    // Unknown providerId -> 404
    const notFoundRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'non-existent-id-999' },
      }),
    });
    expect(notFoundRes.status).toBe(404);

    // Provider 429 -> 429 RATE_LIMITED
    errorMode = '429';
    const rateRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'synthetic-job-001' },
      }),
    });
    expect(rateRes.status).toBe(429);

    // Provider timeout -> 504 DEPENDENCY_TIMEOUT
    errorMode = '504';
    const timeoutRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'synthetic-job-001' },
      }),
    });
    expect(timeoutRes.status).toBe(504);
  });

  it('rejects jsearch analysis persistence in live mode (503) while retention permission is pending, and preserves manual text analysis even when provider is down', async () => {
    let liveFetchCalled = false;
    const liveProvider = new LiveJSearchProvider({
      apiKey: 'secret-key-not-called',
      liveEnabled: true,
      fetchFn: async () => {
        liveFetchCalled = true;
        throw providerUnavailable();
      },
    });

    const { base, storedById } = await startServer({
      jobsProvider: liveProvider,
      liveRetentionPermitted: false,
    });

    // Live JSearch analysis is blocked before calling upstream or persisting
    const blockedLiveRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        source: { type: 'jsearch', providerId: 'live-job-001' },
      }),
    });
    expect(blockedLiveRes.status).toBe(503);
    expect(liveFetchCalled).toBe(false);
    expect(storedById.size).toBe(0);

    // Manual text analysis still works normally even when provider is unavailable
    const manualRes = await fetch(`${base}/api/v1/analyses`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-jwt',
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        source: {
          type: 'text',
          title: 'Vacante manual independiente',
          text: 'Buscamos JavaScript, React y Git.',
        },
      }),
    });
    expect(manualRes.status).toBe(201);
    const manualBody = await manualRes.json();
    expect(manualBody.source).toEqual({
      type: 'text',
      title: 'Vacante manual independiente',
    });
    expect(manualBody.compatibilityPercentage).toBe(67);
  });
});
