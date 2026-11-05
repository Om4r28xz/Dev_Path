import { test, expect } from './fixtures.js';

test('JSR-04 / QA-04: search by submit, fixture provenance, detail, analysis via Skill Engine, history persistence and manual fallback', async ({
  page,
  app,
}) => {
  const user = await app.register('Jobs Synthetic Candidate');

  // Set candidate skills: JavaScript and React (missing Git -> 67% against synthetic-job-001)
  await page.getByRole('checkbox', { name: 'JavaScript', exact: true }).check();
  await page.getByRole('checkbox', { name: 'React', exact: true }).check();
  const savedSkills = page.waitForResponse(
    (r) => r.url().endsWith('/me/skills') && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
  expect((await savedSkills).status()).toBe(200);

  // Navigate to /jobs
  await page.getByRole('link', { name: 'Vacantes', exact: true }).click();
  await page.waitForURL('**/jobs');
  await expect(
    page.getByRole('heading', { name: 'Buscar vacantes y comparar habilidades', exact: true }),
  ).toBeVisible();

  // Verify fixture provenance badge and banner do not pass synthetic data as live offers
  await expect(page.getByText('Modo demostración (fixtures sintéticos)')).toBeVisible();
  await expect(page.getByText(/Datos sintéticos de demostración:/i)).toBeVisible();

  // Verify typing does not trigger GET /api/v1/jobs until submit
  let searchRequests = 0;
  page.on('request', (req) => {
    if (req.method() === 'GET' && new URL(req.url()).pathname === '/api/v1/jobs') {
      searchRequests++;
    }
  });

  const queryInput = page.getByLabel('Puesto o tecnología', { exact: true });
  await queryInput.fill('React');
  expect(searchRequests).toBe(0);

  await page.getByRole('button', { name: 'Buscar vacantes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultados (2)', exact: true })).toBeVisible();
  expect(searchRequests).toBe(1);

  // Verify detail card, attribution and safe external link
  await expect(
    page.getByRole('heading', { name: 'Frontend junior (sintético)', level: 3 }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Fuente: Fixture sintético DevPath (estructura JSearch)'),
  ).toBeVisible();
  const externalLink = page.getByRole('link', { name: 'Abrir enlace externo de la oferta' });
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');

  // Trigger provider analysis (POST /api/v1/analyses with source.type="jsearch") with double-click protection
  let analyzeRequests = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/v1/analyses') {
      analyzeRequests++;
    }
  });
  const createdAnalysisPromise = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/api/v1/analyses' && r.request().method() === 'POST',
  );

  await page
    .getByRole('button', { name: 'Analizar compatibilidad con mi perfil', exact: true })
    .dblclick();
  const createdAnalysisResponse = await createdAnalysisPromise;
  expect(createdAnalysisResponse.status()).toBe(201);
  const createdAnalysisDto = await createdAnalysisResponse.json();
  expect(createdAnalysisDto.source).toEqual({
    type: 'jsearch',
    title: 'Frontend junior (sintético)',
    providerId: 'synthetic-job-001',
  });

  const resultRegion = page.getByRole('region', { name: 'Resultado del análisis', exact: true });
  await expect(resultRegion).toBeVisible();
  await expect(resultRegion.getByText('67%', { exact: true })).toBeVisible();
  expect(analyzeRequests).toBe(1);

  // Verify navigation to saved analysis in history
  const historyLink = page.getByRole('link', {
    name: 'Ver análisis guardado en el historial',
    exact: true,
  });
  await expect(historyLink).toBeVisible();
  await historyLink.click();
  await expect(page).toHaveURL(/\/analyses\/[0-9a-f-]+$/);
  await expect(page.getByText('67%', { exact: true })).toBeVisible();

  const listResponse = await (await app.call(user, '/analyses')).json();
  expect(listResponse.items).toHaveLength(1);
  expect(listResponse.items[0].source.title).toBe('Frontend junior (sintético)');

  // Verify 320px responsive layout on /jobs
  await page.goto('/jobs');
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  // Verify manual analysis flow remains operational even if user switches from /jobs to /analysis/new
  await page
    .getByRole('link', { name: '¿Prefieres pegar una vacante manualmente?', exact: true })
    .click();
  await expect(page).toHaveURL(/\/analysis\/new$/);
  const manualId = await app.create('Manual after JSearch', 'Vacante con JavaScript y React.');
  await expect(page).toHaveURL(new RegExp(`/analyses/${manualId}$`));
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
});
