import { test, expect } from './fixtures.js';

const pdf = (text: string) =>
  Buffer.from(`%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\n% ${text}\n%%EOF`);

test('CV-02: upload, reload, authenticated download, replace and delete a private PDF', async ({
  page,
  app,
}) => {
  await app.register('CV Synthetic');
  await page.goto('/profile');
  const panel = page.getByRole('region', { name: 'CV privado' });
  await expect(
    panel.getByText('DevPath no analiza ni extrae habilidades', { exact: false }),
  ).toBeVisible();
  await panel.getByLabel('Seleccionar PDF').setInputFiles({
    name: 'cv-inicial.pdf',
    mimeType: 'application/pdf',
    buffer: pdf('initial'),
  });
  let uploads = 0;
  page.on('request', (request) => {
    if (request.method() === 'PUT' && new URL(request.url()).pathname === '/api/v1/me/cv')
      uploads++;
  });
  await panel.getByRole('button', { name: 'Subir CV', exact: true }).dblclick();
  await expect(panel.getByText('CV guardado correctamente.', { exact: true })).toBeVisible();
  expect(uploads).toBe(1);
  await page.reload();
  await expect(panel.getByText('cv-inicial.pdf', { exact: true })).toBeVisible();

  const download = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Descargar CV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('cv.pdf');

  await panel.getByLabel('Seleccionar PDF').setInputFiles({
    name: 'cv-actualizado.pdf',
    mimeType: 'application/pdf',
    buffer: pdf('replacement'),
  });
  await panel.getByRole('button', { name: 'Sustituir CV', exact: true }).click();
  await expect(panel.getByText('CV sustituido correctamente.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(panel.getByText('cv-actualizado.pdf', { exact: true })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await panel.getByRole('button', { name: 'Eliminar CV', exact: true }).dblclick();
  await expect(panel.getByText('CV eliminado.', { exact: true })).toBeVisible();
  await expect(panel.getByText('Todavía no has guardado un CV.', { exact: true })).toBeVisible();
});
