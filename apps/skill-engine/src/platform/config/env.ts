const JSON_BODY_LIMIT_BYTES = 64 * 1024;

export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface EngineConfig {
  readonly environment: RuntimeEnvironment;
  readonly server: {
    readonly host: string;
    readonly port: number;
    readonly shutdownTimeoutMs: number;
  };
  readonly http: {
    readonly jsonBodyLimitBytes: number;
    readonly rateLimit: {
      readonly maxRequests: number;
      readonly windowMs: number;
    };
  };
  readonly service: {
    readonly secret: string;
  };
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): EngineConfig {
  const runtimeEnvironment = readEnvironment(environment.NODE_ENV);

  return {
    environment: runtimeEnvironment,
    server: {
      host: readHost(environment.HOST),
      port: readPort(environment.PORT, 3001),
      shutdownTimeoutMs: readInteger(
        environment.SHUTDOWN_TIMEOUT_MS,
        10_000,
        'SHUTDOWN_TIMEOUT_MS',
        1_000,
        60_000,
      ),
    },
    http: {
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
    service: {
      secret: readServiceSecret(environment.ENGINE_SERVICE_SECRET, runtimeEnvironment),
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

function readPort(rawValue: string | undefined, fallback: number): number {
  if (rawValue === undefined || rawValue.trim() === '') {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
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

function readServiceSecret(rawValue: string | undefined, environment: RuntimeEnvironment): string {
  const value = rawValue?.trim() ?? '';

  if (value.length === 0) {
    if (environment === 'production') {
      throw new Error('ENGINE_SERVICE_SECRET es obligatorio en production.');
    }

    return 'dev-secret';
  }

  return value;
}
