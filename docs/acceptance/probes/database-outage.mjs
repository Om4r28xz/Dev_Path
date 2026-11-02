// Run from repository root after pnpm build; QA_PG_BIN points to PostgreSQL binaries.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';

const root = process.cwd();
const binaries = process.env.QA_PG_BIN;
if (!binaries) throw Error('Set QA_PG_BIN to an existing PostgreSQL 16/18 bin directory.');
const temporaryRoot = resolve(process.env.QA_TEMP_ROOT ?? tmpdir());
const directory = await mkdtemp(join(temporaryRoot, 'devpath-qa02-pg-'));
const data = join(directory, 'data');
const executable = (name) => join(binaries, name + (process.platform === 'win32' ? '.exe' : ''));
const pg = (...args) =>
  execFileSync(executable('pg_ctl'), ['-D', data, ...args], {
    stdio: 'ignore',
    windowsHide: true,
    timeout: 30000,
  });
const port = () =>
  new Promise((done, fail) => {
    const server = createServer();
    server.once('error', fail);
    server.listen(0, '127.0.0.1', () => {
      const p = server.address().port;
      server.close(() => done(p));
    });
  });
let api,
  running = false;
const stopApi = async () => {
  if (!api || api.exitCode !== null || api.signalCode !== null) return;
  const done = new Promise((r) => api.once('exit', r));
  api.kill();
  await done;
};
try {
  execFileSync(
    executable('initdb'),
    ['-D', data, '-U', 'devpath_qa02', '-A', 'trust', '--encoding=UTF8'],
    { stdio: 'pipe', windowsHide: true },
  );
  const dbPort = await port(),
    apiPort = await port();
  const start = () => {
    pg(
      '-l',
      join(directory, 'postgres.log'),
      '-o',
      `-h 127.0.0.1 -p ${dbPort} -c max_connections=20 -c shared_buffers=16MB`,
      '-w',
      'start',
    );
    running = true;
  };
  start();
  console.log('probe: isolated PostgreSQL started');
  const keyPath = join(directory, 'access.pem');
  await writeFile(
    keyPath,
    generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({
      type: 'pkcs8',
      format: 'pem',
    }),
    { mode: 0o600 },
  );
  const env = {
    ...process.env,
    DATABASE_URL: `postgresql://devpath_qa02@127.0.0.1:${dbPort}/postgres`,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: String(apiPort),
    AUTH_PRIVATE_KEY_FILE: keyPath,
    AUTH_LOCAL_HTTP: 'true',
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    ENGINE_SERVICE_SECRET: randomUUID(),
  };
  const requireApi = createRequire(join(root, 'apps/api/package.json'));
  for (const file of ['packages/db/src/migrate.ts', 'packages/db/src/seeds/seed.ts'])
    execFileSync(process.execPath, [requireApi.resolve('tsx/cli'), file], {
      cwd: root,
      env,
      stdio: 'pipe',
      windowsHide: true,
    });
  console.log('probe: migrations and seed applied');
  api = spawn(process.execPath, ['apps/api/dist/server.js'], {
    cwd: root,
    env,
    stdio: 'ignore',
    windowsHide: true,
  });
  const base = `http://127.0.0.1:${apiPort}`;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + '/health/ready')).ok) break;
    } catch {
      /* Own service starts. */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal((await fetch(base + '/health/ready')).status, 200);
  const credentials = {
    email: randomUUID() + '@example.test',
    password: 'Synthetic-' + randomUUID() + '!Aa1',
  };
  const post = (path, body) =>
    fetch(base + '/api/v1/auth/' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
        'X-DevPath-Client': 'web',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  const registered = await post('register', { name: 'Database Recovery', ...credentials });
  assert.equal(registered.status, 201);
  const originalId = (await registered.json()).user.id;
  pg('-w', 'stop', '-m', 'fast');
  running = false;
  const offline = await post('login', credentials);
  assert.equal(offline.status, 503);
  const error = await offline.json();
  assert.equal(error.error.code, 'DEPENDENCY_UNAVAILABLE');
  assert.equal(offline.headers.get('set-cookie'), null);
  assert(!/postgresql:|password_hash|stack|Synthetic-|example\.test/.test(JSON.stringify(error)));
  start();
  const recovered = await post('login', credentials);
  assert.equal(recovered.status, 200);
  assert.equal((await recovered.json()).user.id, originalId);
  console.log(
    'PASS ERR-02: isolated PostgreSQL stopped; login503 sanitized/no cookie; restart login200 with same persisted account.',
  );
} finally {
  await stopApi();
  if (running) pg('-w', 'stop', '-m', 'fast');
  await removeOwnedDirectory();
}
async function removeOwnedDirectory() {
  // Verify the exact absolute mkdtemp target before removing our synthetic cluster/key.
  if (
    dirname(resolve(directory)) !== temporaryRoot ||
    !basename(directory).startsWith('devpath-qa02-pg-')
  )
    throw Error('Unsafe cleanup path.');
  await rm(directory, { recursive: true });
}
