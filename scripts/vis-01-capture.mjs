/* global document, getComputedStyle */
import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:5173';
const user = {
  id: '53d84641-126d-46d6-98bd-daa00be18a78',
  name: 'Alex Demo',
  email: 'alex@example.test',
};
const browser = await chromium.launch({
  channel: process.platform === 'win32' ? 'msedge' : undefined,
});
try {
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile', { width: 320, height: 720 }],
  ]) {
    const page = await browser.newPage({ viewport });
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const body = path.endsWith('/auth/refresh')
        ? { accessToken: 'synthetic-demo-token', tokenType: 'Bearer', expiresIn: 900, user }
        : path.endsWith('/me/skills')
          ? { skillIds: [], revision: 0 }
          : path.endsWith('/me')
            ? {
                ...user,
                headline: null,
                location: null,
                skillsRevision: 0,
                createdAt: '2026-11-03T00:00:00Z',
                updatedAt: '2026-11-03T00:00:00Z',
              }
            : {
                catalogVersion: '1.0.0',
                items: [
                  { id: 'javascript', name: 'JavaScript', category: 'language' },
                  { id: 'react', name: 'React', category: 'library' },
                ],
                nextCursor: null,
              };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });
    await page.goto(base + '/profile');
    await page.getByRole('heading', { name: 'Mi perfil' }).waitFor();
    await page.getByRole('checkbox', { name: 'JavaScript' }).waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) throw Error(name + ': horizontal overflow');
    for (const selector of ['.layout-nav a', '.layout-actions .btn']) {
      const heights = await page
        .locator(selector)
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().height),
        );
      if (heights.some((height) => height < 44)) throw Error(name + ': target below 44px');
    }
    const checkboxSizes = await page
      .locator('.profile-skill-option__checkbox')
      .evaluateAll((elements) =>
        elements.map((element) => ({
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
        })),
      );
    if (checkboxSizes.some((size) => size.width < 24 || size.height < 24))
      throw Error(name + ': checkbox below 24px');
    await page.screenshot({
      path: 'docs/acceptance/evidence/vis-01-shell-' + name + '.png',
      fullPage: true,
    });
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await skip.focus();
    const outline = await skip.evaluate((element) => getComputedStyle(element).outlineStyle);
    if (outline === 'none') throw Error(name + ': skip link has no visible focus');
    await skip.press('Enter');
    const target = await page.evaluate(() => document.activeElement?.id);
    if (target !== 'main-content') throw Error(name + ': skip link did not focus main');
    console.log(
      name + ': shell visible, targets >=44px, checkbox >=24px, skip link and overflow OK',
    );
    await page.close();
  }
} finally {
  await browser.close();
}
