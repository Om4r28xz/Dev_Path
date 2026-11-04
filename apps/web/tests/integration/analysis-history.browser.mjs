/* global document, window */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const root = process.cwd();
const ar = createRequire(root + '/apps/api/package.json'),
  wr = createRequire(root + '/apps/web/package.json');
const { Pool } = ar('pg');
const { chromium } = ar(process.env.DEVPATH_PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  if (!process.env.DATABASE_URL)
    throw Error('Set DATABASE_URL to an isolated migrated and seeded test database.');
  const base = 'http://127.0.0.1:5186',
    secret = randomUUID(),
    users = [];
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let browser, vite;
  const start = (file, env) =>
    spawn(process.execPath, [ar.resolve('tsx/cli'), file], {
      cwd: root,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        RATE_LIMIT_MAX_REQUESTS: '10000',
        ...env,
      },
      stdio: 'ignore',
      windowsHide: true,
    });
  const engine = start('apps/skill-engine/src/server.ts', {
    PORT: '31967',
    ENGINE_SERVICE_SECRET: secret,
  });
  const api = start('apps/api/src/server.ts', {
    PORT: '31966',
    AUTH_PRIVATE_KEY_FILE: root + '/.local-data/keys/access-private.pem',
    AUTH_LOCAL_HTTP: 'true',
    CORS_ALLOWED_ORIGINS: base,
    ENGINE_URL: 'http://127.0.0.1:31967',
    ENGINE_SERVICE_SECRET: secret,
  });
  const wait = async (url) => {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(url)).ok) return;
      } catch {
        /* Readiness can fail while our services are starting. */
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    throw Error('Service not ready ' + url);
  };
  try {
    const { createServer } = await import(pathToFileURL(wr.resolve('vite')));
    vite = await createServer({
      root: root + '/apps/web',
      server: {
        port: 5186,
        strictPort: true,
        host: '127.0.0.1',
        proxy: { '/api': { target: 'http://127.0.0.1:31966' } },
      },
    });
    await vite.listen();
    await wait('http://127.0.0.1:31966/health/ready');
    await wait('http://127.0.0.1:31967/health/ready');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const register = async (name) => {
      const email = randomUUID() + '@example.test',
        password = 'Synthetic-' + randomUUID() + '!aA1';
      await page.goto(base + '/register');
      await page.getByLabel('Nombre completo').fill(name);
      await page.getByLabel('Correo electrónico').fill(email);
      await page.getByLabel(/^Contraseña/).fill(password);
      const response = page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/auth/register') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Registrarse', exact: true }).click();
      const session = await (await response).json();
      const user = { id: session.user.id, token: session.accessToken, email, password };
      users.push(user);
      await page.waitForURL('**/profile');
      return user;
    };
    const login = async (user) => {
      await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
      await page.waitForURL('**/login');
      await page.getByLabel('Correo electrónico').fill(user.email);
      await page.getByLabel(/^Contraseña/).fill(user.password);
      const response = page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/auth/login') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      user.token = (await (await response).json()).accessToken;
      await page.waitForURL('**/profile');
    };
    const call = (user, path, init = {}) =>
      page.request.fetch(base + '/api/v1' + path, {
        ...init,
        headers: { Authorization: 'Bearer ' + user.token, ...init.headers },
      });
    const rows = () =>
      page.getByRole('list', { name: 'Análisis guardados', exact: true }).getByRole('listitem');
    const goHistory = async () => {
      await page.goto(base + '/analyses');
      await page.getByRole('heading', { name: 'Historial de análisis', exact: true }).waitFor();
    };
    const create = async (title, text) => {
      await page.goto(base + '/analysis/new');
      await page.getByLabel('Título del puesto (opcional)').fill(title);
      await page.getByLabel('Texto de la vacante', { exact: true }).fill(text);
      await page.getByRole('button', { name: 'Analizar tecnologías', exact: true }).click();
      await page.waitForURL(/\/analyses\/[a-f0-9-]+$/);
      await page.getByRole('heading', { name: 'Resultado del análisis', exact: true }).waitFor();
      return new URL(page.url()).pathname.split('/').at(-1);
    };
    const a = await register('History A');
    await goHistory();
    await page
      .getByRole('heading', { name: 'Todavía no tienes análisis guardados', exact: true })
      .waitFor();
    await page.goto(base + '/profile');
    await page.getByRole('checkbox', { name: 'JavaScript', exact: true }).check();
    await page.getByRole('checkbox', { name: 'React', exact: true }).check();
    await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
    await page.getByText('Habilidades guardadas.', { exact: true }).waitFor();
    const first = await create('Primero67', 'Buscamos JavaScript, React y Git.');
    await page.getByText('67%', { exact: true }).waitFor();
    await page.getByRole('link', { name: /Volver al historial$/ }).click();
    await page.getByRole('link', { name: 'Primero67', exact: true }).waitFor();
    assert.equal(await rows().count(), 1);
    const second = await create('Segundo0', 'Buscamos Java y SQL.');
    await page.getByText('0%', { exact: true }).waitFor();
    await page.getByRole('link', { name: /Volver al historial$/ }).click();
    await page.getByRole('link', { name: 'Segundo0', exact: true }).waitFor();
    assert.equal(await rows().count(), 2);
    assert.equal(await rows().locator('time').count(), 2);
    if (process.env.DEVPATH_HISTORY_SCREENSHOT) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: process.env.DEVPATH_HISTORY_SCREENSHOT, fullPage: true });
    }
    await page.getByRole('link', { name: 'Primero67', exact: true }).click();
    await page.getByText('67%', { exact: true }).waitFor();
    await page.locator('nav a[href="/profile"]').click();
    await page.getByRole('checkbox', { name: 'React', exact: true }).uncheck();
    await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
    await page.getByText('Habilidades guardadas.', { exact: true }).waitFor();
    await page.locator('nav a[href="/analyses"]').click();
    await page
      .getByText(
        'Las habilidades de tu perfil cambiaron. Este análisis conserva la comparación original.',
        { exact: true },
      )
      .first()
      .waitFor();
    assert.equal(
      await page
        .getByText(
          'Las habilidades de tu perfil cambiaron. Este análisis conserva la comparación original.',
          { exact: true },
        )
        .count(),
      2,
    );
    await page.getByRole('link', { name: 'Primero67', exact: true }).click();
    await page.getByText('67%', { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole('region', { name: 'Evidencias del texto', exact: true })
        .locator('q')
        .count(),
      3,
    );
    await page.getByRole('link', { name: /Volver al historial$/ }).click();
    const profileBefore = (
      await pool.query('SELECT skills_revision FROM app.profiles WHERE user_id=$1', [a.id])
    ).rows[0];
    const removeSecond = () =>
      page.getByRole('button', { name: 'Eliminar análisis: Segundo0', exact: true });
    await removeSecond().click();
    const dialog = page.getByRole('dialog', { name: '¿Eliminar este análisis?', exact: true });
    await dialog.waitFor();
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Cancelar', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.keyboard.press('Tab');
    assert.equal(
      await dialog
        .getByRole('button', { name: 'Confirmar eliminación', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await rows().count(), 2);
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Eliminar análisis: Segundo0',
    );
    assert.equal(await removeSecond().evaluate((el) => el === document.activeElement), true);
    let deletes = 0;
    page.on('request', (r) => {
      if (r.method() === 'DELETE') deletes++;
    });
    const delayDelete = async (route) => {
      await new Promise((r) => setTimeout(r, 300));
      await route.continue();
    };
    await page.route('**/api/v1/analyses/' + second, delayDelete);
    await removeSecond().click();
    await dialog
      .getByRole('button', { name: 'Confirmar eliminación', exact: true })
      .evaluate((el) => {
        el.click();
        el.click();
      });
    await page.getByText('Eliminando análisis…', { exact: true }).waitFor();
    await page.getByText('Análisis eliminado.', { exact: true }).waitFor();
    assert.equal(deletes, 1);
    assert.equal(await rows().count(), 1);
    assert.equal(
      await page
        .getByText('Análisis eliminado.', { exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.unroute('**/api/v1/analyses/' + second, delayDelete);
    assert.deepEqual(
      (await pool.query('SELECT skills_revision FROM app.profiles WHERE user_id=$1', [a.id]))
        .rows[0],
      profileBefore,
    );
    assert.equal(
      (await pool.query('SELECT count(*) FROM app.analyses WHERE id=$1', [second])).rows[0].count,
      '0',
    );
    await page.reload();
    await page.getByRole('link', { name: 'Primero67', exact: true }).waitFor();
    assert.equal(await rows().count(), 1);
    await page.goto(base + '/analyses/' + second);
    await page.getByRole('heading', { name: 'Análisis no encontrado', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await page.waitForURL('**/login');
    const b = await register('History B');
    await goHistory();
    await page
      .getByRole('heading', { name: 'Todavía no tienes análisis guardados', exact: true })
      .waitFor();
    assert.equal(await page.getByText('Primero67', { exact: true }).count(), 0);
    await page.goto(base + '/analyses/' + first);
    await page.getByRole('heading', { name: 'Análisis no encontrado', exact: true }).waitFor();
    assert.equal((await call(b, '/analyses/' + first, { method: 'DELETE' })).status(), 404);
    assert.equal(
      (await pool.query('SELECT count(*) FROM app.analyses WHERE id=$1', [first])).rows[0].count,
      '1',
    );
    await page.goto(base + '/analyses/invalid');
    await page.getByRole('heading', { name: 'Análisis no encontrado', exact: true }).waitFor();
    await login(a);
    // Seed paging via real authorized API+engine, not fabricated responses.
    for (let i = 0; i < 22; i++) {
      const response = await call(a, '/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() },
        data: { source: { type: 'text', title: 'Paginado ' + i, text: 'Buscamos SQL.' } },
      });
      assert.equal(response.status(), 201);
    }
    // Equal microsecond timestamps challenge the API cursor on synthetic records.
    await pool.query(
      "UPDATE app.analyses SET created_at='2026-11-02T12:00:00.123456Z' WHERE user_id=$1",
      [a.id],
    );
    const expected = (
      await pool.query(
        'SELECT id FROM app.analyses WHERE user_id=$1 ORDER BY created_at DESC,id DESC',
        [a.id],
      )
    ).rows.map((r) => r.id);
    let failNext = true;
    const pageFailure = async (route) => {
      if (new URL(route.request().url()).searchParams.has('cursor') && failNext) {
        failNext = false;
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Controlled paging failure' },
          }),
        });
      } else await route.continue();
    };
    await page.route('**/api/v1/analyses?*', pageFailure);
    await goHistory();
    await page.getByText('Mostrando 20 análisis cargados.', { exact: true }).waitFor();
    assert.equal(await rows().count(), 20);
    await page.getByRole('button', { name: 'Cargar más análisis', exact: true }).click();
    await page.getByText('No se pudo cargar la siguiente página.', { exact: false }).waitFor();
    assert.equal(await rows().count(), 20);
    await page.getByRole('button', { name: 'Reintentar más análisis', exact: true }).click();
    await page.getByText('Mostrando 23 análisis cargados.', { exact: true }).waitFor();
    const ids = await page
      .locator('a[data-analysis-link]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href').split('/').at(-1)));
    assert.deepEqual(ids, expected);
    assert.equal(new Set(ids).size, 23);
    assert.equal(
      await page
        .locator('a[data-analysis-link]')
        .nth(20)
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.unroute('**/api/v1/analyses?*', pageFailure);
    // Retry a delete failure without hiding the existing item or claiming success.
    const target = ids[0],
      row = rows().first();
    await row.getByRole('button', { name: /Eliminar análisis:/ }).click();
    const failingDelete = async (route) => {
      if (route.request().method() === 'DELETE')
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Controlled delete failure' },
          }),
        });
      else await route.continue();
    };
    await page.route('**/api/v1/analyses/' + target, failingDelete);
    await dialog.getByRole('button', { name: 'Confirmar eliminación', exact: true }).click();
    await page.getByText('No se pudo confirmar la eliminación.', { exact: false }).waitFor();
    assert.equal(
      (await pool.query('SELECT count(*) FROM app.analyses WHERE id=$1', [target])).rows[0].count,
      '1',
    );
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.unroute('**/api/v1/analyses/' + target, failingDelete);
    // Concurrent external removal must recover from404 and refresh the list.
    await rows()
      .first()
      .getByRole('button', { name: /Eliminar análisis:/ })
      .click();
    assert.equal((await call(a, '/analyses/' + target, { method: 'DELETE' })).status(), 204);
    await dialog.getByRole('button', { name: 'Confirmar eliminación', exact: true }).click();
    await page.getByText('Ese análisis ya no está disponible.', { exact: false }).waitFor();
    await page.getByText('Mostrando 22 análisis cargados.', { exact: true }).waitFor();
    assert.equal(
      (await pool.query('SELECT count(*) FROM app.analyses WHERE id=$1', [target])).rows[0].count,
      '0',
    );
    // Initial query error has a separate retry state, never a fake empty success.
    let failFirst = true;
    const initialFailure = async (route) => {
      if (failFirst) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Controlled initial failure' },
          }),
        });
      } else await route.continue();
    };
    await page.route('**/api/v1/analyses?*', initialFailure);
    await page.reload();
    await page
      .getByText('No se pudo cargar o actualizar el historial.', { exact: false })
      .waitFor();
    assert.equal(
      await page
        .getByRole('heading', { name: 'Todavía no tienes análisis guardados', exact: true })
        .count(),
      0,
    );
    failFirst = false;
    await page.getByRole('button', { name: 'Reintentar historial', exact: true }).click();
    await page.getByText('Mostrando 20 análisis cargados.', { exact: true }).waitFor();
    await page.unroute('**/api/v1/analyses?*', initialFailure);
    // A delayed A list arriving after logout/loginB must not populate B's cache.
    let release,
      captured = false;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const delayedList = async (route) => {
      const response = await route.fetch();
      captured = true;
      await gate;
      await route.fulfill({ response }).catch(() => undefined);
    };
    await page.route('**/api/v1/analyses?*', delayedList);
    await page.reload();
    for (let i = 0; i < 100 && !captured; i++) await new Promise((r) => setTimeout(r, 30));
    assert.equal(captured, true);
    await login(b);
    release();
    await page.unroute('**/api/v1/analyses?*', delayedList);
    await goHistory();
    await page
      .getByRole('heading', { name: 'Todavía no tienes análisis guardados', exact: true })
      .waitFor();
    assert.equal(await page.locator('a[data-analysis-link]').count(), 0);
    console.log(
      'PASS ANL04 browser: real two-account flow, empty history, create2/invalidate,67/detail/evidence, changed skills immutable snapshot, confirm/cancel/Escape/focus, double-delete blocked, reload/delete404, foreignGET/DELETE404, real cursor20+3 at equal timestamps no duplicates/gaps, paging error/retry, delete503 retry/cancel, concurrent404 recovery, initial error/retry and late-account query isolation.',
    );
  } finally {
    if (browser) await browser.close();
    if (vite) await vite.close();
    api.kill();
    engine.kill();
    if (users.length)
      await pool.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])', [users.map((u) => u.id)]);
    await pool.end();
  }
})().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
