import { randomUUID } from 'node:crypto';
import { test, expect, logout } from './fixtures.js';

test('LRN-04: generate once, persist progress and survive a deleted linked project', async ({
  page,
  app,
}) => {
  const user = await app.register('Learning Path Synthetic');
  const projectResponse = await app.call(user, '/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Proyecto sintético',
      description: 'Proyecto aislado para comprobar la instantánea de la ruta.',
      url: null,
      skillIds: ['git'],
    }),
  });
  expect(projectResponse.status).toBe(201);
  const project = await projectResponse.json();
  await app.create('Ruta con Git', 'Buscamos experiencia con Git.');

  let creates = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/learning-paths')
      creates++;
  });
  await page.getByRole('button', { name: 'Generar ruta de aprendizaje', exact: true }).dblclick();
  await page.waitForURL(/\/learning-paths\/[a-f0-9-]+$/);
  expect(creates).toBe(1);
  await expect(page.locator('.learning-page')).toBeFocused();
  await expect(page.getByText(/avance es autodeclarado/i)).toBeVisible();
  await expect(page.getByText(/se vinculó con un proyecto existente/i)).toBeVisible();

  const status = page.getByLabel('Estado autodeclarado').first();
  await status.selectOption('completed');
  await expect(status).toHaveValue('completed');
  await expect(page.getByText('1 de 1 pasos completados', { exact: true })).toBeVisible();
  await page.reload();
  await expect(status).toHaveValue('completed');

  expect((await app.call(user, `/projects/${project.id}`, { method: 'DELETE' })).status).toBe(204);
  await page.reload();
  await expect(
    page.getByText(
      'El proyecto vinculado ya no está disponible o esta ruta no usó uno. La actividad guardada permanece disponible.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /Practicar flujo de ramas/ })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('LRN-04: zero gaps is positive and a rejected update remains unconfirmed', async ({
  page,
  app,
}) => {
  const user = await app.register('Learning Path Zero Gaps');
  expect(
    (
      await app.call(user, '/me/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillIds: ['git'] }),
      })
    ).status,
  ).toBe(200);
  await app.create('Sin brechas', 'Buscamos experiencia con Git.');
  await page.getByRole('button', { name: 'Guardar ruta sin brechas', exact: true }).click();
  await page.waitForURL(/\/learning-paths\/[a-f0-9-]+$/);
  await expect(page.getByText(/No se detectaron brechas/)).toBeVisible();
  await expect(page.getByLabel(/Estado autodeclarado/)).toHaveCount(0);

  expect(
    (
      await app.call(user, '/me/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillIds: [] }),
      })
    ).status,
  ).toBe(200);
  await app.create('Fallo controlado', 'Buscamos experiencia con Git.');
  await page.getByRole('button', { name: 'Generar ruta de aprendizaje', exact: true }).click();
  await page.waitForURL(/\/learning-paths\/[a-f0-9-]+$/);
  await page.route('**/api/v1/learning-paths/*/steps/*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Synthetic failure', requestId: '' },
      }),
    }),
  );
  const status = page.getByLabel('Estado autodeclarado').first();
  await expect(status).toHaveValue('pending');
  await status.selectOption('completed');
  await expect(page.getByRole('alert')).toContainText('Se conserva el estado pendiente');
  await expect(status).toHaveValue('pending');
  await expect(page.getByRole('alert').locator('..')).toBeFocused();
});

test('LRN-04: another user receives 404 and routes remain keyboard reachable', async ({
  page,
  app,
}) => {
  const owner = await app.register('Learning Path Owner');
  const analysisId = await app.create('Ruta privada', 'Buscamos experiencia con Git.');
  const created = await app.call(owner, '/learning-paths', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() },
    body: JSON.stringify({ analysisId }),
  });
  expect(created.status).toBe(201);
  const path = await created.json();
  await logout(page);

  const other = await app.register('Learning Path Other');
  expect((await app.call(other, `/learning-paths/${path.id}`)).status).toBe(404);
  await page.goto(`/learning-paths/${path.id}`);
  await expect(page.getByRole('heading', { name: 'Ruta no encontrada' })).toBeVisible();

  await page.goto('/profile');
  const routesLink = page.getByRole('link', { name: 'Rutas', exact: true });
  await routesLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/learning-paths$/);
  await expect(page.getByRole('heading', { name: 'Aún no tienes rutas' })).toBeVisible();
});
