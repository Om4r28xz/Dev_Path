import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/platform/config/env.js';

describe('loadConfig', () => {
  it('aplica límites locales seguros y un cuerpo JSON de 128 KiB', () => {
    const config = loadConfig({ NODE_ENV: 'test' });

    expect(config.server).toMatchObject({ host: '127.0.0.1', port: 3000 });
    expect(config.http.jsonBodyLimitBytes).toBe(128 * 1024);
    expect(config.http.allowedOrigins).toEqual(['http://localhost:5173']);
  });

  it('rechaza configuración de producción sin orígenes explícitos', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(
      'CORS_ALLOWED_ORIGINS es obligatorio en production.',
    );
  });

  it('rechaza comodines y orígenes que no sean exactos', () => {
    expect(() => loadConfig({ CORS_ALLOWED_ORIGINS: '*' })).toThrow(
      'CORS_ALLOWED_ORIGINS no acepta comodines.',
    );
    expect(() => loadConfig({ CORS_ALLOWED_ORIGINS: 'https://devpath.test/path' })).toThrow(
      'CORS_ALLOWED_ORIGINS contiene un origen inválido',
    );
  });

  it('valida enteros operativos al arrancar', () => {
    expect(() => loadConfig({ RATE_LIMIT_MAX_REQUESTS: '0' })).toThrow(
      'RATE_LIMIT_MAX_REQUESTS debe ser un entero entre 1 y 100000.',
    );
  });
});
