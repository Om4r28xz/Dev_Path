import { analysesRouter } from './modules/analyses/router.js';
import { EngineClient } from './modules/analyses/engine-client.js';
import pg from 'pg';
import { authRouter } from './modules/auth/http/router.js';
import { accessTokenMiddleware } from './modules/auth/http/access-token.js';
import { createAuthService } from './modules/auth/services/auth-service.js';
import { profileRouter } from './modules/profile/http/router.js';
import { cvRouter } from './modules/cv/router.js';
import { CvService } from './modules/cv/service.js';
import { LocalCvStorage } from './modules/cv/storage.js';
import { jobsRouter } from './modules/jobs/http/router.js';
import { resolveCursorKey } from './modules/jobs/services/cursor.js';
import { createJobsProviderFromEnv } from './modules/jobs/services/provider.js';
import { projectsRouter } from './modules/projects/router.js';
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
const engine = new EngineClient({
  url: process.env.ENGINE_URL ?? 'http://127.0.0.1:3001',
  secret:
    process.env.ENGINE_SERVICE_SECRET ?? (config.environment === 'production' ? '' : 'dev-secret'),
});
if (config.environment === 'production' && !process.env.CV_STORAGE_DIR)
  throw new Error('CV_STORAGE_DIR is required in production.');
const cvStorage = new LocalCvStorage(process.env.CV_STORAGE_DIR ?? '.local-data/cv');
await cvStorage.prepare();
const cv = new CvService(pool, cvStorage);
await cv.reconcile().catch(() => logger.warn('CV cleanup reconciliation deferred.'));
const cvReconcileTimer = setInterval(() => {
  void cv.reconcile().catch(() => logger.warn('CV cleanup reconciliation deferred.'));
}, 10 * 60_000);
cvReconcileTimer.unref();
const jobsProvider = createJobsProviderFromEnv(process.env);
const jobsCursorKey = resolveCursorKey(process.env.JOBS_CURSOR_KEY, config.environment);
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
    app.use(
      '/api/v1/auth',
      authRouter(
        auth,
        config.http.allowedOrigins,
        localHttp,
        config.environment === 'test' ? config.http.rateLimit.maxRequests : 60,
      ),
    );
    app.use('/api/v1', profileRouter(pool, accessTokenMiddleware(auth)));
    app.use('/api/v1', cvRouter(cv, accessTokenMiddleware(auth)));
    app.use('/api/v1', projectsRouter(pool, accessTokenMiddleware(auth)));
    app.use(
      '/api/v1',
      jobsRouter(jobsProvider, accessTokenMiddleware(auth), { cursorKey: jobsCursorKey }),
    );
    app.use('/api/v1', analysesRouter(pool, accessTokenMiddleware(auth), engine));
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
  resources: [
    {
      name: 'cv-reconciliation',
      close: async () => {
        clearInterval(cvReconcileTimer);
      },
    },
    { name: 'postgres', close: () => pool.end() },
  ],
});
