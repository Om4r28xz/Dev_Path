import { randomUUID, generateKeyPairSync } from 'node:crypto';
import { once } from 'node:events';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { createAuthService } from '../../src/modules/auth/services/auth-service.js';
import { accessTokenMiddleware } from '../../src/modules/auth/http/access-token.js';
import { profileRouter } from '../../src/modules/profile/http/router.js';
import { analysesRouter } from '../../src/modules/analyses/router.js';
import { EngineClient } from '../../src/modules/analyses/engine-client.js';
import { AnalysisHistoryRepository } from '../../src/modules/analyses/history-repository.js';
import { createApp as engineApp } from '../../../skill-engine/src/app.js';
import { loadConfig as engineConfig } from '../../../skill-engine/src/platform/config/env.js';
import { loadCatalog } from '../../../skill-engine/src/modules/analysis/catalog.js';
const databaseUrl = process.env.TEST_DATABASE_URL;
const requireContracts = createRequire(
  new URL('../../../../packages/contracts/package.json', import.meta.url),
);
const Ajv = requireContracts('ajv/dist/2020.js').default;
const addFormats = requireContracts('ajv-formats');
const yaml = requireContracts('yaml');

describe.skipIf(!databaseUrl)('ANL-03 history with JWT + PostgreSQL and ANL-01', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const accounts: { id: string; token: string }[] = [];
  let server: Server, engineServer: Server, base: string, directory: string, engine: EngineClient;
  let enginePort: number;
  let authenticate: ReturnType<typeof accessTokenMiddleware>;
  const engineApplication = engineApp({
    catalog: loadCatalog(),
    config: engineConfig({
      NODE_ENV: 'test',
      ENGINE_SERVICE_SECRET: 'history-test-engine',
      RATE_LIMIT_MAX_REQUESTS: '10000',
    }),
  });
  let validateDetail: ReturnType<InstanceType<typeof Ajv>['compile']>;
  let validateList: ReturnType<InstanceType<typeof Ajv>['compile']>;
  const close = (value: Server | undefined) =>
    value
      ? new Promise<void>((resolve) => {
          value.closeAllConnections();
          value.close(() => resolve());
        })
      : Promise.resolve();
  const call = (route: string, owner = 0, init: RequestInit = {}) =>
    fetch(base + '/api/v1' + route, {
      ...init,
      headers: {
        Authorization: 'Bearer ' + accounts[owner]!.token,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  async function fixtures(count: number, owner = 0, times?: string[]) {
    const rows = Array.from({ length: count }, (_, index) => ({
      id: randomUUID(),
      key: randomUUID(),
      title: 'Synthetic ' + index,
      created_at: times?.[index] ?? '2026-11-01T12:00:00.123456Z',
    }));
    await pool.query(
      `INSERT INTO app.analyses(id,user_id,idempotency_key,request_hash,job_title,job_text,required_skill_ids,matched_skill_ids,missing_skill_ids,compatibility_percentage,candidate_skills_revision,catalog_version,extractor_version,scoring_version,created_at)
   SELECT r.id::uuid,$1,r.key::uuid,repeat('a',64),r.title,'Synthetic history text',ARRAY['git','javascript','react'],ARRAY['javascript','react'],ARRAY['git'],67,p.skills_revision,'1.0.0','1.0.0','1.0.0',r.created_at::timestamptz
   FROM jsonb_to_recordset($2::jsonb) AS r(id text,key text,title text,created_at text) CROSS JOIN app.profiles p WHERE p.user_id=$1`,
      [accounts[owner]!.id, JSON.stringify(rows)],
    );
    return rows;
  }
  beforeAll(async () => {
    const contract = yaml.parse(
      await readFile(
        new URL('../../../../packages/contracts/openapi/public.yaml', import.meta.url),
        'utf8',
      ),
    );
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    validateDetail = ajv.compile({
      components: contract.components,
      $ref: '#/components/schemas/Analysis',
    });
    validateList = ajv.compile({
      components: contract.components,
      $ref: '#/components/schemas/AnalysisListResponse',
    });
    directory = await mkdtemp(path.join(tmpdir(), 'devpath-history-'));
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const privateKeyFile = path.join(directory, 'key.pem');
    await writeFile(privateKeyFile, pair.privateKey, { mode: 0o600 });
    const auth = await createAuthService(pool, { privateKeyFile, localHttp: true });
    for (let i = 0; i < 2; i++) {
      const result = await auth.register({
        name: 'History ' + i,
        email: randomUUID() + '@example.test',
        password: 'Synthetic-test-123!',
      });
      accounts.push({ id: result.body.user.id, token: result.body.accessToken });
    }
    engineServer = engineApplication.listen(0, '127.0.0.1');
    await once(engineServer, 'listening');
    enginePort = (engineServer.address() as AddressInfo).port;
    engine = new EngineClient({
      url: 'http://127.0.0.1:' + enginePort,
      secret: 'history-test-engine',
    });
    authenticate = accessTokenMiddleware(auth);
    const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX_REQUESTS: '10000' });
    server = createApp({
      config,
      configureRoutes: (app) => {
        app.use('/api/v1', profileRouter(pool, accessTokenMiddleware(auth)));
        app.use('/api/v1', analysesRouter(pool, accessTokenMiddleware(auth), engine));
      },
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  });
  beforeEach(async () => {
    await pool.query('DELETE FROM app.analyses WHERE user_id=ANY($1::uuid[])', [
      accounts.map((account) => account.id),
    ]);
  });
  afterAll(async () => {
    await Promise.all([close(server), close(engineServer)]);
    if (accounts.length)
      await pool.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])', [
        accounts.map((account) => account.id),
      ]);
    await pool.end();
    if (directory) await rm(directory, { recursive: true });
  });
  it('requires bearer identity on list, detail and delete', async () => {
    for (const [route, method] of [
      ['/analyses', 'GET'],
      ['/analyses/' + randomUUID(), 'GET'],
      ['/analyses/' + randomUUID(), 'DELETE'],
    ])
      expect((await fetch(base + '/api/v1' + route, { method })).status).toBe(401);
  });
  it('returns an empty owned page conforming to the live OpenAPI schema', async () => {
    await fixtures(2, 1);
    const response = await call('/analyses');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const result = await response.json();
    expect(result).toEqual({ items: [], nextCursor: null });
    expect(validateList(result)).toBe(true);
  });
  it('paginates default20/max50, equal timestamps and ownership without gaps or duplicates', async () => {
    const own = await fixtures(53);
    const foreign = await fixtures(5, 1);
    const expected = own
      .map((row) => row.id)
      .sort()
      .reverse();
    let cursor: string | null = null;
    const seen: string[] = [];
    let pages = 0;
    do {
      const response = await call('/analyses' + (cursor ? '?cursor=' + cursor : ''));
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(validateList(result), JSON.stringify(validateList.errors)).toBe(true);
      expect(result.items.length).toBe(pages < 2 ? 20 : 13);
      seen.push(...result.items.map((item: { id: string }) => item.id));
      cursor = result.nextCursor;
      pages++;
    } while (cursor);
    expect(seen).toEqual(expected);
    expect(new Set(seen).size).toBe(53);
    expect(seen.some((id) => foreign.some((row) => row.id === id))).toBe(false);
    const page = await (await call('/analyses?limit=50')).json();
    expect(page.items).toHaveLength(50);
    expect(
      (await (await call('/analyses?limit=50&cursor=' + page.nextCursor)).json()).items,
    ).toHaveLength(3);
  });
  it('preserves sub-millisecond ordering in cursor boundaries', async () => {
    const times = [
      '2026-11-01T12:00:00.123451Z',
      '2026-11-01T12:00:00.123454Z',
      '2026-11-01T12:00:00.123453Z',
      '2026-11-01T12:00:00.123452Z',
    ];
    const rows = await fixtures(4, 0, times);
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const result = await (
        await call('/analyses?limit=1' + (cursor ? '&cursor=' + cursor : ''))
      ).json();
      seen.push(...result.items.map((item: { id: string }) => item.id));
      cursor = result.nextCursor;
    } while (cursor);
    expect(seen).toEqual(
      [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((row) => row.id),
    );
  });
  it('uses a boundary even if its row was deleted and excludes a newly inserted newer row', async () => {
    const rows = await fixtures(6);
    const expected = rows
      .map((row) => row.id)
      .sort()
      .reverse();
    const first = await (await call('/analyses?limit=2')).json();
    expect((await call('/analyses/' + first.items[1].id, 0, { method: 'DELETE' })).status).toBe(
      204,
    );
    await fixtures(1, 0, ['2027-01-01T00:00:00.000001Z']);
    let cursor = first.nextCursor;
    const remaining: string[] = [];
    while (cursor) {
      const result = await (await call('/analyses?limit=2&cursor=' + cursor)).json();
      remaining.push(...result.items.map((item: { id: string }) => item.id));
      cursor = result.nextCursor;
    }
    expect(remaining).toEqual(expected.slice(2));
  });
  it('makes foreign and missing detail/delete indistinguishable404 and preserves foreign records', async () => {
    const [foreign] = await fixtures(1, 1);
    const absent = randomUUID();
    for (const method of ['GET', 'DELETE']) {
      const foreignResponse = await call('/analyses/' + foreign!.id, 0, { method });
      const missingResponse = await call('/analyses/' + absent, 0, { method });
      expect(foreignResponse.status).toBe(404);
      expect(missingResponse.status).toBe(404);
      const a = await foreignResponse.json();
      const b = await missingResponse.json();
      expect(a.error.code).toBe('NOT_FOUND');
      expect(a.error.message).toBe(b.error.message);
    }
    expect((await call('/analyses/' + foreign!.id, 1)).status).toBe(200);
  });
  it('reads an ANL-01 real result unchanged after skills are edited, without engine access', async () => {
    await call('/me/skills', 0, {
      method: 'PUT',
      body: JSON.stringify({ skillIds: ['javascript', 'react'] }),
    });
    const created = await call('/analyses', 0, {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
      body: JSON.stringify({
        source: {
          type: 'text',
          title: 'Frontend junior',
          text: 'Buscamos JavaScript, React y Git.',
        },
      }),
    });
    expect(created.status).toBe(201);
    const original = await created.json();
    expect(original.compatibilityPercentage).toBe(67);
    const before = (await pool.query('SELECT * FROM app.analyses WHERE id=$1', [original.id]))
      .rows[0];
    await call('/me/skills', 0, { method: 'PUT', body: JSON.stringify({ skillIds: ['java'] }) });
    const spy = vi.spyOn(engine, 'analyze');
    try {
      const detail = await (await call('/analyses/' + original.id)).json();
      expect(validateDetail(detail), JSON.stringify(validateDetail.errors)).toBe(true);
      expect(detail).toEqual({ ...original, skillsOutdated: true });
      const list = await (await call('/analyses')).json();
      expect(list.items[0].skillsOutdated).toBe(true);
      expect(list.items[0].compatibilityPercentage).toBe(67);
      expect(spy).not.toHaveBeenCalled();
      expect(
        (await pool.query('SELECT * FROM app.analyses WHERE id=$1', [original.id])).rows[0],
      ).toEqual(before);
    } finally {
      spy.mockRestore();
    }
  });
  it('deletes only the owned analysis, leaving skills/revision and other analysis intact', async () => {
    const rows = await fixtures(2);
    const skills = await (await call('/me/skills')).json();
    const result = await call('/analyses/' + rows[0]!.id, 0, { method: 'DELETE' });
    expect(result.status).toBe(204);
    expect(await result.text()).toBe('');
    expect((await call('/analyses/' + rows[0]!.id)).status).toBe(404);
    expect((await call('/analyses/' + rows[0]!.id, 0, { method: 'DELETE' })).status).toBe(404);
    expect((await call('/analyses/' + rows[1]!.id)).status).toBe(200);
    expect(await (await call('/me/skills')).json()).toEqual(skills);
    expect(
      (await (await call('/analyses')).json()).items.map((item: { id: string }) => item.id),
    ).toEqual([rows[1]!.id]);
  });
  it('handles concurrent deletes atomically', async () => {
    const [row] = await fixtures(1);
    const responses = await Promise.all([
      call('/analyses/' + row!.id, 0, { method: 'DELETE' }),
      call('/analyses/' + row!.id, 0, { method: 'DELETE' }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([204, 404]);
  });
  it('rejects invalid IDs, queries and cross-account cursors', async () => {
    for (const suffix of [
      'limit=0',
      'limit=51',
      'limit=1.5',
      'limit=1&limit=2',
      'cursor=bad',
      'cursor=' + 'a'.repeat(513),
      'userId=' + accounts[1]!.id,
    ])
      expect((await call('/analyses?' + suffix)).status).toBe(400);
    for (const method of ['GET', 'DELETE'])
      expect((await call('/analyses/not-a-uuid', 0, { method })).status).toBe(400);
    await fixtures(2);
    const page = await (await call('/analyses?limit=1')).json();
    expect((await call('/analyses?cursor=' + page.nextCursor, 1)).status).toBe(400);
  });
  it('keeps list, detail and delete available with the engine stopped', async () => {
    const [row] = await fixtures(1);
    await close(engineServer);
    try {
      expect((await call('/analyses')).status).toBe(200);
      expect((await call('/analyses/' + row!.id)).status).toBe(200);
      expect((await call('/analyses/' + row!.id, 0, { method: 'DELETE' })).status).toBe(204);
    } finally {
      engineServer = engineApplication.listen(enginePort, '127.0.0.1');
      await once(engineServer, 'listening');
    }
  });
  it('sanitizes database dependency failures', async () => {
    const closed = new pg.Pool({ connectionString: databaseUrl });
    await closed.end();
    const repo = new AnalysisHistoryRepository(closed);
    for (const request of [
      () => repo.list(accounts[0]!.id, 20, undefined),
      () => repo.detail(accounts[0]!.id, randomUUID()),
      () => repo.delete(accounts[0]!.id, randomUUID()),
    ])
      await expect(request()).rejects.toMatchObject({
        status: 503,
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'No fue posible acceder al historial de análisis.',
      });
    const extra = createApp({
      config: loadConfig({ NODE_ENV: 'test' }),
      configureRoutes: (app) => app.use('/api/v1', analysesRouter(closed, authenticate, engine)),
    }).listen(0, '127.0.0.1');
    await once(extra, 'listening');
    try {
      for (const method of ['GET', 'DELETE']) {
        const route = method === 'GET' ? '/analyses' : '/analyses/' + randomUUID();
        const response = await fetch(
          'http://127.0.0.1:' + (extra.address() as AddressInfo).port + '/api/v1' + route,
          { method, headers: { Authorization: 'Bearer ' + accounts[0]!.token } },
        );
        expect(response.status).toBe(503);
        const body = await response.text();
        expect(body).toContain('DEPENDENCY_UNAVAILABLE');
        expect(body).not.toMatch(/postgresql:|SELECT |DELETE FROM|Cannot use a pool/);
      }
    } finally {
      await close(extra);
    }
  });
});
