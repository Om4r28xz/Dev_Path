/* global document */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:5173';
const analysisId = '00000000-0000-4000-8000-000000000001';
const user = {
  id: '53d84641-126d-46d6-98bd-daa00be18a78',
  name: 'Alex Demo',
  email: 'alex@example.test',
};
const result = {
  id: analysisId,
  source: { type: 'text', title: 'Frontend Junior' },
  candidateSkillsRevision: 1,
  requiredSkillIds: ['git', 'javascript', 'react'],
  matchedSkillIds: ['javascript', 'react'],
  missingSkillIds: ['git'],
  compatibilityPercentage: 67,
  versions: { catalog: '1.0.0', extractor: '1.0.0', scoring: '1.0.0' },
  warnings: [],
  skillsOutdated: false,
  createdAt: '2026-11-03T12:00:00Z',
  evidence: [
    { skillId: 'git', matches: [{ text: 'Git', start: 0, end: 3 }] },
    { skillId: 'javascript', matches: [{ text: 'JavaScript', start: 4, end: 14 }] },
    { skillId: 'react', matches: [{ text: 'React', start: 15, end: 20 }] },
  ],
};

async function ensureServer() {
  try {
    const response = await fetch(base);
    if (response.ok) return null;
  } catch {
    // Start a local preview below.
  }
  const child = spawn(
    'pnpm',
    ['--filter', '@devpath/web', 'preview', '--host', '127.0.0.1', '--port', '5173'],
    { shell: true, stdio: 'ignore' },
  );
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      const response = await fetch(base);
      if (response.ok) return child;
    } catch {
      // Continue waiting for preview.
    }
  }
  throw new Error('Could not start web preview server on 5173');
}

async function mockApi(page) {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let body;
    if (path.endsWith('/auth/refresh')) {
      body = { accessToken: 'synthetic-demo-token', tokenType: 'Bearer', expiresIn: 900, user };
    } else if (path === '/api/v1/skills') {
      body = {
        catalogVersion: '1.0.0',
        items: [
          { id: 'git', name: 'Git', category: 'tool' },
          { id: 'javascript', name: 'JavaScript', category: 'language' },
          { id: 'react', name: 'React', category: 'library' },
        ],
        nextCursor: null,
      };
    } else if (path === `/api/v1/analyses/${analysisId}`) {
      body = result;
    } else if (path === '/api/v1/analyses') {
      body = {
        items: [
          {
            id: result.id,
            source: result.source,
            compatibilityPercentage: result.compatibilityPercentage,
            skillsOutdated: false,
            createdAt: result.createdAt,
          },
          {
            id: '00000000-0000-4000-8000-000000000002',
            source: { type: 'text', title: 'Backend trainee' },
            compatibilityPercentage: 0,
            skillsOutdated: true,
            createdAt: '2026-11-02T12:00:00Z',
          },
          {
            id: '00000000-0000-4000-8000-000000000003',
            source: { type: 'text', title: null },
            compatibilityPercentage: null,
            skillsOutdated: false,
            createdAt: '2026-11-01T12:00:00Z',
          },
        ],
        nextCursor: null,
      };
    } else {
      body = {};
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function assertLayout(page, name) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (overflow) throw new Error(`${name}: horizontal overflow detected`);
  const smallTargets = await page
    .locator(
      '.layout-nav a, .layout-actions button, .analysis-primary-link, .analysis-secondary-link, button',
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => ({
          text: element.textContent?.trim(),
          height: element.getBoundingClientRect().height,
        }))
        .filter((target) => target.height < 44),
    );
  if (smallTargets.length)
    throw new Error(`${name}: targets below 44px: ${JSON.stringify(smallTargets)}`);
}

const server = await ensureServer();
const browser = await chromium.launch({
  channel: process.platform === 'win32' ? 'msedge' : undefined,
});
try {
  for (const [mode, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile', { width: 320, height: 720 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await mockApi(page);
    await page.goto(`${base}/analysis/new`);
    await page.getByRole('heading', { name: 'Analizar una vacante' }).waitFor();
    await assertLayout(page, `new-analysis-${mode}`);
    await page.screenshot({
      path: `docs/acceptance/evidence/vis-03-new-${mode}.png`,
      fullPage: true,
    });
    await page.close();
  }

  for (const [mode, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile', { width: 320, height: 720 }],
    ['reflow-640', { width: 640, height: 600 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await mockApi(page);
    await page.goto(`${base}/analyses/${analysisId}`);
    await page.getByRole('heading', { name: 'Resultado del análisis' }).waitFor();
    await page.getByText('67%', { exact: true }).waitFor();
    await page.getByText('no es una probabilidad de contratación', { exact: false }).waitFor();
    await page.getByRole('heading', { name: 'Evidencias del texto' }).waitFor();
    await assertLayout(page, `result-${mode}`);
    await page.screenshot({
      path: `docs/acceptance/evidence/vis-03-result-${mode}.png`,
      fullPage: true,
    });
    await page.close();
  }

  for (const [mode, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile', { width: 320, height: 720 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await mockApi(page);
    await page.goto(`${base}/analyses`);
    await page.getByRole('heading', { name: 'Historial de análisis' }).waitFor();
    await page.getByText('0%', { exact: true }).waitFor();
    await page.getByText('Sin porcentaje', { exact: true }).waitFor();
    await assertLayout(page, `history-${mode}`);
    await page.screenshot({
      path: `docs/acceptance/evidence/vis-03-history-${mode}.png`,
      fullPage: true,
    });

    if (mode === 'desktop') {
      const deleteButton = page.getByRole('button', { name: 'Eliminar análisis: Frontend Junior' });
      await deleteButton.click();
      await page.getByRole('dialog').waitFor();
      await page.screenshot({
        path: 'docs/acceptance/evidence/vis-03-delete-dialog.png',
        fullPage: true,
      });
      await page.keyboard.press('Escape');
      if (!(await deleteButton.evaluate((element) => element === document.activeElement))) {
        throw new Error('history-desktop: focus did not return to delete trigger');
      }
    }
    await page.close();
  }
  console.log('VIS-03 synthetic captures and layout assertions passed.');
} finally {
  await browser.close();
  if (server) server.kill();
}
