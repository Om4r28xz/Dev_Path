/* global document */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:5173';
const user = {
  id: '53d84641-126d-46d6-98bd-daa00be18a78',
  name: 'Alex Demo',
  email: 'alex@example.test',
};

// Check if dev server is already running, otherwise spawn it
async function ensureServer() {
  try {
    const res = await fetch(base);
    if (res.ok) return null;
  } catch {
    // Not running, need to spawn
  }

  const child = spawn(
    'pnpm',
    ['--filter', '@devpath/web', 'preview', '--host', '127.0.0.1', '--port', '5173'],
    {
      shell: true,
      stdio: 'ignore',
    },
  );

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const res = await fetch(base);
      if (res.ok) return child;
    } catch {
      // Wait
    }
  }
  throw new Error('Could not start web preview server on 5173');
}

const serverProcess = await ensureServer();
const browser = await chromium.launch({
  channel: process.platform === 'win32' ? 'msedge' : undefined,
});

try {
  // Setup API route mocking for synthetic UI testing
  async function setupApiMocks(page, { authenticated = true } = {}) {
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/auth/refresh')) {
        if (!authenticated) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              error: { code: 'UNAUTHORIZED', message: 'No hay sesión activa.' },
            }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'synthetic-demo-token',
            tokenType: 'Bearer',
            expiresIn: 900,
            user,
          }),
        });
        return;
      }

      const body =
        path.endsWith('/auth/login') || path.endsWith('/auth/register')
          ? { accessToken: 'synthetic-demo-token', tokenType: 'Bearer', expiresIn: 900, user }
          : path.endsWith('/me/skills')
            ? { skillIds: ['javascript'], revision: 1 }
            : path.endsWith('/me')
              ? {
                  ...user,
                  headline: 'Desarrollador Frontend Junior',
                  location: 'Remoto',
                  skillsRevision: 1,
                  createdAt: '2026-11-03T00:00:00Z',
                  updatedAt: '2026-11-03T00:00:00Z',
                }
              : {
                  catalogVersion: '1.0.0',
                  items: [
                    { id: 'javascript', name: 'JavaScript', category: 'language' },
                    { id: 'react', name: 'React', category: 'library' },
                    { id: 'typescript', name: 'TypeScript', category: 'language' },
                    { id: 'node', name: 'Node.js', category: 'runtime' },
                    { id: 'git', name: 'Git', category: 'tool' },
                    { id: 'sql', name: 'SQL', category: 'language' },
                  ],
                  nextCursor: null,
                };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });
  }

  // 1. Validate and capture Auth: Login
  for (const [mode, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile', { width: 320, height: 720 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await setupApiMocks(page, { authenticated: false });
    await page.goto(base + '/login');
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) throw Error(`login-${mode}: horizontal overflow detected`);

    const buttonHeight = await page
      .getByRole('button', { name: 'Entrar' })
      .evaluate((el) => el.getBoundingClientRect().height);
    if (buttonHeight < 44) throw Error(`login-${mode}: Entrar button below 44px`);

    await page.screenshot({
      path: `docs/acceptance/evidence/vis-02-login-${mode}.png`,
      fullPage: true,
    });
    console.log(`login-${mode}: targets >=44px, no overflow, captured OK`);
    await page.close();
  }

  // 2. Validate and capture Auth: Register
  for (const [mode, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile', { width: 320, height: 720 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await setupApiMocks(page, { authenticated: false });
    await page.goto(base + '/register');
    await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) throw Error(`register-${mode}: horizontal overflow detected`);

    const buttonHeight = await page
      .getByRole('button', { name: 'Registrarse' })
      .evaluate((el) => el.getBoundingClientRect().height);
    if (buttonHeight < 44) throw Error(`register-${mode}: Registrarse button below 44px`);

    await page.screenshot({
      path: `docs/acceptance/evidence/vis-02-register-${mode}.png`,
      fullPage: true,
    });
    console.log(`register-${mode}: targets >=44px, no overflow, captured OK`);
    await page.close();
  }

  // 3. Validate and capture Profile & Skills
  for (const [mode, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile', { width: 320, height: 720 }],
    ['reflow-640', { width: 640, height: 500 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await setupApiMocks(page, { authenticated: true });
    await page.goto(base + '/profile');
    await page.getByRole('heading', { name: 'Mi perfil' }).waitFor();
    await page.getByRole('checkbox', { name: 'JavaScript' }).waitFor();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) throw Error(`profile-${mode}: horizontal overflow detected`);

    // Target sizes check
    for (const selector of [
      '.layout-nav a',
      '.layout-actions .btn',
      '.profile-form .btn',
      '.skills-save-bar .btn',
    ]) {
      const heights = await page
        .locator(selector)
        .evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().height));
      if (heights.some((h) => h < 44))
        throw Error(`profile-${mode}: target ${selector} below 44px`);
    }

    // Checkboxes check
    const checkboxSizes = await page
      .locator('.profile-skill-option__checkbox')
      .evaluateAll((elements) =>
        elements.map((el) => ({
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        })),
      );
    if (checkboxSizes.some((s) => s.width < 24 || s.height < 24)) {
      throw Error(`profile-${mode}: checkbox below 24px`);
    }

    // Verify next step banner exists
    const nextStep = page.locator('.profile-next-step');
    if ((await nextStep.count()) === 0) throw Error(`profile-${mode}: next step banner missing`);

    // Verify account info exists
    const accountInfo = page.locator('.profile-account-info');
    if ((await accountInfo.count()) === 0) throw Error(`profile-${mode}: account info missing`);

    await page.screenshot({
      path: `docs/acceptance/evidence/vis-02-profile-${mode}.png`,
      fullPage: true,
    });
    console.log(`profile-${mode}: targets >=44px, checkboxes >=24px, next-step and overflow OK`);
    await page.close();
  }

  console.log('All VIS-02 captures and assertions succeeded!');
} finally {
  await browser.close();
  if (serverProcess) {
    serverProcess.kill();
  }
}
