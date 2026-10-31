import { createApp } from './app.js';
import { loadConfig } from './platform/config/env.js';
import { installGracefulShutdown } from './platform/lifecycle/graceful-shutdown.js';
import { createLogger } from './platform/logging/logger.js';

const config = loadConfig();
const logger = createLogger({
  service: 'api',
  environment: config.environment,
  includeErrorStack: config.environment !== 'production',
});
const app = createApp({ config, logger });

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info('DevPath API is listening.', {
    host: config.server.host,
    port: config.server.port,
  });
});

installGracefulShutdown(server, {
  logger,
  timeoutMs: config.server.shutdownTimeoutMs,
  // DAT-01 registers the PostgreSQL pool here as a RuntimeResource.
  resources: [],
});
