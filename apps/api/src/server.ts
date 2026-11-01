import pg from 'pg';
import { authRouter } from './modules/auth/http/router.js';
import { accessTokenMiddleware } from './modules/auth/http/access-token.js';
import { createAuthService } from './modules/auth/services/auth-service.js';
import { profileRouter } from './modules/profile/http/router.js';
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
if (!process.env.DATABASE_URL || !process.env.AUTH_PRIVATE_KEY_FILE)
  throw new Error('DATABASE_URL and AUTH_PRIVATE_KEY_FILE are required.');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
});
pool.on('error', () => logger.error('Database connection unavailable.'));
const localHttp = process.env.AUTH_LOCAL_HTTP === 'true';
const auth = await createAuthService(pool, {
  privateKeyFile: process.env.AUTH_PRIVATE_KEY_FILE,
  localHttp,
});
const app = createApp({
  config,
  logger,
  readyCheck: async () => {
    try {
      await pool.query('SELECT 1 FROM auth.users LIMIT 1');
      return true;
    } catch {
      return false;
    }
  },
  configureRoutes: (app) => {
    app.use('/api/v1/auth', authRouter(auth, config.http.allowedOrigins, localHttp));
    app.use('/api/v1', profileRouter(pool, accessTokenMiddleware(auth)));
  },
});

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info('DevPath API is listening.', {
    host: config.server.host,
    port: config.server.port,
  });
});

installGracefulShutdown(server, {
  logger,
  timeoutMs: config.server.shutdownTimeoutMs,
  // Close the auth database pool after active HTTP requests finish.
  resources: [{ name: 'postgres', close: () => pool.end() }],
});
