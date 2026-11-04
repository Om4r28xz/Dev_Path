import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { RequestHandler } from 'express';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { projectsRouter } from '../../src/modules/projects/router.js';
import { ProjectsRepository } from '../../src/modules/projects/repository.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { HttpError } from '../../src/platform/errors/http-error.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)('PRJ-01 projects with PostgreSQL', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const firstId = randomUUID();
  const secondId = randomUUID();
  const authenticate: RequestHandler = (request, response, next) => {
    const token = request.get('Authorization');
    const owner =
      token === 'Bearer owner-a' ? firstId : token === 'Bearer owner-b' ? secondId : undefined;
    if (!owner)
      return next(
        new HttpError({ status: 401, code: 'UNAUTHENTICATED', message: 'Token inválido.' }),
      );
    response.locals.userId = owner;
    next();
  };
  let server: ReturnType<ReturnType<typeof createApp>['listen']>;
  let base: string;
  const call = (route: string, token = 'owner-a', init: RequestInit = {}) =>
    fetch(base + '/api/v1' + route, {
      ...init,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...init.headers,
      },
    });
  const create = (body: unknown, token = 'owner-a') =>
    call('/projects', token, { method: 'POST', body: JSON.stringify(body) });
  const valid = {
    title: 'Proyecto',
    description: 'Práctica',
    url: 'https://example.org/project',
    skillIds: ['git', 'react'],
  };
  beforeAll(async () => {
    await pool.query(
      "INSERT INTO auth.users(id,email,password_hash) VALUES($1,$2,'synthetic'),($3,$4,'synthetic')",
      [firstId, firstId + '@example.test', secondId, secondId + '@example.test'],
    );
    await pool.query(
      "INSERT INTO app.profiles(id,user_id,full_name) VALUES($1,$1,'A'),($2,$2,'B')",
      [firstId, secondId],
    );
    const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX_REQUESTS: '1000' });
    server = createApp({
      config,
      configureRoutes: (app) => app.use('/api/v1', projectsRouter(pool, authenticate)),
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  });
  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])', [[firstId, secondId]]);
    await pool.end();
  });
  it('creates, reads, lists, patches and deletes own projects without changing personal skills', async () => {
    await pool.query('INSERT INTO app.user_skills(user_id,skill_id) VALUES($1,$2)', [
      firstId,
      'sql',
    ]);
    const created = await create(valid);
    expect(created.status).toBe(201);
    const project = await created.json();
    expect(created.headers.get('Location')).toBe('/api/v1/projects/' + project.id);
    expect(project).toMatchObject({ ...valid, skillIds: ['git', 'react'] });
    expect((await call('/projects/' + project.id).then((r) => r.json())).id).toBe(project.id);
    expect(
      (await call('/projects').then((r) => r.json())).items.some(
        (item: { id: string }) => item.id === project.id,
      ),
    ).toBe(true);
    const patched = await call('/projects/' + project.id, 'owner-a', {
      method: 'PATCH',
      body: JSON.stringify({ url: null, skillIds: [] }),
    });
    expect(patched.status).toBe(200);
    expect(await patched.json()).toMatchObject({ url: null, skillIds: [], title: valid.title });
    expect((await call('/projects/' + project.id, 'owner-b')).status).toBe(404);
    expect((await call('/projects/' + project.id, 'owner-b', { method: 'DELETE' })).status).toBe(
      404,
    );
    expect((await call('/projects/' + project.id, 'owner-a', { method: 'DELETE' })).status).toBe(
      204,
    );
    expect((await call('/projects/' + project.id)).status).toBe(404);
    expect(
      (await pool.query('SELECT skill_id FROM app.user_skills WHERE user_id=$1', [firstId])).rows,
    ).toMatchObject([{ skill_id: 'sql' }]);
    expect(
      (
        await pool.query<{ projects_revision: number }>(
          'SELECT projects_revision FROM app.profiles WHERE user_id=$1',
          [firstId],
        )
      ).rows[0]?.projects_revision,
    ).toBe(3);
  });
  it('rejects unknown, duplicate and malformed skills and unsafe input atomically', async () => {
    const before = (
      await pool.query<{ projects_revision: number }>(
        'SELECT projects_revision FROM app.profiles WHERE user_id=$1',
        [firstId],
      )
    ).rows[0]!.projects_revision;
    const unknown = await create({ ...valid, skillIds: ['git', 'unknown'] });
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toMatchObject({
      error: { code: 'SKILL_IDS_UNKNOWN', fields: { skillIds: expect.any(Array) } },
    });
    for (const body of [
      { ...valid, skillIds: ['git', 'git'] },
      { ...valid, url: 'javascript:alert(1)' },
      { ...valid, userId: secondId },
      { ...valid, title: '  ' },
    ])
      expect((await create(body)).status).toBe(400);
    expect(
      (await pool.query('SELECT projects_revision FROM app.profiles WHERE user_id=$1', [firstId]))
        .rows[0].projects_revision,
    ).toBe(before);
  });
  it('rolls back project, relations and revision on a database failure', async () => {
    const repository = new ProjectsRepository(pool);
    const before = await repository.list(firstId, 50, undefined);
    const revision = (
      await pool.query<{ projects_revision: number }>(
        'SELECT projects_revision FROM app.profiles WHERE user_id=$1',
        [firstId],
      )
    ).rows[0]!.projects_revision;
    await pool.query(
      "CREATE FUNCTION app.reject_test_project_skill() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$",
    );
    await pool.query(
      'CREATE TRIGGER reject_test_project_skill BEFORE INSERT ON app.project_skills FOR EACH ROW EXECUTE FUNCTION app.reject_test_project_skill()',
    );
    try {
      await expect(repository.create(firstId, valid)).rejects.toMatchObject({ status: 503 });
    } finally {
      await pool.query('DROP TRIGGER reject_test_project_skill ON app.project_skills');
      await pool.query('DROP FUNCTION app.reject_test_project_skill()');
    }
    expect(await repository.list(firstId, 50, undefined)).toEqual(before);
    expect(
      (await pool.query('SELECT projects_revision FROM app.profiles WHERE user_id=$1', [firstId]))
        .rows[0].projects_revision,
    ).toBe(revision);
  });
  it('paginates stably and rejects a cursor from another owner', async () => {
    for (let i = 0; i < 3; i++)
      expect((await create({ ...valid, title: 'Page ' + i })).status).toBe(201);
    const first = await call('/projects?limit=2').then((r) => r.json());
    expect(first.items).toHaveLength(2);
    const second = await call('/projects?limit=2&cursor=' + first.nextCursor).then((r) => r.json());
    expect(second.items).toHaveLength(1);
    expect(
      new Set([...first.items, ...second.items].map((item: { id: string }) => item.id)).size,
    ).toBe(3);
    expect((await call('/projects?cursor=' + first.nextCursor, 'owner-b')).status).toBe(400);
    expect((await call('/projects?limit=51')).status).toBe(400);
    expect((await call('/projects', 'bad')).status).toBe(401);
  });
});
