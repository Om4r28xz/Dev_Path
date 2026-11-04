import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, rm, stat, utimes } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import type { RequestHandler } from 'express';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { cvRouter } from '../../src/modules/cv/router.js';
import { CvService } from '../../src/modules/cv/service.js';
import { LocalCvStorage } from '../../src/modules/cv/storage.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { HttpError } from '../../src/platform/errors/http-error.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
describe.skipIf(!databaseUrl)('CV-01 private PDF with PostgreSQL', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const firstId = randomUUID();
  const secondId = randomUUID();
  const root = resolve('.local-data', 'cv-test-' + randomUUID());
  class FaultStorage extends LocalCvStorage {
    failRemove = false;
    failWrite = false;
    override async writeTemp(source: Parameters<LocalCvStorage['writeTemp']>[0]) {
      if (this.failWrite) {
        source.resume();
        throw new HttpError({
          status: 503,
          code: 'DEPENDENCY_UNAVAILABLE',
          message: 'Synthetic storage failure.',
        });
      }
      return super.writeTemp(source);
    }
    override async remove(key: string) {
      if (this.failRemove) throw new Error('synthetic disk failure');
      return super.remove(key);
    }
  }
  const storage = new FaultStorage(root);
  const service = new CvService(pool, storage);
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
      headers: { Authorization: 'Bearer ' + token, ...init.headers },
    });
  const upload = (
    bytes: Buffer,
    name = 'synthetic.pdf',
    mime = 'application/pdf',
    token = 'owner-a',
  ) => {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(bytes)], { type: mime }), name);
    return call('/me/cv', token, { method: 'PUT', body: form });
  };
  beforeAll(async () => {
    await mkdir(root, { recursive: true });
    await storage.prepare();
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
      configureRoutes: (app) => app.use('/api/v1', cvRouter(service, authenticate)),
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  });
  afterAll(async () => {
    if (server) await new Promise<void>((done) => server.close(() => done()));
    await pool.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])', [[firstId, secondId]]);
    await pool.end();
    if (!root.startsWith(resolve('.local-data') + sep)) throw new Error('Unsafe test cleanup path');
    await rm(root, { recursive: true, force: true });
  });
  it('uploads, downloads and isolates two accounts without exposing storage paths', async () => {
    expect((await call('/me/cv')).status).toBe(404);
    expect((await call('/me/cv', 'bad')).status).toBe(401);
    const response = await upload(pdf);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-File-Cleanup-Pending')).toBe('false');
    const metadata = await response.json();
    expect(metadata).toMatchObject({
      originalName: 'synthetic.pdf',
      mimeType: 'application/pdf',
      sizeBytes: pdf.length,
    });
    expect(JSON.stringify(metadata)).not.toMatch(/storage|path|key/iu);
    expect((await call('/me/cv', 'owner-b')).status).toBe(404);
    expect((await call('/me/cv/download', 'owner-b')).status).toBe(404);
    const download = await call('/me/cv/download');
    expect(download.status).toBe(200);
    expect(download.headers.get('Content-Disposition')).toBe('attachment; filename="cv.pdf"');
    expect(download.headers.get('Cache-Control')).toBe('no-store');
    expect(Buffer.from(await download.arrayBuffer())).toEqual(pdf);
    const restarted = new CvService(pool, new LocalCvStorage(root));
    expect(await restarted.metadata(firstId)).toMatchObject({ id: metadata.id });
  });
  it('rejects invalid type, signature, size, name and extra parts', async () => {
    for (const [bytes, name, mime, status] of [
      [pdf, '../traversal.pdf', 'application/pdf', 400],
      [pdf, 'synthetic.txt', 'application/pdf', 415],
      [pdf, 'synthetic.pdf', 'text/plain', 415],
      [Buffer.from('not a pdf'), 'synthetic.pdf', 'application/pdf', 415],
      [Buffer.alloc(5 * 1024 * 1024 + 1, 65), 'synthetic.pdf', 'application/pdf', 413],
    ] as const)
      expect((await upload(bytes, name, mime)).status).toBe(status);
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }), 'one.pdf');
    form.append('extra', 'no');
    expect((await call('/me/cv', 'owner-a', { method: 'PUT', body: form })).status).toBe(400);
    expect((await service.metadata(firstId)).originalName).toBe('synthetic.pdf');
  });
  it('accepts exactly 5 MiB and preserves the active file on disk failure', async () => {
    const exact = Buffer.concat([pdf, Buffer.alloc(5 * 1024 * 1024 - pdf.length, 32)]);
    expect((await upload(exact, 'limit.pdf')).status).toBe(200);
    const downloaded = await call('/me/cv/download');
    expect((await downloaded.arrayBuffer()).byteLength).toBe(exact.length);
    storage.failWrite = true;
    try {
      expect((await upload(pdf, 'disk-failed.pdf')).status).toBe(503);
    } finally {
      storage.failWrite = false;
    }
    expect((await service.metadata(firstId)).originalName).toBe('limit.pdf');
  });
  it('keeps the confirmed CV on database failure and retries old-file cleanup', async () => {
    await pool.query(
      "CREATE FUNCTION app.reject_test_cv() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$",
    );
    await pool.query(
      'CREATE TRIGGER reject_test_cv BEFORE UPDATE ON app.cv_files FOR EACH ROW EXECUTE FUNCTION app.reject_test_cv()',
    );
    try {
      expect((await upload(pdf, 'rejected.pdf')).status).toBe(503);
    } finally {
      await pool.query('DROP TRIGGER reject_test_cv ON app.cv_files');
      await pool.query('DROP FUNCTION app.reject_test_cv()');
    }
    expect((await service.metadata(firstId)).originalName).toBe('limit.pdf');
    storage.failRemove = true;
    const replacement = await upload(pdf, 'new.pdf');
    expect(replacement.status).toBe(200);
    expect(replacement.headers.get('X-File-Cleanup-Pending')).toBe('true');
    expect((await service.metadata(firstId)).originalName).toBe('new.pdf');
    expect(await service.repository.pendingKeys()).toHaveLength(1);
    storage.failRemove = false;
    await service.reconcile();
    expect(await service.repository.pendingKeys()).toHaveLength(0);
  });
  it('serializes concurrent replacements to one active reference', async () => {
    const responses = await Promise.all([
      upload(pdf, 'parallel-a.pdf'),
      upload(pdf, 'parallel-b.pdf'),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(
      (
        await pool.query('SELECT count(*)::int AS count FROM app.cv_files WHERE user_id=$1', [
          firstId,
        ])
      ).rows[0].count,
    ).toBe(1);
    expect(['parallel-a.pdf', 'parallel-b.pdf']).toContain(
      (await service.metadata(firstId)).originalName,
    );
  });
  it('reconciles abandoned temporary and final files after the grace period', async () => {
    const temp = await storage.writeTemp(Readable.from(pdf));
    const orphan = await storage.promote(temp.key);
    const second = await storage.writeTemp(Readable.from(pdf));
    const old = new Date(Date.now() - 11 * 60_000);
    await utimes(join(root, 'files', orphan + '.pdf'), old, old);
    await utimes(join(root, 'temp', second.key + '.part'), old, old);
    await service.reconcile();
    await expect(stat(join(root, 'files', orphan + '.pdf'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(stat(join(root, 'temp', second.key + '.part'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });
  it('deletes idempotently, including after a restart', async () => {
    expect((await call('/me/cv', 'owner-a', { method: 'DELETE' })).status).toBe(204);
    expect((await call('/me/cv', 'owner-a', { method: 'DELETE' })).status).toBe(204);
    expect((await call('/me/cv/download')).status).toBe(404);
  });
});
