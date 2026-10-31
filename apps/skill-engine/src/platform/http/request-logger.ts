import { performance } from 'node:perf_hooks';

import type { RequestHandler } from 'express';

import type { Logger } from '../logging/logger.js';
import { getRequestId } from './request-context.js';

export function createRequestLogger(logger: Logger): RequestHandler {
  return (request, response, next) => {
    const startedAt = performance.now();

    response.once('finish', () => {
      logger.info('HTTP request completed.', {
        requestId: getRequestId(response),
        method: request.method,
        path: request.path,
        status: response.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      });
    });

    next();
  };
}
