import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { RequestHandler } from 'express';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { profileRouter } from '../../src/modules/profile/http/router.js';
import { ProfileRepository } from '../../src/modules/profile/repository.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { HttpError } from '../../src/platform/errors/http-error.js';

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('PRO-01 profile and skills with PostgreSQL', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const firstId = randomUUID();
  const secondId = randomUUID();
  const tokens = new Map([
    ['user-a-token', firstId],
    ['user-b-token', secondId],
  ]);
  const authenticate: RequestHandler = (request, response, next) => {
    const token = request.get('Authorization')?.replace(/^Bearer /u, '');
    const owner = token === undefined ? undefined : tokens.get(token);
    if (owner === undefined) {
      next(new HttpError({ status: 401, code: 'UNAUTHENTICATED', message: 'Token inválido.' }));
      return;
    }
    response.locals.userId = owner;
    next();
  };
  let server: ReturnType<ReturnType<typeof createApp>['listen']>;
  let base: string;
  const call = (route: string, token = 'user-a-token', init: RequestInit = {}) =>
    fetch(base + '/api/v1' + route, {
      ...init,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...init.headers,
      },
    });

  beforeAll(async () => {
    await pool.query(
      "INSERT INTO auth.users(id,email,password_hash) VALUES($1,$2,'synthetic'),($3,$4,'synthetic')",
      [
        firstId,
        'profile-' + firstId + '@example.test',
        secondId,
        'profile-' + secondId + '@example.test',
      ],
    );
    await pool.query(
      "INSERT INTO app.profiles(id,user_id,full_name) VALUES($1,$1,'Cuenta A'),($2,$2,'Cuenta B')",
      [firstId, secondId],
    );
    const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX_REQUESTS: '1000' });
    server = createApp({
      config,
      configureRoutes: (app) => app.use('/api/v1', profileRouter(pool, authenticate)),
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])', [[firstId, secondId]]);
    await pool.end();
  });

  it('reads and updates only allowed profile fields', async () => {
    const initial = await call('/me');
    expect(initial.status).toBe(200);
    expect(await initial.json()).toMatchObject({
      id: firstId,
      name: 'Cuenta A',
      headline: null,
      location: null,
      skillsRevision: 0,
    });
    const patched = await call('/me', 'user-a-token', {
      method: 'PATCH',
      body: JSON.stringify({ name: '  Nuevo nombre  ', headline: ' Junior ', location: null }),
    });
    expect(patched.status).toBe(200);
    expect(await patched.json()).toMatchObject({
      id: firstId,
      name: 'Nuevo nombre',
      headline: 'Junior',
      location: null,
    });
    expect((await call('/me', 'user-b-token').then((res) => res.json())).name).toBe('Cuenta B');
    for (const body of [{ email: 'changed@example.test' }, {}, { name: '' }])
      expect(
        (await call('/me', 'user-a-token', { method: 'PATCH', body: JSON.stringify(body) })).status,
      ).toBe(400);
  });

  it('lists seeded skills with stable cursor and validated search', async () => {
    const first = await call('/skills?limit=3');
    expect(first.status).toBe(200);
    const page = await first.json();
    expect(page.catalogVersion).toBe('1.0.0');
    expect(page.items.map((item: { id: string }) => item.id)).toEqual([
      'cplusplus',
      'csharp',
      'docker',
    ]);
    const next = await call('/skills?limit=3&cursor=' + page.nextCursor);
    expect((await next.json()).items[0].id).toBe('git');
    const searched = await call('/skills?q=React');
    expect((await searched.json()).items.map((item: { id: string }) => item.id)).toEqual([
      'react',
      'react-native',
    ]);
    expect((await call('/skills?cursor=' + page.nextCursor + '&q=React')).status).toBe(400);
    expect((await call('/skills?limit=51')).status).toBe(400);
  });

  it('replaces skills atomically and isolates two accounts', async () => {
    expect(await call('/me/skills').then((res) => res.json())).toEqual({
      skillIds: [],
      revision: 0,
    });
    const replaced = await call('/me/skills', 'user-a-token', {
      method: 'PUT',
      body: JSON.stringify({ skillIds: ['react', 'javascript'] }),
    });
    expect(replaced.status).toBe(200);
    expect(await replaced.json()).toEqual({ skillIds: ['javascript', 'react'], revision: 1 });
    expect(await call('/me/skills', 'user-b-token').then((res) => res.json())).toEqual({
      skillIds: [],
      revision: 0,
    });
    for (const ids of [['react', 'react'], ['unknown'], ['react', 'unknown']])
      expect(
        (
          await call('/me/skills', 'user-a-token', {
            method: 'PUT',
            body: JSON.stringify({ skillIds: ids }),
          })
        ).status,
      ).toBe(400);
    expect(await call('/me/skills').then((res) => res.json())).toEqual({
      skillIds: ['javascript', 'react'],
      revision: 1,
    });
    const emptied = await call('/me/skills', 'user-a-token', {
      method: 'PUT',
      body: JSON.stringify({ skillIds: [] }),
    });
    expect(await emptied.json()).toEqual({ skillIds: [], revision: 2 });
  });

  it('increments revision consistently under concurrent replacement', async () => {
    const replies = await Promise.all([
      call('/me/skills', 'user-a-token', {
        method: 'PUT',
        body: JSON.stringify({ skillIds: ['git'] }),
      }),
      call('/me/skills', 'user-a-token', {
        method: 'PUT',
        body: JSON.stringify({ skillIds: ['docker'] }),
      }),
    ]);
    expect(replies.map((reply) => reply.status)).toEqual([200, 200]);
    const revisions = await Promise.all(
      replies.map(async (reply) => (await reply.json()).revision),
    );
    expect(revisions.sort()).toEqual([3, 4]);
    const current = await call('/me/skills').then((res) => res.json());
    expect(current.revision).toBe(4);
    expect([['git'], ['docker']]).toContainEqual(current.skillIds);
  });

  it('rolls back replacement and revision if an insert fails', async () => {
    const repository = new ProfileRepository(pool);
    const before = await repository.getUserSkills(firstId);
    await expect(repository.replaceUserSkills(firstId, ['git', 'git'])).rejects.toThrow();
    expect(await repository.getUserSkills(firstId)).toEqual(before);
  });

  it('rejects missing auth and userId in a request body', async () => {
    expect((await call('/me/skills', 'invalid')).status).toBe(401);
    expect(
      (
        await call('/me/skills', 'user-b-token', {
          method: 'PUT',
          body: JSON.stringify({ userId: firstId, skillIds: ['sql'] }),
        })
      ).status,
    ).toBe(400);
  });
});
