import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import net from 'node:net';
import pg from 'pg';

const root = process.cwd();
const ar = createRequire(join(root, 'apps/api/package.json'));
const wr = createRequire(join(root, 'apps/web/package.json'));
const database = process.env.E2E_DATABASE_URL;
if (!database) throw Error('E2E_DATABASE_URL must identify a dedicated empty test database.');
const url = new URL(database);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/test|e2e/i.test(url.pathname))
  throw Error('E2E requires a loopback PostgreSQL database named with test or e2e.');
const ports = { web: 5187, api: 32066, engine: 32067, control: 32068 };
const base = `http://127.0.0.1:${ports.web}`;
const controlToken = randomUUID();
const secret = randomUUID();
const children = new Set();
let engine, preview, control, directory;
const pool = new pg.Pool({ connectionString: database });
const env = {
  ...process.env,
  DATABASE_URL: database,
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  AUTH_LOCAL_HTTP: 'true',
  CORS_ALLOWED_ORIGINS: base,
  ENGINE_URL: `http://127.0.0.1:${ports.engine}`,
  ENGINE_SERVICE_SECRET: secret,
  RATE_LIMIT_MAX_REQUESTS: '10000',
};
function launch(args, extra = {}, stdio = 'ignore') {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: { ...env, ...extra },
    stdio,
    windowsHide: true,
  });
  child.on('error', () => {});
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}
function exited(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolve, reject) => {
    child.once('exit', resolve);
    child.once('error', reject);
  });
}
async function stop(child) {
  if (!child || !children.has(child)) return;
  const done = exited(child);
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 12000);
  try {
    await done;
  } finally {
    clearTimeout(timer);
  }
}
async function ready(url, child) {
  for (let i = 0; i < 200; i++) {
    if (child && !children.has(child)) throw Error('A test service exited before readiness.');
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* Our child is starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw Error(`Test service not ready: ${url}`);
}
async function startEngine() {
  if (engine && children.has(engine)) return;
  engine = launch(['apps/skill-engine/dist/server.js'], { PORT: String(ports.engine) });
  await ready(`${env.ENGINE_URL}/health/ready`, engine);
}
try {
  for (const port of Object.values(ports)) {
    await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => server.close(resolve));
    });
  }
  // Refuse an existing user's database BEFORE running migrations or seeds.
  const existing = await pool.query("SELECT to_regclass('auth.users') AS users");
  if (existing.rows[0].users) {
    const count = await pool.query('SELECT count(*) FROM auth.users');
    if (count.rows[0].count !== '0')
      throw Error('E2E database contains users; refusing to modify it.');
  }
  for (const file of ['packages/db/src/migrate.ts', 'packages/db/src/seeds/seed.ts']) {
    if ((await exited(launch([ar.resolve('tsx/cli'), file], {}, 'inherit'))) !== 0)
      throw Error('E2E database preparation failed.');
  }
  directory = await mkdtemp(join(tmpdir(), 'devpath-e2e-'));
  const key = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  });
  env.AUTH_PRIVATE_KEY_FILE = join(directory, 'access-private.pem');
  await writeFile(env.AUTH_PRIVATE_KEY_FILE, key, { mode: 0o600 });
  await startEngine();
  const api = launch(['apps/api/dist/server.js'], { PORT: String(ports.api) });
  await ready(`http://127.0.0.1:${ports.api}/health/ready`, api);
  const { preview: serve } = await import(pathToFileURL(wr.resolve('vite')));
  preview = await serve({
    root: join(root, 'apps/web'),
    preview: {
      host: '127.0.0.1',
      port: ports.web,
      strictPort: true,
      proxy: { '/api': { target: `http://127.0.0.1:${ports.api}` } },
    },
  });
  await ready(base);
  // Test-only loopback control can stop/restart ONLY the engine child we own.
  control = createServer(async (request, response) => {
    if (request.method !== 'POST' || request.headers.authorization !== `Bearer ${controlToken}`) {
      response.writeHead(403).end();
      return;
    }
    try {
      if (request.url === '/engine/stop') await stop(engine);
      else if (request.url === '/engine/start') await startEngine();
      else {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(204).end();
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise((resolve) => control.listen(ports.control, '127.0.0.1', resolve));
  const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
  const code = await exited(
    launch(
      [cli, 'test', ...process.argv.slice(2)],
      {
        E2E_BASE_URL: base,
        E2E_DATABASE_URL: database,
        E2E_CONTROL_URL: `http://127.0.0.1:${ports.control}`,
        E2E_CONTROL_TOKEN: controlToken,
        // Pinned Playwright otherwise copies password values into its AI page snapshot.
        // Keep assertion errors and sanitized traces; omit that automatic DOM copy.
        PLAYWRIGHT_NO_COPY_PROMPT: '1',
      },
      'inherit',
    ),
  );
  process.exitCode = code ?? 1;
} finally {
  if (control) await new Promise((resolve) => control.close(resolve));
  if (preview) await preview.close();
  await Promise.all([...children].map(stop));
  await pool.end();
  if (directory) await rm(directory, { recursive: true }); // Only this invocation's mkdtemp.
}
