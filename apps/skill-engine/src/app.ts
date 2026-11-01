import express, { type Express } from 'express';

import type { EngineConfig } from './platform/config/env.js';
import { createErrorHandler, notFoundHandler } from './platform/http/error-handler.js';
import { createRateLimitMiddleware } from './platform/http/rate-limit.js';
import { requestContext } from './platform/http/request-context.js';
import { createRequestLogger } from './platform/http/request-logger.js';
import { createLogger, type Logger } from './platform/logging/logger.js';
import type { LoadedCatalog } from './modules/analysis/catalog.js';
import { createAnalyzeHandler } from './modules/analysis/analyze-handler.js';

export interface EngineAppOptions {
  readonly catalog: LoadedCatalog;
  readonly config: EngineConfig;
  readonly logger?: Logger;
}

export function createApp(options: EngineAppOptions): Express {
  const app = express();
  const logger =
    options.logger ??
    createLogger({
      service: 'skill-engine',
      environment: options.config.environment,
      includeErrorStack: options.config.environment !== 'production',
    });

  app.disable('x-powered-by');
  app.disable('etag');

  app.use(requestContext);
  app.use(createRequestLogger(logger));
  app.use(createRateLimitMiddleware(options.config.http.rateLimit));
  app.use(express.json({ limit: options.config.http.jsonBodyLimitBytes, strict: true }));

  app.get('/health/live', (_request, response) => {
    response.status(200).json({ service: 'skill-engine', status: 'ok' });
  });

  app.get('/health/ready', (_request, response) => {
    response.status(200).json({ service: 'skill-engine', status: 'ready' });
  });

  // Internal analysis route
  const analyzeHandler = createAnalyzeHandler({
    catalog: options.catalog,
    serviceSecret: options.config.service.secret,
  });
  app.post('/internal/v1/analyze', analyzeHandler);

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
