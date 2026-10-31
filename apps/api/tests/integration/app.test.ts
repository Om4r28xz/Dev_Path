import type { AddressInfo } from 'node:net';
import { once } from 'node:events';

import type { Express } from 'express';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { loadConfig, type AppConfig } from '../../src/platform/config/env.js';
import { createLogger, type LogOutput } from '../../src/platform/logging/logger.js';

interface ErrorPayload {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

const closeServers: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closeServers.splice(0).map((close) => close()));
});

describe('API HTTP foundation', () => {
  it('expone health sin secretos y conserva request IDs UUID válidos', async () => {
    const { baseUrl } = await start(createApp({ config: testConfig() }));
    const requestId = '7bfb5328-6b03-4ff8-91e8-a285f31add47';

    const liveResponse = await fetch(`${baseUrl}/health/live`, {
      headers: { 'X-Request-Id': requestId },
    });
    const readyResponse = await fetch(`${baseUrl}/health/ready`);

    expect(liveResponse.status).toBe(200);
    expect(liveResponse.headers.get('x-request-id')).toBe(requestId);
    expect(await liveResponse.json()).toEqual({ service: 'api', status: 'ok' });
    expect(readyResponse.status).toBe(200);
    expect(await readyResponse.json()).toEqual({ service: 'api', status: 'ready' });
  });

  it('devuelve el sobre JSON contractual para rutas desconocidas', async () => {
    const { baseUrl } = await start(createApp({ config: testConfig() }));

    const response = await fetch(`${baseUrl}/api/v1/unknown`, {
      headers: { 'X-Request-Id': 'not-a-uuid' },
    });
    const payload = (await response.json()) as ErrorPayload;

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(payload.error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'No se encontró el recurso solicitado.',
    });
    expect(payload.error.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
  });

  it('rechaza JSON mayor a 128 KiB con 413', async () => {
    const { baseUrl } = await start(createApp({ config: testConfig() }));

    const response = await fetch(`${baseUrl}/api/v1/unknown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(140 * 1024) }),
    });
    const payload = (await response.json()) as ErrorPayload;

    expect(response.status).toBe(413);
    expect(payload.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('sanea errores internos y no expone stack ni secretos', async () => {
    const lines: string[] = [];
    const logger = createLogger({
      service: 'api',
      environment: 'test',
      includeErrorStack: true,
      output: captureOutput(lines),
    });
    const app = createApp({
      config: testConfig(),
      logger,
      configureRoutes: (expressApp) => {
        expressApp.get('/test/error', () => {
          throw new Error('Bearer internal-secret');
        });
      },
    });
    const { baseUrl } = await start(app);

    const response = await fetch(`${baseUrl}/test/error`, {
      headers: {
        Authorization: 'Bearer request-secret',
        Cookie: 'refresh=request-cookie-secret',
      },
    });
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).toContain('INTERNAL_ERROR');
    expect(body).not.toContain('stack');
    expect(body).not.toContain('internal-secret');
    expect(lines.join('\n')).not.toContain('internal-secret');
    expect(lines.join('\n')).not.toContain('request-secret');
    expect(lines.join('\n')).not.toContain('request-cookie-secret');
  });

  it('aplica CORS por origen exacto sin tratarlo como autorización', async () => {
    const { baseUrl } = await start(createApp({ config: testConfig() }));

    const allowed = await fetch(`${baseUrl}/health/live`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    const rejected = await fetch(`${baseUrl}/health/live`, {
      headers: { Origin: 'https://attacker.example' },
    });
    const rejectedPayload = (await rejected.json()) as ErrorPayload;

    expect(allowed.status).toBe(200);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(rejected.status).toBe(403);
    expect(rejectedPayload.error.code).toBe('FORBIDDEN');
  });

  it('limita abuso local y comunica cuándo reintentar', async () => {
    const config = testConfig({ maxRequests: 1 });
    const { baseUrl } = await start(createApp({ config }));

    const first = await fetch(`${baseUrl}/health/live`);
    const second = await fetch(`${baseUrl}/health/live`);
    const payload = (await second.json()) as ErrorPayload;

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.headers.get('retry-after')).toBe('60');
    expect(payload.error.code).toBe('RATE_LIMITED');
  });
});

function testConfig(rateLimit?: { maxRequests: number }): AppConfig {
  const config = loadConfig({ NODE_ENV: 'test' });

  return {
    ...config,
    http: {
      ...config.http,
      rateLimit: {
        ...config.http.rateLimit,
        ...(rateLimit ?? {}),
      },
    },
  };
}

function captureOutput(lines: string[]): LogOutput {
  return {
    info: (line) => lines.push(line),
    warn: (line) => lines.push(line),
    error: (line) => lines.push(line),
  };
}

async function start(app: Express): Promise<{ baseUrl: string }> {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as AddressInfo;

  closeServers.push(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error === undefined ? resolve() : reject(error)));
      }),
  );

  return { baseUrl: `http://127.0.0.1:${address.port}` };
}
