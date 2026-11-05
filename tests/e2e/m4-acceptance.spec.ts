import { test, expect, logout } from './fixtures.js';

const syntheticPdf = Buffer.from(
  '%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\n% QA-05 synthetic CV\n%%EOF',
);

test('QA-05: complete M4 journey persists private profile, project, CV, analysis and route progress', async ({
  page,
  app,
}) => {
  const user = await app.register('QA-05 Synthetic Candidate');

  await page.getByLabel('Nombre', { exact: true }).fill('QA-05 Updated Candidate');
  await page
    .getByLabel('Titular profesional (opcional)')
    .fill('Frontend developer in synthetic acceptance');
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click();
  await page.getByRole('checkbox', { name: 'JavaScript', exact: true }).check();
  await page.getByRole('checkbox', { name: 'React', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
  await expect(page.getByText('Habilidades guardadas.', { exact: true })).toBeVisible();

  const analysisId = await app.create(
    'QA-05 Frontend sintética',
    'Buscamos JavaScript, React y Git.',
  );
  await expect(page.getByText('67%', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await page.getByLabel('Título', { exact: true }).fill('Proyecto QA-05 sintético');
  await page
    .getByLabel('Descripción y aportación', { exact: true })
    .fill('Interfaz aislada utilizada exclusivamente para aceptación M4.');
  await page.getByRole('checkbox', { name: 'React', exact: true }).check();
  await page.getByRole('button', { name: 'Añadir proyecto', exact: true }).click();
  await expect(page.getByText('Proyecto añadido.', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Mi perfil', exact: true }).click();
  const cv = page.getByRole('region', { name: 'CV privado' });
  await cv.getByLabel('Seleccionar PDF').setInputFiles({
    name: 'qa-05-synthetic.pdf',
    mimeType: 'application/pdf',
    buffer: syntheticPdf,
  });
  await cv.getByRole('button', { name: 'Subir CV', exact: true }).click();
  await expect(cv.getByText('CV guardado correctamente.', { exact: true })).toBeVisible();

  await page.goto(`/analyses/${analysisId}`);
  await page.getByRole('button', { name: 'Generar ruta de aprendizaje', exact: true }).click();
  await page.waitForURL(/\/learning-paths\/[a-f0-9-]+$/);
  await expect(page.getByText(/se vinculó con un proyecto existente/i)).toBeVisible();
  const pathId = new URL(page.url()).pathname.split('/').at(-1)!;
  const status = page.getByLabel('Estado autodeclarado').first();
  await status.selectOption('completed');
  await expect(status).toHaveValue('completed');
  await expect(page.getByText('1 de 1 pasos completados', { exact: true })).toBeVisible();

  await page.reload();
  await expect(status).toHaveValue('completed');
  const persisted = await (await app.call(user, `/learning-paths/${pathId}`)).json();
  expect(persisted.analysisId).toBe(analysisId);
  expect(persisted.progress).toMatchObject({ completed: 1, total: 1, percentage: 100 });
  expect(persisted.steps[0].projectId).toBeTruthy();

  await logout(page);
  await page.goto(`/learning-paths/${pathId}`);
  await expect(page).toHaveURL(/\/login/);
});
