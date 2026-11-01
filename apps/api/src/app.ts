import express, { type Express } from 'express';

import type { AppConfig } from './platform/config/env.js';
import { createCorsMiddleware } from './platform/http/cors.js';
import { createErrorHandler, notFoundHandler } from './platform/http/error-handler.js';
import { createRateLimitMiddleware } from './platform/http/rate-limit.js';
import { requestContext } from './platform/http/request-context.js';
import { createRequestLogger } from './platform/http/request-logger.js';
import { createLogger, type Logger } from './platform/logging/logger.js';

export interface AppOptions {
  readonly config: AppConfig;
  readonly configureRoutes?: (app: Express) => void;
  readonly logger?: Logger;
  readonly readyCheck?: () => Promise<boolean>;
}

export function createApp(options: AppOptions): Express {
  const app = express();
  const logger =
    options.logger ??
    createLogger({
      service: 'api',
      environment: options.config.environment,
      includeErrorStack: options.config.environment !== 'production',
    });

  app.disable('x-powered-by');
  app.disable('etag');

  app.use(requestContext);
  app.use(createRequestLogger(logger));
  app.use(createCorsMiddleware(options.config.http.allowedOrigins));
  app.use(createRateLimitMiddleware(options.config.http.rateLimit));
  app.use(express.json({ limit: options.config.http.jsonBodyLimitBytes, strict: true }));

  app.get('/health/live', (_request, response) => {
    response.status(200).json({ service: 'api', status: 'ok' });
  });

  app.get('/health/ready', async (_request, response) => {
    const ready = (await options.readyCheck?.()) ?? true;
    response
      .status(ready ? 200 : 503)
      .json({ service: 'api', status: ready ? 'ready' : 'not_ready' });
  });

  options.configureRoutes?.(app);

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
