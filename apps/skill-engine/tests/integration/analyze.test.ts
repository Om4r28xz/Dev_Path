import type { AddressInfo } from 'node:net';
import { once } from 'node:events';

import type { Express } from 'express';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { loadConfig, type EngineConfig } from '../../src/platform/config/env.js';
import { loadCatalog } from '../../src/modules/analysis/catalog.js';

const catalog = loadCatalog();
const SERVICE_SECRET = 'test-service-secret';

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

function testConfig(): EngineConfig {
  const config = loadConfig({ NODE_ENV: 'test', ENGINE_SERVICE_SECRET: SERVICE_SECRET });
  return config;
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

function makeApp(): Express {
  return createApp({ config: testConfig(), catalog });
}

const VALID_BODY = {
  catalogVersion: '1.0.0',
  jobText: 'We need experience with React and Docker.',
  candidateSkillIds: ['react', 'docker'],
};

describe('POST /internal/v1/analyze', () => {
  it('returns 401 without credential', async () => {
    const { baseUrl } = await start(makeApp());

    const response = await fetch(`${baseUrl}/internal/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const payload = (await response.json()) as ErrorPayload;

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('INVALID_SERVICE_CREDENTIAL');
  });

  it('returns 401 with wrong credential', async () => {
    const { baseUrl } = await start(makeApp());

    const response = await fetch(`${baseUrl}/internal/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer wrong-secret',
      },
      body: JSON.stringify(VALID_BODY),
    });
    const payload = (await response.json()) as ErrorPayload;

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe('INVALID_SERVICE_CREDENTIAL');
  });

  it('returns 400 with invalid body', async () => {
    const { baseUrl } = await start(makeApp());

    const response = await fetch(`${baseUrl}/internal/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_SECRET}`,
      },
      body: JSON.stringify({ catalogVersion: 'not-semver', jobText: '', candidateSkillIds: [] }),
    });
    const payload = (await response.json()) as ErrorPayload;

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 on catalogVersion mismatch', async () => {
    const { baseUrl } = await start(makeApp());

    const response = await fetch(`${baseUrl}/internal/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_SECRET}`,
      },
      body: JSON.stringify({ ...VALID_BODY, catalogVersion: '9.9.9' }),
    });
    const payload = (await response.json()) as ErrorPayload;

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe('CATALOG_VERSION_MISMATCH');
  });

  it('returns 200 with correct matching result', async () => {
    const { baseUrl } = await start(makeApp());

    const response = await fetch(`${baseUrl}/internal/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_SECRET}`,
      },
      body: JSON.stringify(VALID_BODY),
    });
    const payload = (await response.json()) as {
      requiredSkillIds: string[];
      matchedSkillIds: string[];
      missingSkillIds: string[];
      matchPercentage: number | null;
      evidence: unknown[];
      versions: { catalog: string; extractor: string; scoring: string };
    };

    expect(response.status).toBe(200);
    expect(payload.requiredSkillIds).toContain('react');
    expect(payload.requiredSkillIds).toContain('docker');
    expect(payload.matchedSkillIds).toContain('react');
    expect(payload.matchedSkillIds).toContain('docker');
    expect(payload.missingSkillIds).toHaveLength(0);
    expect(payload.matchPercentage).toBe(100);
    expect(payload.versions.catalog).toBe('1.0.0');
    expect(payload.evidence.length).toBeGreaterThan(0);
  });

  it('returns a deterministic 67 percent response through the internal API', async () => {
    const { baseUrl } = await start(makeApp());
    const response = await fetch(`${baseUrl}/internal/v1/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_SECRET}`,
      },
      body: JSON.stringify({
        catalogVersion: catalog.version,
        jobText: 'JavaScript, React and Git. No experience with Docker is required.',
        candidateSkillIds: ['javascript', 'react'],
      }),
    });
    const payload = (await response.json()) as {
      requiredSkillIds: string[];
      matchedSkillIds: string[];
      missingSkillIds: string[];
      matchPercentage: number | null;
      versions: { catalog: string; extractor: string; scoring: string };
    };

    expect(response.status).toBe(200);
    expect(payload.requiredSkillIds).toEqual(['git', 'javascript', 'react']);
    expect(payload.matchedSkillIds).toEqual(['javascript', 'react']);
    expect(payload.missingSkillIds).toEqual(['git']);
    expect(payload.matchPercentage).toBe(67);
    expect(payload.versions).toEqual({ catalog: '1.0.0', extractor: '1.1.0', scoring: '1.1.0' });
  });
});

describe('GET /health/live', () => {
  it('returns 200', async () => {
    const { baseUrl } = await start(makeApp());

    const response = await fetch(`${baseUrl}/health/live`);
    const payload = (await response.json()) as { service: string; status: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ service: 'skill-engine', status: 'ok' });
  });
});
