import { randomUUID } from 'node:crypto';
import { test, expect, logout } from './fixtures.js';

test('M1: registration, login, profile, skills, real 67% analysis, persistence and deletion', async ({
  page,
  app,
}) => {
  const user = await app.register('M1 Synthetic Candidate');
  await logout(page);
  await page.goto('/analyses');
  await expect(page).toHaveURL(/\/login/);
  await app.login(user);
  await page.getByLabel('Nombre', { exact: true }).fill('M1 Updated Candidate');
  await page.getByLabel('Titular profesional (opcional)').fill('Synthetic frontend developer');
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click();
  await expect
    .poll(async () => (await (await app.call(user, '/me')).json()).name)
    .toBe('M1 Updated Candidate');
  await page.getByRole('checkbox', { name: 'JavaScript', exact: true }).check();
  await page.getByRole('checkbox', { name: 'React', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Git', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
  await expect(page.getByText('Habilidades guardadas.', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Git', exact: true }).uncheck();
  const saved = page.waitForResponse(
    (r) => r.url().endsWith('/me/skills') && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
  expect((await saved).status()).toBe(200);
  const id = await app.create('Synthetic 67', 'Buscamos JavaScript, React y Git.');
  await expect(page.getByText('67%', { exact: true })).toBeVisible();
  const result = page.getByRole('region', { name: 'Resultado del análisis', exact: true });
  for (const heading of [
    'Tecnologías detectadas',
    'Habilidades coincidentes',
    'Habilidades faltantes',
  ])
    await expect(result.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Evidencias', exact: true }).locator('q'),
  ).toHaveCount(3);
  const dto = await (await app.call(user, `/analyses/${id}`)).json();
  expect(dto.requiredSkillIds).toEqual(['git', 'javascript', 'react']);
  expect(dto.matchedSkillIds).toEqual(['javascript', 'react']);
  expect(dto.missingSkillIds).toEqual(['git']);
  expect(dto.compatibilityPercentage).toBe(67);
  const stored = (
    await app.pool.query(
      'SELECT user_id, compatibility_percentage, evidence FROM app.analyses WHERE id=$1',
      [id],
    )
  ).rows[0];
  expect(stored.user_id).toBe(user.id);
  expect(stored.compatibility_percentage).toBe(67);
  expect(stored.evidence).toHaveLength(3);
  await page.reload();
  await expect(page.getByText('67%', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al historial', exact: true }).click();
  await page.getByRole('link', { name: 'Synthetic 67', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/analyses/${id}$`));
  await page.getByRole('link', { name: 'Volver al historial', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar análisis: Synthetic 67', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '¿Eliminar este análisis?', exact: true });
  await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Eliminar análisis: Synthetic 67', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Eliminar análisis: Synthetic 67', exact: true }).click();
  await dialog.getByRole('button', { name: 'Confirmar eliminación', exact: true }).click();
  await expect(page.getByText('Análisis eliminado.', { exact: true })).toBeVisible();
  expect((await app.pool.query('SELECT id FROM app.analyses WHERE id=$1', [id])).rowCount).toBe(0);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Todavía no tienes análisis guardados', exact: true }),
  ).toBeVisible();
  await page.goto(`/analyses/${id}`);
  await expect(
    page.getByRole('heading', { name: 'Análisis no encontrado', exact: true }),
  ).toBeVisible();
  await logout(page);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
});

test('M1: two real accounts cannot list, read or delete each other’s analyses', async ({
  page,
  app,
}) => {
  const a = await app.register('Isolation A');
  const id = await app.create('Private A', 'JavaScript and React');
  await logout(page);
  const b = await app.register('Isolation B');
  await page.goto('/analyses');
  await expect(
    page.getByRole('heading', { name: 'Todavía no tienes análisis guardados', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Private A', { exact: true })).toHaveCount(0);
  for (const method of ['GET', 'DELETE'])
    expect((await app.call(b, `/analyses/${id}`, { method })).status).toBe(404);
  await page.goto(`/analyses/${id}`);
  await expect(
    page.getByRole('heading', { name: 'Análisis no encontrado', exact: true }),
  ).toBeVisible();
  expect(
    (await app.pool.query('SELECT user_id FROM app.analyses WHERE id=$1', [id])).rows[0].user_id,
  ).toBe(a.id);
  await logout(page);
  await app.login(a);
  await page.goto(`/analyses/${id}`);
  await expect(page.getByRole('heading', { name: 'Private A', exact: true })).toBeVisible();
});

test('M1: real engine outage retains the draft and idempotency key, retry saves once', async ({
  page,
  app,
}) => {
  const user = await app.register('Dependency Failure');
  const keys: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/analyses'))
      keys.push(request.headers()['idempotency-key']!);
  });
  await app.engine('stop');
  await page.goto('/analysis/new');
  await page.getByLabel('Título del puesto (opcional)').fill('Engine retry');
  await page.getByLabel('Texto de la vacante', { exact: true }).fill('JavaScript, React and Git');
  const failed = page.waitForResponse(
    (r) => r.url().endsWith('/analyses') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Analizar', exact: true }).click();
  expect((await failed).status()).toBe(503);
  await expect(page.getByRole('alert')).toContainText('Conservamos la vacante');
  await expect(page.getByLabel('Texto de la vacante', { exact: true })).toHaveValue(
    'JavaScript, React and Git',
  );
  expect((await app.call(user, '/me')).status).toBe(200);
  expect(
    (await app.pool.query('SELECT id FROM app.analyses WHERE user_id=$1', [user.id])).rowCount,
  ).toBe(0);
  await app.engine('start');
  await page.getByRole('button', { name: 'Analizar', exact: true }).click();
  await page.waitForURL(/\/analyses\/[a-f0-9-]+$/);
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  const replay = await app.call(user, '/analyses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': keys[0]!,
    },
    body: JSON.stringify({
      source: { type: 'text', title: 'Engine retry', text: 'JavaScript, React and Git' },
    }),
  });
  expect(replay.status).toBe(200);
  expect(
    (await app.pool.query('SELECT id FROM app.analyses WHERE user_id=$1', [user.id])).rowCount,
  ).toBe(1);
});

test('M1: legacy evidence, 0 versus null, and hostile HTML remain safe', async ({ page, app }) => {
  const user = await app.register('Legacy and HTML');
  const hostile = '<img src=x onerror="window.__e2eXss=1"> JavaScript';
  const id = await app.create(hostile, hostile);
  await expect(page.getByText('0%', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: hostile, exact: true })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Evidencias', exact: true }).locator('q'),
  ).toHaveText(['JavaScript']);
  expect(await page.locator('main img, main script').count()).toBe(0);
  expect(await page.evaluate(() => Reflect.get(window, '__e2eXss'))).toBeUndefined();
  // Simulate only this fixture's pre-evidence persisted row; never edit another user's data.
  await app.pool.query('UPDATE app.analyses SET evidence=$1::jsonb WHERE id=$2 AND user_id=$3', [
    '[]',
    id,
    user.id,
  ]);
  await page.reload();
  await expect(
    page.getByText('No hay fragmentos disponibles para este análisis.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('0%', { exact: true })).toBeVisible();
  await app.create('No technologies', 'Buscamos una persona organizada y puntual.');
  await expect(
    page.getByText('No se detectaron tecnologías del catálogo. No se calcula un porcentaje.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('0%', { exact: true })).toHaveCount(0);
  expect((await app.call(user, `/analyses/${randomUUID()}`)).status).toBe(404);
});
