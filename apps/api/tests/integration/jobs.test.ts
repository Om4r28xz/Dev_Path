import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { RequestHandler } from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { jobsRouter } from '../../src/modules/jobs/http/router.js';
import { resolveCursorKey } from '../../src/modules/jobs/services/cursor.js';
import {
  FixtureJobsProvider,
  LiveJSearchProvider,
  type JobsProvider,
} from '../../src/modules/jobs/services/provider.js';
import { loadConfig } from '../../src/platform/config/env.js';
import { HttpError } from '../../src/platform/errors/http-error.js';

describe('JSR-02 jobs provider API (fixture & live adapter contracts)', () => {
  const userA = randomUUID();
  const userB = randomUUID();
  const cursorKey = resolveCursorKey(
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  );

  const authenticate: RequestHandler = (request, response, next) => {
    const token = request.get('Authorization');
    const owner =
      token === 'Bearer token-user-a' ? userA : token === 'Bearer token-user-b' ? userB : undefined;
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

  let activeServer: ReturnType<ReturnType<typeof createApp>['listen']> | undefined;

  afterEach(async () => {
    if (activeServer) {
      const serverToClose = activeServer;
      activeServer = undefined;
      await new Promise<void>((resolve) => serverToClose.close(() => resolve()));
    }
  });

  async function startServer(provider: JobsProvider) {
    const config = loadConfig({ NODE_ENV: 'test', RATE_LIMIT_MAX_REQUESTS: '1000' });
    const app = createApp({
      config,
      configureRoutes: (expressApp) => {
        expressApp.use('/api/v1', jobsRouter(provider, authenticate, { cursorKey }));
      },
    });
    activeServer = app.listen(0, '127.0.0.1');
    await once(activeServer, 'listening');
    const port = (activeServer.address() as AddressInfo).port;
    return `http://127.0.0.1:${port}`;
  }

  it('requires Bearer JWT (401 UNAUTHENTICATED) on GET /api/v1/jobs and GET /api/v1/jobs/details', async () => {
    const base = await startServer(new FixtureJobsProvider());

    const searchNoAuth = await fetch(`${base}/api/v1/jobs?q=react`);
    expect(searchNoAuth.status).toBe(401);
    const searchErr = await searchNoAuth.json();
    expect(searchErr.error.code).toBe('UNAUTHENTICATED');

    const detailsNoAuth = await fetch(`${base}/api/v1/jobs/details?providerId=synthetic-job-001`);
    expect(detailsNoAuth.status).toBe(401);
    const detailsErr = await detailsNoAuth.json();
    expect(detailsErr.error.code).toBe('UNAUTHENTICATED');
  });

  it('searches in fixture mode (200), paginates with AES-256-GCM nextCursor, and binds cursor to user and query', async () => {
    const base = await startServer(new FixtureJobsProvider({ pageSize: 2 }));

    const page1Res = await fetch(`${base}/api/v1/jobs?q=sint%C3%A9tico&page=1`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(page1Res.status).toBe(200);
    expect(page1Res.headers.get('cache-control')).toBe('no-store');
    const page1 = await page1Res.json();
    expect(page1.mode).toBe('fixture');
    expect(page1.page).toBe(1);
    expect(page1.items).toHaveLength(2);
    expect(page1.hasNextPage).toBe(true);
    expect(page1.nextCursor).toMatch(/^j1\.[A-Za-z0-9_-]+$/u);
    expect(page1.nextCursor).not.toContain('synthetic-next-cursor');

    // Rejects page > 1
    const invalidPageRes = await fetch(`${base}/api/v1/jobs?q=sint%C3%A9tico&page=2`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(invalidPageRes.status).toBe(400);
    const invalidPageBody = await invalidPageRes.json();
    expect(invalidPageBody.error.code).toBe('VALIDATION_ERROR');
    expect(invalidPageBody.error.fields?.page).toBeDefined();

    // Rejects cursor used by another user
    const wrongUserRes = await fetch(
      `${base}/api/v1/jobs?q=sint%C3%A9tico&cursor=${encodeURIComponent(page1.nextCursor)}`,
      { headers: { Authorization: 'Bearer token-user-b' } },
    );
    expect(wrongUserRes.status).toBe(400);

    // Rejects cursor when query changes
    const wrongQueryRes = await fetch(
      `${base}/api/v1/jobs?q=react&cursor=${encodeURIComponent(page1.nextCursor)}`,
      { headers: { Authorization: 'Bearer token-user-a' } },
    );
    expect(wrongQueryRes.status).toBe(400);

    // Advances to page 2 with valid cursor
    const page2Res = await fetch(
      `${base}/api/v1/jobs?q=sint%C3%A9tico&cursor=${encodeURIComponent(page1.nextCursor)}`,
      { headers: { Authorization: 'Bearer token-user-a' } },
    );
    expect(page2Res.status).toBe(200);
    const page2 = await page2Res.json();
    expect(page2.mode).toBe('fixture');
    expect(page2.page).toBe(2);
    expect(page2.items).toHaveLength(1);
    expect(page2.hasNextPage).toBe(false);
    expect(page2.nextCursor).toBeNull();
  });

  it('returns empty items (200) when no jobs match and 400 when arbitrary URL is sent as providerId', async () => {
    const base = await startServer(new FixtureJobsProvider());

    const emptyRes = await fetch(`${base}/api/v1/jobs?q=cobol-inexistente-999`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(emptyRes.status).toBe(200);
    const emptyBody = await emptyRes.json();
    expect(emptyBody).toEqual({
      items: [],
      page: 1,
      hasNextPage: false,
      nextCursor: null,
      mode: 'fixture',
    });

    const detailsOk = await fetch(`${base}/api/v1/jobs/details?providerId=synthetic-job-001`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(detailsOk.status).toBe(200);
    const detailsBody = await detailsOk.json();
    expect(detailsBody.mode).toBe('fixture');
    expect(detailsBody.job.providerId).toBe('synthetic-job-001');

    const details404 = await fetch(`${base}/api/v1/jobs/details?providerId=unknown-job-999`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(details404.status).toBe(404);

    const arbitraryUrlRes = await fetch(
      `${base}/api/v1/jobs/details?providerId=${encodeURIComponent('https://evil.example/ssrf')}`,
      { headers: { Authorization: 'Bearer token-user-a' } },
    );
    expect(arbitraryUrlRes.status).toBe(400);
  });

  it('normalizes live adapter responses (200, empty, 429, timeout 504, invalid JSON 503) and never leaks RAPIDAPI_KEY', async () => {
    const secretKey = 'SECRET_RAPIDAPI_KEY_DO_NOT_LEAK_12345';
    let scenario: 'ok' | 'empty' | 'rate-limit' | 'timeout' | 'bad-json' = 'ok';
    let capturedUrl: URL | undefined;
    let capturedHeaders: Headers | undefined;

    const liveProvider = new LiveJSearchProvider({
      apiKey: secretKey,
      liveEnabled: true,
      timeoutMs: 80,
      nowIso: () => '2026-11-05T12:00:00.000Z',
      fetchFn: async (input, init) => {
        capturedUrl = new URL(String(input));
        capturedHeaders = new Headers(init?.headers);

        if (scenario === 'ok') {
          return new Response(
            JSON.stringify({
              status: 'OK',
              request_id: 'req-1',
              data: {
                jobs: [
                  {
                    job_id: 'live-job-101',
                    job_title: 'React Developer',
                    employer_name: 'Acme Corp',
                    job_location: 'Remote',
                    job_description: 'Looking for React, TypeScript and Git.',
                    job_apply_link: 'https://example.org/apply/101',
                  },
                ],
                cursor: 'upstream-cursor-page-2',
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }

        if (scenario === 'empty') {
          return new Response(
            JSON.stringify({
              status: 'OK',
              request_id: 'req-2',
              data: {
                jobs: [],
                cursor: null,
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }

        if (scenario === 'rate-limit') {
          return new Response(JSON.stringify({ message: `Quota exceeded for key ${secretKey}` }), {
            status: 429,
            headers: {
              'content-type': 'application/json',
              'retry-after': '120',
            },
          });
        }

        if (scenario === 'bad-json') {
          return new Response(`{malformed json with ${secretKey}`, {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }

        // timeout scenario
        return await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      },
    });

    const base = await startServer(liveProvider);

    // 1. 200 OK
    const okRes = await fetch(`${base}/api/v1/jobs?q=react&location=remoto`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(okRes.status).toBe(200);
    const okText = await okRes.text();
    expect(okText).not.toContain(secretKey);
    const okBody = JSON.parse(okText);
    expect(okBody.mode).toBe('live');
    expect(okBody.items).toHaveLength(1);
    expect(okBody.items[0].providerId).toBe('live-job-101');
    expect(okBody.hasNextPage).toBe(true);
    expect(capturedUrl?.origin).toBe('https://jsearch.p.rapidapi.com');
    expect(capturedUrl?.pathname).toBe('/search-v2');
    expect(capturedUrl?.searchParams.get('num_pages')).toBe('1');
    expect(capturedHeaders?.get('X-RapidAPI-Key')).toBe(secretKey);
    expect(capturedHeaders?.get('X-RapidAPI-Host')).toBe('jsearch.p.rapidapi.com');

    // 2. Empty response
    scenario = 'empty';
    const emptyRes = await fetch(`${base}/api/v1/jobs?q=react`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(emptyRes.status).toBe(200);
    const emptyBody = await emptyRes.json();
    expect(emptyBody.items).toEqual([]);
    expect(emptyBody.hasNextPage).toBe(false);
    expect(emptyBody.nextCursor).toBeNull();

    // 3. 429 Rate limited
    scenario = 'rate-limit';
    const rateRes = await fetch(`${base}/api/v1/jobs?q=react`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(rateRes.status).toBe(429);
    expect(rateRes.headers.get('retry-after')).toBe('120');
    const rateText = await rateRes.text();
    expect(rateText).not.toContain(secretKey);
    expect(JSON.parse(rateText).error.code).toBe('RATE_LIMITED');

    // 4. Invalid JSON -> 503 DEPENDENCY_UNAVAILABLE
    scenario = 'bad-json';
    const badJsonRes = await fetch(`${base}/api/v1/jobs?q=react`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(badJsonRes.status).toBe(503);
    const badJsonText = await badJsonRes.text();
    expect(badJsonText).not.toContain(secretKey);
    expect(JSON.parse(badJsonText).error.code).toBe('DEPENDENCY_UNAVAILABLE');

    // 5. Timeout -> 504 DEPENDENCY_TIMEOUT
    scenario = 'timeout';
    const timeoutRes = await fetch(`${base}/api/v1/jobs?q=react`, {
      headers: { Authorization: 'Bearer token-user-a' },
    });
    expect(timeoutRes.status).toBe(504);
    const timeoutText = await timeoutRes.text();
    expect(timeoutText).not.toContain(secretKey);
    expect(JSON.parse(timeoutText).error.code).toBe('DEPENDENCY_TIMEOUT');
  });
});
