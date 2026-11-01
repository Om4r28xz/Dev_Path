import { describe, expect, it } from 'vitest';

import { createLogger, type LogOutput } from '../../src/platform/logging/logger.js';

describe('createLogger', () => {
  it('redacta encabezados, cookies, tokens y bearer incluidos en errores', () => {
    const lines: string[] = [];
    const output: LogOutput = {
      info: (line) => lines.push(line),
      warn: (line) => lines.push(line),
      error: (line) => lines.push(line),
    };
    const logger = createLogger({
      service: 'api',
      environment: 'test',
      includeErrorStack: true,
      output,
    });

    logger.error('request failed', {
      authorization: 'Bearer access-secret',
      cookie: 'refresh=refresh-secret',
      nested: { password: 'password-secret' },
      error: new Error('upstream rejected Bearer upstream-secret'),
    });

    const serialized = lines.join('\n');
    expect(serialized).not.toContain('access-secret');
    expect(serialized).not.toContain('refresh-secret');
    expect(serialized).not.toContain('password-secret');
    expect(serialized).not.toContain('upstream-secret');
    expect(serialized).toContain('[REDACTED]');
  });
});
