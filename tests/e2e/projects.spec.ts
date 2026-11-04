import { test, expect } from './fixtures.js';

test('PRJ-02: create, edit, reload and delete a real project with keyboard-safe controls', async ({
  page,
  app,
}) => {
  const user = await app.register('Projects Synthetic');
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await page.waitForURL('**/profile/projects');
  await expect(page.getByRole('heading', { name: 'Mis proyectos', exact: true })).toBeVisible();
  await expect(page.getByText(/información es autodeclarada/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aún no has añadido proyectos' })).toBeVisible();

  await page.getByLabel('Título', { exact: true }).fill('Portfolio sintético');
  await page.getByLabel('Descripción y aportación', { exact: true }).fill('Construí la interfaz.');
  await page
    .getByLabel('Enlace externo (opcional)', { exact: true })
    .fill('https://example.org/portfolio');
  const react = page.getByRole('checkbox', { name: 'React', exact: true });
  await react.focus();
  await page.keyboard.press('Space');
  await expect(react).toBeChecked();

  let creates = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/projects')
      creates++;
  });
  await page.getByRole('button', { name: 'Añadir proyecto', exact: true }).dblclick();
  await expect(page.getByText('Proyecto añadido.', { exact: true })).toBeVisible();
  expect(creates).toBe(1);

  const card = page.getByRole('article', { name: 'Portfolio sintético' });
  await expect(card).toContainText('Información autodeclarada');
  await expect(card).toContainText('React');
  const external = card.getByRole('link', { name: /Visitar proyecto/ });
  await expect(external).toHaveAttribute('target', '_blank');
  await expect(external).toHaveAttribute('rel', 'noreferrer');
  await page.reload();
  await expect(page.getByRole('article', { name: 'Portfolio sintético' })).toBeVisible();

  await page
    .getByRole('article', { name: 'Portfolio sintético' })
    .getByRole('button', { name: 'Editar' })
    .click();
  await page.getByLabel('Título', { exact: true }).fill('Portfolio actualizado');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(page.getByText('Proyecto actualizado.', { exact: true })).toBeVisible();
  await page.reload();
  const updated = page.getByRole('article', { name: 'Portfolio actualizado' });
  await expect(updated).toBeVisible();

  await updated.getByRole('button', { name: 'Eliminar' }).click();
  const dialog = page.getByRole('dialog', { name: '¿Eliminar este proyecto?' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await updated.getByRole('button', { name: 'Eliminar' }).click();
  await page.getByRole('button', { name: 'Confirmar eliminación', exact: true }).click();
  await expect(page.getByText('Proyecto eliminado.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aún no has añadido proyectos' })).toBeVisible();
  expect((await (await app.call(user, '/projects')).json()).items).toEqual([]);

  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
