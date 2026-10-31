import { createApp } from './app.js';
import { loadConfig } from './platform/config/env.js';
import { installGracefulShutdown } from './platform/lifecycle/graceful-shutdown.js';
import { createLogger } from './platform/logging/logger.js';
import { loadCatalog } from './modules/analysis/catalog.js';

const config = loadConfig();
const logger = createLogger({
  service: 'skill-engine',
  environment: config.environment,
  includeErrorStack: config.environment !== 'production',
});

const catalog = loadCatalog();
logger.info('Catalog loaded.', { version: catalog.version, entries: catalog.entries.length });

const app = createApp({ config, logger, catalog });

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info('Skill-engine is listening.', {
    host: config.server.host,
    port: config.server.port,
  });
});

installGracefulShutdown(server, {
  logger,
  timeoutMs: config.server.shutdownTimeoutMs,
  resources: [],
});
