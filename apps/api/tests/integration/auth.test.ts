import { once } from 'node:events';
import { generateKeyPairSync, createHash, randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import pg from 'pg';
import * as argon2 from 'argon2';
import { importSPKI, jwtVerify } from 'jose';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { authRouter } from '../../src/modules/auth/http/router.js';
import { createAuthService } from '../../src/modules/auth/services/auth-service.js';

const url = process.env.TEST_DATABASE_URL;
const headers = {
  'Content-Type': 'application/json',
  Origin: 'http://localhost:5173',
  'X-DevPath-Client': 'web',
};
const password = '  Password-123!  ';
describe.skipIf(!url)('AUTH-01 real PostgreSQL and HTTP', () => {
  const pool = new pg.Pool({ connectionString: url });
  const emails: string[] = [];
  let base: string;
  let server: ReturnType<ReturnType<typeof createApp>['listen']>;
  let directory: string;
  let publicPem: string;
  let service: Awaited<ReturnType<typeof createAuthService>>;
  const email = () => {
    const value = `qa-${randomUUID()}@example.test`;
    emails.push(value);
    return value;
  };
  const post = (route: string, body: unknown, customHeaders = headers) =>
    fetch(base + '/api/v1/auth/' + route, {
      method: 'POST',
      headers: customHeaders,
      body: JSON.stringify(body),
    });
  beforeAll(async () => {
    // Caller supplies a migrated, isolated TEST_DATABASE_URL; never truncate shared tables.
    await pool.query('SELECT 1 FROM auth.users LIMIT 1');
    directory = await mkdtemp(path.join(tmpdir(), 'devpath-auth-'));
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    publicPem = pair.publicKey;
    const privatePath = path.join(directory, 'private.pem');
    await writeFile(privatePath, pair.privateKey, { mode: 0o600 });
    service = await createAuthService(pool, { privateKeyFile: privatePath, localHttp: true });
    const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX_REQUESTS: '1000' });
    server = createApp({
      config,
      configureRoutes: (app) =>
        app.use('/api/v1/auth', authRouter(service, config.http.allowedOrigins, true)),
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    if (emails.length)
      await pool.query('DELETE FROM auth.users WHERE email=ANY($1::text[])', [emails]);
    await pool.end();
    if (directory) await rm(directory, { recursive: true });
  });
  it('registers normalized email and atomic profile/session; hashes secrets; signs RS256', async () => {
    const normalized = email();
    const response = await post('register', {
      name: 'Cuenta A',
      email: ' ' + normalized.toUpperCase() + ' ',
      password,
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(['accessToken', 'expiresIn', 'tokenType', 'user']);
    expect(body.user).toEqual({ id: expect.any(String), name: 'Cuenta A', email: normalized });
    const verified = await jwtVerify(body.accessToken, await importSPKI(publicPem, 'RS256'), {
      algorithms: ['RS256'],
      issuer: 'urn:devpath:auth',
      audience: 'devpath-api',
    });
    expect(verified.protectedHeader.typ).toBe('at+jwt');
    expect(verified.payload.sub).toBe(body.user.id);
    expect(verified.payload.exp! - verified.payload.iat!).toBe(900);
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toContain('devpath_refresh=');
    for (const flag of ['HttpOnly', 'SameSite=Lax', 'Path=/api/v1/auth'])
      expect(cookie).toContain(flag);
    expect(cookie).not.toMatch(/Domain=|; Secure/);
    const raw = cookie.split(';')[0]!.split('=')[1]!;
    const result = await pool.query(
      'SELECT u.password_hash,p.full_name,t.token_hash,t.expires_at,t.created_at FROM auth.users u JOIN app.profiles p ON p.user_id=u.id JOIN auth.session_families f ON f.user_id=u.id JOIN auth.refresh_tokens t ON t.family_id=f.id WHERE u.id=$1',
      [body.user.id],
    );
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.password_hash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(row.password_hash, password)).toBe(true);
    expect(await argon2.verify(row.password_hash, password.trim())).toBe(false);
    expect(row.token_hash).toBe(createHash('sha256').update(raw).digest('hex'));
    expect(row.token_hash).not.toBe(raw);
    expect((row.expires_at.getTime() - row.created_at.getTime()) / 1000).toBeGreaterThan(604790);
    expect(JSON.stringify(body)).not.toContain(raw);
    const login = await post('login', { email: normalized, password });
    expect(login.status).toBe(200);
    expect((await login.json()).user.id).toBe(body.user.id);
  });
  it('resolves concurrent duplicate registration with one committed graph', async () => {
    const address = email();
    const results = await Promise.all([
      post('register', { name: 'Race', email: address, password }),
      post('register', { name: 'Race', email: address.toUpperCase(), password }),
    ]);
    expect(results.map((x) => x.status).sort()).toEqual([201, 409]);
    const conflict = results.find((x) => x.status === 409)!;
    expect((await conflict.json()).error.code).toBe('EMAIL_ALREADY_REGISTERED');
    const count = await pool.query(
      'SELECT count(*) FROM auth.users u JOIN app.profiles p ON p.user_id=u.id JOIN auth.session_families f ON f.user_id=u.id JOIN auth.refresh_tokens t ON t.family_id=f.id WHERE u.email=$1',
      [address],
    );
    expect(count.rows[0].count).toBe('1');
  });
  it('rolls back user/profile when session insert fails', async () => {
    const address = email();
    // A deliberately nonexistent owner forces a real FK failure after account/profile insertion.
    const { AuthRepository } =
      await import('../../src/modules/auth/repositories/auth-repository.js');
    const repository = new AuthRepository(pool);
    await expect(
      repository.transaction(async (client) => {
        await repository.insertAccount(client, 'Rollback', address, 'synthetic-test-hash');
        await repository.insertSession(
          client,
          '00000000-0000-0000-0000-000000000000',
          'synthetic-token-hash',
          new Date(),
        );
      }),
    ).rejects.toThrow();
    expect(
      (await pool.query('SELECT id FROM auth.users WHERE email=$1', [address])).rows,
    ).toHaveLength(0);
  });
  it('rolls back user when the profile cannot be inserted', async () => {
    const address = email();
    const { AuthRepository } =
      await import('../../src/modules/auth/repositories/auth-repository.js');
    const repository = new AuthRepository(pool);
    await expect(
      repository.transaction(async (client) => {
        await repository.insertAccount(
          client,
          null as unknown as string,
          address,
          'synthetic-test-hash',
        );
      }),
    ).rejects.toThrow();
    expect(
      (await pool.query('SELECT id FROM auth.users WHERE email=$1', [address])).rows,
    ).toHaveLength(0);
  });
  it('returns identical generic failures for unknown account and wrong password', async () => {
    const address = email();
    await post('register', { name: 'Failure', email: address, password });
    const responses = await Promise.all([
      post('login', { email: address, password: 'wrong' }),
      post('login', { email: email(), password: 'wrong' }),
    ]);
    const bodies = [];
    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.headers.get('set-cookie')).toBeNull();
      const body = await response.json();
      bodies.push({ code: body.error.code, message: body.error.message });
    }
    expect(bodies[0]).toEqual(bodies[1]);
    expect(bodies[0].code).toBe('INVALID_CREDENTIALS');
  });
  it('rejects invalid input, wrong media type, missing client and origin', async () => {
    for (const value of ['short', 'x'.repeat(129)])
      expect((await post('register', { name: 'A', email: email(), password: value })).status).toBe(
        400,
      );
    expect(
      (await post('register', { name: 'A', email: email(), password, extra: true })).status,
    ).toBe(400);
    expect(
      (await post('login', { email: email(), password }, { ...headers, 'X-DevPath-Client': '' }))
        .status,
    ).toBe(403);
    expect(
      (await post('login', { email: email(), password }, { ...headers, Origin: '' })).status,
    ).toBe(403);
    expect(
      (
        await post(
          'login',
          { email: email(), password },
          { ...headers, 'Content-Type': 'text/plain' },
        )
      ).status,
    ).toBe(415);
  });
  it('uses Secure prefixed host-only cookie in HTTPS mode', async () => {
    const config = loadConfig({ NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: 'https://localhost' });
    const app = createApp({
      config,
      configureRoutes: (app) =>
        app.use('/api/v1/auth', authRouter(service, config.http.allowedOrigins, false)),
    });
    const extra = app.listen(0, '127.0.0.1');
    await once(extra, 'listening');
    try {
      const response = await fetch(
        `http://127.0.0.1:${(extra.address() as AddressInfo).port}/api/v1/auth/register`,
        {
          method: 'POST',
          headers: { ...headers, Origin: 'https://localhost' },
          body: JSON.stringify({ name: 'TLS', email: email(), password }),
        },
      );
      expect(response.status).toBe(201);
      const cookie = response.headers.get('set-cookie')!;
      expect(cookie).toContain('__Secure-devpath_refresh=');
      expect(cookie).toContain('; Secure');
      expect(cookie).not.toContain('Domain=');
    } finally {
      await new Promise<void>((resolve) => extra.close(() => resolve()));
    }
  });
});
