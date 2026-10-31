import { readPort } from './port.js';

const JSON_BODY_LIMIT_BYTES = 128 * 1024;

export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface AppConfig {
  readonly environment: RuntimeEnvironment;
  readonly server: {
    readonly host: string;
    readonly port: number;
    readonly shutdownTimeoutMs: number;
  };
  readonly http: {
    readonly allowedOrigins: readonly string[];
    readonly jsonBodyLimitBytes: number;
    readonly rateLimit: {
      readonly maxRequests: number;
      readonly windowMs: number;
    };
  };
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const runtimeEnvironment = readEnvironment(environment.NODE_ENV);

  return {
    environment: runtimeEnvironment,
    server: {
      host: readHost(environment.HOST),
      port: readPort(environment.PORT, 3000),
      shutdownTimeoutMs: readInteger(
        environment.SHUTDOWN_TIMEOUT_MS,
        10_000,
        'SHUTDOWN_TIMEOUT_MS',
        1_000,
        60_000,
      ),
    },
    http: {
      allowedOrigins: readAllowedOrigins(environment.CORS_ALLOWED_ORIGINS, runtimeEnvironment),
      jsonBodyLimitBytes: JSON_BODY_LIMIT_BYTES,
      rateLimit: {
        maxRequests: readInteger(
          environment.RATE_LIMIT_MAX_REQUESTS,
          120,
          'RATE_LIMIT_MAX_REQUESTS',
          1,
          100_000,
        ),
        windowMs: readInteger(
          environment.RATE_LIMIT_WINDOW_MS,
          60_000,
          'RATE_LIMIT_WINDOW_MS',
          1_000,
          3_600_000,
        ),
      },
    },
  };
}

function readEnvironment(rawValue: string | undefined): RuntimeEnvironment {
  const value = rawValue ?? 'development';

  if (value !== 'development' && value !== 'test' && value !== 'production') {
    throw new Error('NODE_ENV debe ser development, test o production.');
  }

  return value;
}

function readHost(rawValue: string | undefined): string {
  const value = rawValue?.trim() || '127.0.0.1';

  if (value.length > 253 || /[\s/]/u.test(value)) {
    throw new Error('HOST no es un nombre de host válido.');
  }

  return value;
}

function readInteger(
  rawValue: string | undefined,
  fallback: number,
  name: string,
  minimum: number,
  maximum: number,
): number {
  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} debe ser un entero entre ${minimum} y ${maximum}.`);
  }

  return value;
}

function readAllowedOrigins(
  rawValue: string | undefined,
  environment: RuntimeEnvironment,
): readonly string[] {
  if (rawValue === undefined || rawValue.trim() === '') {
    if (environment === 'production') {
      throw new Error('CORS_ALLOWED_ORIGINS es obligatorio en production.');
    }

    return ['http://localhost:5173'];
  }

  const origins = rawValue
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS debe incluir al menos un origen.');
  }

  const uniqueOrigins = new Set<string>();

  for (const origin of origins) {
    if (origin === '*') {
      throw new Error('CORS_ALLOWED_ORIGINS no acepta comodines.');
    }

    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error(`CORS_ALLOWED_ORIGINS contiene un origen inválido: ${origin}.`);
    }

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.origin !== origin ||
      url.username !== '' ||
      url.password !== ''
    ) {
      throw new Error(`CORS_ALLOWED_ORIGINS contiene un origen inválido: ${origin}.`);
    }

    uniqueOrigins.add(origin);
  }

  return [...uniqueOrigins];
}
