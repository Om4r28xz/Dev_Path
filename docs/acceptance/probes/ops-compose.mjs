// Real official Compose stack, unique project, synthetic accounts; never removes volumes.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { expectRestoredProfile } from '../../../tests/e2e/support/profile-readiness.mjs';

const docker = process.env.OPS_DOCKER_PATH || 'docker';
const project = 'devpath-m1-ops-' + randomUUID().slice(0, 8);
const base = 'http://localhost:8080';
const secrets = new Set();
const redact = (text) => {
  let result = String(text);
  for (const secret of secrets) if (secret) result = result.split(secret).join('[REDACTED]');
  return result.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');
};
const command = (file, args, timeout = 600000) =>
  execFileSync(file, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'pipe',
    windowsHide: true,
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
const compose = (...args) =>
  command(docker, [
    'compose',
    '-p',
    project,
    '--env-file',
    'infra/.env',
    '-f',
    'infra/compose.yaml',
    ...args,
  ]);
const report = {
  productCommit: '',
  project,
  status: 'blocked',
  stage: 'preflight',
  checks: [],
  cleanup: 'not needed',
  volumesRemoved: false,
};
const check = (name, observed) => report.checks.push({ name, observed, result: 'passed' });
let browser,
  started = false;
async function wait(url) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(3000) })).ok) return;
    } catch {
      /* Own services starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw Error('Readiness timeout for own Compose stack.');
}
try {
  report.productCommit = command('git', ['rev-parse', 'HEAD']).trim();
  report.dockerVersion = command(docker, ['info', '--format', '{{.ServerVersion}}'], 30000).trim();
  assert.equal(
    command('git', ['status', '--porcelain']).trim(),
    '',
    'Run OPS in a clean checkout.',
  );
  report.composeVersion = command(docker, ['compose', 'version', '--short'], 30000).trim();
  assert.equal(
    command(docker, [
      'ps',
      '-aq',
      '--filter',
      `label=com.docker.compose.project=${project}`,
    ]).trim(),
    '',
  );
  assert.equal(
    command(docker, [
      'volume',
      'ls',
      '-q',
      '--filter',
      `label=com.docker.compose.project=${project}`,
    ]).trim(),
    '',
  );
  // Refuse an occupied public proxy port instead of testing somebody else's stack.
  const { createServer } = await import('node:net');
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(8080, '127.0.0.1', () => server.close(resolve));
  });
  assert.equal(
    await readFile('infra/.env', 'utf8')
      .then(() => true)
      .catch(() => false),
    false,
    'Use a fresh isolated checkout without an existing infra/.env.',
  );
  command(process.execPath, ['scripts/setup-local.mjs']);
  for (const line of (await readFile('infra/.env', 'utf8')).split(/\r?\n/)) {
    const [key, value] = line.split('=');
    if (['POSTGRES_PASSWORD', 'ENGINE_SERVICE_SECRET'].includes(key)) secrets.add(value);
  }
  report.status = 'running';
  report.stage = 'build/migrate/start';
  compose('config', '--quiet');
  started = true;
  compose('up', '-d', 'db');
  compose('run', '--rm', 'migrate');
  compose('run', '--rm', 'seed');
  compose('up', '--build', '-d', '--wait', '--wait-timeout', '180');
  await wait(base + '/health/ready');
  check('official Compose build/migrations/seed/readiness', true);
  report.postgresVersion = compose('exec', '-T', 'db', 'postgres', '--version').trim();
  assert.match(report.postgresVersion, /\b16\./);
  const ids = compose('ps', '-q').trim().split(/\s+/).filter(Boolean);
  assert.equal(ids.length, 4, 'Expected db/api/engine/web running.');
  for (const id of ids) {
    const service = command(docker, [
      'inspect',
      '--format',
      '{{index .Config.Labels "com.docker.compose.service"}}',
      id,
    ]).trim();
    const bindings = JSON.parse(
      command(docker, ['inspect', '--format', '{{json .HostConfig.PortBindings}}', id]),
    );
    if (service !== 'web')
      assert(
        Object.values(bindings ?? {}).every((value) => !value?.length),
        'Non-web service published a host port.',
      );
    else assert.equal(bindings['8080/tcp'][0].HostIp, '127.0.0.1');
  }
  check('only web published on loopback', true);
  assert.equal((await fetch(base + '/login')).status, 200);
  assert.equal((await fetch(base + '/internal/v1/analyze')).status, 404);
  check('SPA direct reload and internal route blocked', true);
  report.stage = 'real browser flow';
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const email = randomUUID() + '@example.test',
    password = 'Synthetic-' + randomUUID() + '!Aa1';
  secrets.add(password);
  await page.goto(base + '/register');
  await page.getByLabel('Nombre completo').fill('Compose Synthetic');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel(/^Contraseña/).fill(password);
  const registration = page.waitForResponse(
    (r) => r.url().endsWith('/auth/register') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Registrarse', exact: true }).click();
  const registered = await registration;
  assert.equal(registered.status(), 201);
  secrets.add((await registered.json()).accessToken);
  await page.waitForURL('**/profile');
  const cookie = (await context.cookies()).find((c) => c.name === 'devpath_refresh');
  assert(cookie?.httpOnly && cookie.sameSite === 'Lax' && cookie.path === '/api/v1/auth');
  secrets.add(cookie.value);
  await page.getByLabel('Nombre', { exact: true }).fill('Compose Updated');
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click();
  await page.getByText('Perfil guardado.', { exact: true }).waitFor();
  for (const skill of ['JavaScript', 'React'])
    await page.getByRole('checkbox', { name: skill, exact: true }).check();
  await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
  await page.getByText('Habilidades guardadas.', { exact: true }).waitFor();
  await page.goto(base + '/analysis/new');
  await page.getByLabel('Título del puesto (opcional)').fill('Compose 67');
  await page.getByLabel('Texto de la vacante', { exact: true }).fill('JavaScript, React y Git');
  await page.getByRole('button', { name: 'Analizar', exact: true }).click();
  await page.waitForURL(/\/analyses\/[a-f0-9-]+$/);
  const detail = page.url();
  await page.getByText('67%', { exact: true }).waitFor();
  assert.equal(
    await page.getByRole('region', { name: 'Evidencias', exact: true }).locator('q').count(),
    3,
  );
  check('register/profile/skills/real analysis67/evidence', true);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.waitForURL('**/login');
  report.stage = 'persistent restart';
  compose('run', '--rm', 'migrate');
  compose('run', '--rm', 'seed');
  compose('restart');
  await wait(base + '/health/ready');
  await page.goto(base + '/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel(/^Contraseña/).fill(password);
  const restoredSkills = page.waitForResponse(
    (r) => r.url().endsWith('/me/skills') && r.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/profile');
  const savedSkills = await restoredSkills;
  assert.equal(savedSkills.status(), 200, 'Saved skills must reload successfully after restart.');
  assert.deepEqual((await savedSkills.json()).skillIds, ['javascript', 'react']);
  await expectRestoredProfile(page, 'Compose Updated');
  await page.goto(detail);
  await page.getByText('67%', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Volver al historial', exact: true }).click();
  await page.getByRole('link', { name: 'Compose 67', exact: true }).waitFor();
  check('login/profile/history/snapshot persist after real restart', true);
  report.stage = 'engine outage and retry';
  compose('stop', 'engine');
  await page.goto(base + '/analysis/new');
  await page.getByLabel('Texto de la vacante', { exact: true }).fill('JavaScript, React y Git');
  const keys = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/analyses'))
      keys.push(r.headers()['idempotency-key']);
  });
  const failure = page.waitForResponse(
    (r) => r.url().endsWith('/analyses') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Analizar', exact: true }).click();
  assert.equal((await failure).status(), 503);
  await page
    .getByRole('alert')
    .getByText(/Conservamos la vacante/)
    .waitFor();
  const profile = await context.newPage();
  await profile.goto(base + '/profile');
  await profile.getByLabel('Nombre', { exact: true }).waitFor();
  assert.equal(await profile.getByLabel('Nombre', { exact: true }).inputValue(), 'Compose Updated');
  await profile.close();
  compose('up', '-d', '--wait', 'engine');
  await page.getByRole('button', { name: 'Analizar', exact: true }).click();
  await page.waitForURL(/\/analyses\/[a-f0-9-]+$/);
  assert.equal(keys.length, 2);
  assert(keys[0] && keys[0] === keys[1]);
  await page.getByText('67%', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Volver al historial', exact: true }).click();
  const items = page
    .getByRole('list', { name: 'Análisis guardados', exact: true })
    .getByRole('listitem');
  await items.nth(1).waitFor();
  assert.equal(await items.count(), 2);
  check('real engine503 -> retry same key -> success', true);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.waitForURL('**/login');
  report.status = 'passed';
  report.stage = 'complete';
} catch (error) {
  report.error = redact(error.stack || error.message || error).slice(0, 6000);
  if (started) {
    try {
      report.diagnostics = redact(
        compose('logs', '--no-color', '--tail', '50', 'api', 'engine', 'db', 'web'),
      ).slice(-10000);
    } catch {
      report.diagnostics = 'Service diagnostics unavailable.';
    }
  }
  if (report.status !== 'blocked') report.status = 'failed';
  console.error(redact('OPS-01 ' + report.status + ': ' + (error.message || error)).slice(0, 2000));
  process.exitCode = 1;
} finally {
  try {
    await browser?.close();
  } catch (error) {
    report.browserCleanup = redact(error.message);
    report.status = 'failed';
    process.exitCode = 1;
  }
  if (started) {
    try {
      compose('down');
      report.cleanup = 'own containers/network stopped/removed; volume retained (no -v)';
    } catch (error) {
      report.cleanup = redact(error.message).slice(0, 1000);
      report.status = 'failed';
      process.exitCode = 1;
    }
  }
  const output = process.env.OPS_OUTPUT_PATH || 'docs/acceptance/evidence/ops-runtime.json';
  const { dirname } = await import('node:path');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, redact(JSON.stringify(report, null, 2)) + '\n');
  console.log('OPS-01 result=' + report.status + '; volumes removed=false');
}
