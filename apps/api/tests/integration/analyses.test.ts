import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { generateKeyPairSync } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type Server } from 'node:http';
import pg from 'pg';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { authRouter } from '../../src/modules/auth/http/router.js';
import { accessTokenMiddleware } from '../../src/modules/auth/http/access-token.js';
import { createAuthService } from '../../src/modules/auth/services/auth-service.js';
import { profileRouter } from '../../src/modules/profile/http/router.js';
import { analysesRouter } from '../../src/modules/analyses/router.js';
import { EngineClient, type AnalysisEngine } from '../../src/modules/analyses/engine-client.js';
import { AnalysesRepository } from '../../src/modules/analyses/repository.js';
import { createApp as createEngineApp } from '../../../skill-engine/src/app.js';
import { loadConfig as engineConfig } from '../../../skill-engine/src/platform/config/env.js';
import { loadCatalog } from '../../../skill-engine/src/modules/analysis/catalog.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const source = {
  type: 'text',
  title: 'Frontend junior',
  text: 'Buscamos JavaScript, React y Git.',
};
describe.skipIf(!databaseUrl)('ANL-01 real HTTP + engine + PostgreSQL', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 12 });
  let appServer: Server, engineServer: Server, badServer: Server;
  let base: string, real: EngineClient, engine: AnalysisEngine, badUrl: string;
  let directory: string;
  const accounts: { id: string; accessToken: string }[] = [];
  const keys: string[] = [];
  const key = () => {
    const value = randomUUID();
    keys.push(value);
    return value;
  };
  let badMode = 'shape';
  const call = (route: string, owner = 0, init: RequestInit = {}) =>
    fetch(base + '/api/v1' + route, {
      ...init,
      headers: {
        Authorization: 'Bearer ' + accounts[owner]!.accessToken,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  const analyze = (idempotency = key(), body: unknown = { source }, owner = 0) =>
    call('/analyses', owner, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotency },
      body: JSON.stringify(body),
    });
  const rowCount = async (idempotency: string) =>
    (await pool.query('SELECT id FROM app.analyses WHERE idempotency_key=$1', [idempotency])).rows
      .length;
  const close = (server: Server | undefined) =>
    server
      ? new Promise<void>((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        })
      : Promise.resolve();
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'devpath-anl01-'));
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const privateKeyFile = path.join(directory, 'private.pem');
    await writeFile(privateKeyFile, pair.privateKey, { mode: 0o600 });
    const auth = await createAuthService(pool, { privateKeyFile, localHttp: true });
    engineServer = createEngineApp({
      catalog: loadCatalog(),
      config: engineConfig({
        NODE_ENV: 'test',
        ENGINE_SERVICE_SECRET: 'isolated-test-engine',
        RATE_LIMIT_MAX_REQUESTS: '10000',
      }),
    }).listen(0, '127.0.0.1');
    await once(engineServer, 'listening');
    real = new EngineClient({
      url: 'http://127.0.0.1:' + (engineServer.address() as AddressInfo).port,
      secret: 'isolated-test-engine',
    });
    engine = real;
    const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX_REQUESTS: '10000' });
    appServer = createApp({
      config,
      configureRoutes: (app) => {
        app.use('/api/v1/auth', authRouter(auth, config.http.allowedOrigins, true));
        app.use('/api/v1', profileRouter(pool, accessTokenMiddleware(auth)));
        app.use(
          '/api/v1',
          analysesRouter(pool, accessTokenMiddleware(auth), {
            analyze: (...args) => engine.analyze(...args),
          }),
        );
      },
    }).listen(0, '127.0.0.1');
    await once(appServer, 'listening');
    base = 'http://127.0.0.1:' + (appServer.address() as AddressInfo).port;
    for (let i = 0; i < 2; i++) {
      const response = await fetch(base + '/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
          'X-DevPath-Client': 'web',
        },
        body: JSON.stringify({
          name: 'Synthetic ' + i,
          email: randomUUID() + '@example.test',
          password: 'Synthetic-test-123!',
        }),
      });
      expect(response.status).toBe(201);
      const session = await response.json();
      accounts.push({ id: session.user.id, accessToken: session.accessToken });
    }
    badServer = createServer((req, res) => {
      req.resume();
      res.setHeader('Content-Type', 'application/json');
      if (badMode === 'timeout') return; // Deliberately unresponsive dependency; closed after the test.
      if (badMode === 'status') {
        res.writeHead(409);
        res.end('{}');
        return;
      }
      if (badMode === 'large') {
        res.end('x'.repeat(129 * 1024));
        return;
      }
      if (badMode === 'json') {
        res.end('{');
        return;
      }
      const result = {
        requiredSkillIds: ['git'],
        matchedSkillIds: [],
        missingSkillIds: ['git'],
        matchPercentage: 0,
        evidence: [
          {
            skillId: 'git',
            matches: [
              {
                text: 'Git',
                start: source.text.indexOf('Git'),
                end: source.text.indexOf('Git') + 3,
              },
            ],
          },
        ],
        versions: { catalog: '1.0.0', extractor: '1.0.0', scoring: '1.0.0' },
      };
      if (badMode === 'shape') res.end('{}');
      else if (badMode === 'score') res.end(JSON.stringify({ ...result, matchPercentage: 100 }));
      else if (badMode === 'version')
        res.end(JSON.stringify({ ...result, versions: { ...result.versions, catalog: '2.0.0' } }));
      else res.end(JSON.stringify({ ...result, evidence: [] }));
    }).listen(0, '127.0.0.1');
    await once(badServer, 'listening');
    badUrl = 'http://127.0.0.1:' + (badServer.address() as AddressInfo).port;
  });
  beforeEach(async () => {
    engine = real;
    await call('/me/skills', 0, {
      method: 'PUT',
      body: JSON.stringify({ skillIds: ['javascript', 'react'] }),
    });
  });
  afterAll(async () => {
    await Promise.all([close(appServer), close(engineServer), close(badServer)]);
    if (accounts.length)
      await pool.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])', [
        accounts.map((x) => x.id),
      ]);
    await pool.end();
    if (directory) await rm(directory, { recursive: true });
  });
  it('persists the 67% example and only sends the minimal service DTO', async () => {
    const spy = vi.spyOn(real, 'analyze');
    const response = await analyze();
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result).toMatchObject({
      requiredSkillIds: ['git', 'javascript', 'react'],
      matchedSkillIds: ['javascript', 'react'],
      missingSkillIds: ['git'],
      compatibilityPercentage: 67,
      skillsOutdated: false,
      source: { type: 'text', title: 'Frontend junior' },
    });
    expect(spy.mock.calls.at(-1)![0]).toEqual({
      catalogVersion: '1.0.0',
      jobText: source.text,
      candidateSkillIds: ['javascript', 'react'],
    });
    const row = (await pool.query('SELECT * FROM app.analyses WHERE id=$1', [result.id])).rows[0];
    expect(row.user_id).toBe(accounts[0]!.id);
    expect(row.candidate_skill_ids).toEqual(['javascript', 'react']);
    expect(row.job_text).toBe(source.text);
    expect(row.evidence).toHaveLength(3);
    expect(result.evidence).toEqual(row.evidence);
    expect(result).not.toHaveProperty('job_text');
    expect(result).not.toHaveProperty('candidate_skill_ids');
    expect(row.request_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(Object.keys(result).sort()).toEqual(
      [
        'id',
        'source',
        'candidateSkillsRevision',
        'requiredSkillIds',
        'matchedSkillIds',
        'missingSkillIds',
        'compatibilityPercentage',
        'versions',
        'warnings',
        'skillsOutdated',
        'createdAt',
        'evidence',
      ].sort(),
    );
    spy.mockRestore();
  });
  it('replays without recalculation after skills change and when engine is down', async () => {
    const idempotency = key();
    const first = await (await analyze(idempotency)).json();
    await call('/me/skills', 0, { method: 'PUT', body: JSON.stringify({ skillIds: [] }) });
    engine = new EngineClient({ url: badUrl, secret: 'isolated-test-engine' });
    badMode = 'status';
    const replay = await analyze(idempotency);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ ...first, skillsOutdated: true });
    expect(await rowCount(idempotency)).toBe(1);
  });

  it('replays a legacy snapshot without evidence or recalculating it', async () => {
    const idempotency = key();
    const original = await (await analyze(idempotency)).json();
    await pool.query('UPDATE app.analyses SET evidence=$1::jsonb WHERE id=$2', ['[]', original.id]);
    const before = (await pool.query('SELECT * FROM app.analyses WHERE id=$1', [original.id]))
      .rows[0];
    const spy = vi.spyOn(engine, 'analyze');
    const response = await analyze(idempotency);
    expect(response.status).toBe(200);
    const replay = await response.json();
    const { evidence: omitted, ...baseSnapshot } = original;
    expect(omitted).toHaveLength(3);
    expect(replay).toEqual(baseSnapshot);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    expect(
      (await pool.query('SELECT * FROM app.analyses WHERE id=$1', [original.id])).rows[0],
    ).toEqual(before);
  });
  it('uses one row for a concurrent identical command and conflicts on a different body', async () => {
    const idempotency = key();
    const responses = await Promise.all([
      analyze(idempotency),
      analyze(idempotency),
      analyze(idempotency),
    ]);
    expect(responses.map((x) => x.status).sort()).toEqual([200, 200, 201]);
    const bodies = await Promise.all(responses.map((x) => x.json()));
    expect(new Set(bodies.map((x) => x.id)).size).toBe(1);
    expect(await rowCount(idempotency)).toBe(1);
    const conflict = await analyze(idempotency, { source: { ...source, text: 'Java' } });
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });
  it('scopes the same idempotency key and skill snapshot to each authenticated owner', async () => {
    const idempotency = key();
    const a = await (await analyze(idempotency)).json();
    const bResponse = await analyze(idempotency, { source }, 1);
    expect(bResponse.status).toBe(201);
    const b = await bResponse.json();
    expect(a.id).not.toBe(b.id);
    expect(b.compatibilityPercentage).toBe(0);
    expect(b.matchedSkillIds).toEqual([]);
    expect(await rowCount(idempotency)).toBe(2);
  });
  it('keeps zero distinct from no technologies', async () => {
    const empty = await analyze(key(), {
      source: { type: 'text', text: 'Buscamos comunicación y trabajo en equipo.' },
    });
    expect(empty.status).toBe(201);
    expect(await empty.json()).toMatchObject({
      compatibilityPercentage: null,
      requiredSkillIds: [],
      warnings: ['NO_TECHNOLOGIES_DETECTED'],
      evidence: [],
    });
    const noSkills = await analyze(key(), { source }, 1);
    expect((await noSkills.json()).compatibilityPercentage).toBe(0);
  });
  it('rejects missing key, whitespace, overlong text and client-provided authority', async () => {
    const before = (
      await pool.query('SELECT count(*) FROM app.analyses WHERE user_id=$1', [accounts[0]!.id])
    ).rows[0].count;
    expect(
      (await call('/analyses', 0, { method: 'POST', body: JSON.stringify({ source }) })).status,
    ).toBe(400);
    for (const body of [
      { source: { type: 'text', text: '   ' } },
      { source: { type: 'text', text: 'x'.repeat(20001) } },
      { source, candidateSkillIds: ['git'] },
      { source, userId: accounts[1]!.id },
      { source: { ...source, url: 'http://external.invalid' } },
    ])
      expect((await analyze(key(), body)).status).toBe(400);
    expect(
      (await pool.query('SELECT count(*) FROM app.analyses WHERE user_id=$1', [accounts[0]!.id]))
        .rows[0].count,
    ).toBe(before);
    expect(
      (
        await fetch(base + '/api/v1/analyses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key() },
          body: JSON.stringify({ source }),
        })
      ).status,
    ).toBe(401);
  });
  it.each(['shape', 'score', 'version', 'evidence', 'json', 'large', 'status'])(
    'never persists invalid or failed engine result: %s',
    async (mode) => {
      badMode = mode;
      engine = new EngineClient({ url: badUrl, secret: 'isolated-test-engine' });
      const idempotency = key();
      const response = await analyze(idempotency);
      expect(response.status).toBe(503);
      expect((await response.json()).error.code).toBe('DEPENDENCY_UNAVAILABLE');
      expect(await rowCount(idempotency)).toBe(0);
    },
  );
  it('returns timeout without persisting and allows a safe retry of that key', async () => {
    badMode = 'timeout';
    engine = new EngineClient({ url: badUrl, secret: 'isolated-test-engine', timeoutMs: 60 });
    const idempotency = key();
    const response = await analyze(idempotency);
    expect(response.status).toBe(504);
    expect((await call('/me')).status).toBe(200);
    expect(await rowCount(idempotency)).toBe(0);
    engine = real;
    expect((await analyze(idempotency)).status).toBe(201);
  });
  it('rolls back a database insertion failure and releases idempotency for retry', async () => {
    const constraint = 'test_anl_failure_' + randomUUID().replaceAll('-', '');
    const idempotency = key();
    await pool.query(
      `ALTER TABLE app.analyses ADD CONSTRAINT ${constraint} CHECK (user_id <> '${accounts[0]!.id}'::uuid) NOT VALID`,
    );
    try {
      expect((await analyze(idempotency)).status).toBe(503);
      expect(await rowCount(idempotency)).toBe(0);
    } finally {
      await pool.query(`ALTER TABLE app.analyses DROP CONSTRAINT ${constraint}`);
    }
    expect((await analyze(idempotency)).status).toBe(201);
  });
  it('bounds the total API budget and rolls back a waiting key lock', async () => {
    const idempotency = key();
    const lock = await pool.connect();
    await lock.query('BEGIN');
    await lock.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
      accounts[0]!.id + ':' + idempotency,
    ]);
    try {
      const repo = new AnalysesRepository(pool, real, 80);
      await expect(
        repo.create(
          accounts[0]!.id,
          idempotency,
          { source: { ...source, type: 'text' } },
          randomUUID(),
        ),
      ).rejects.toMatchObject({ status: 504 });
      expect(await rowCount(idempotency)).toBe(0);
    } finally {
      await lock.query('ROLLBACK');
      lock.release();
    }
  });
  it('resolves concurrent different bodies with a single winner and one conflict', async () => {
    const idempotency = key();
    const responses = await Promise.all([
      analyze(idempotency),
      analyze(idempotency, { source: { type: 'text', text: 'Java' } }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await rowCount(idempotency)).toBe(1);
  });
  it('keeps skill IDs and revision coherent while a profile update is waiting', async () => {
    let release!: () => void;
    let entered!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    engine = {
      analyze: async (...args) => {
        const result = await real.analyze(...args);
        entered();
        await gate;
        return result;
      },
    };
    const idempotency = key();
    const request = analyze(idempotency);
    await started;
    let updated = false;
    const update = call('/me/skills', 0, {
      method: 'PUT',
      body: JSON.stringify({ skillIds: ['java'] }),
    }).then((response) => {
      updated = true;
      return response;
    });
    try {
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(updated).toBe(false);
    } finally {
      release();
    }
    const response = await request;
    expect(response.status).toBe(201);
    const first = await response.json();
    expect(first.compatibilityPercentage).toBe(67);
    expect((await update).status).toBe(200);
    const row = (
      await pool.query(
        'SELECT candidate_skill_ids,candidate_skills_revision FROM app.analyses WHERE id=$1',
        [first.id],
      )
    ).rows[0];
    expect(row.candidate_skill_ids).toEqual(['javascript', 'react']);
    expect(row.candidate_skills_revision).toBe(first.candidateSkillsRevision);
    const replay = await (await analyze(idempotency)).json();
    expect(replay.skillsOutdated).toBe(true);
    expect(replay.compatibilityPercentage).toBe(67);
  });
  it('expires a queued pool acquisition and releases the late connection safely', async () => {
    const single = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    const occupied = await single.connect();
    try {
      const repository = new AnalysesRepository(single, real, 40);
      await expect(
        repository.create(
          accounts[0]!.id,
          key(),
          { source: { ...source, type: 'text' } },
          randomUUID(),
        ),
      ).rejects.toMatchObject({ status: 504 });
    } finally {
      occupied.release();
    }
    expect((await single.query('SELECT 1 AS value')).rows[0].value).toBe(1);
    await single.end();
  });
});
