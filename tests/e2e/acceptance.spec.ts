import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test, expect, logout } from './fixtures.js';

test('QA-02: two Chromium tabs recover sessions and propagate logout', async ({
  app,
  page,
  context,
}) => {
  const user = await app.register('Acceptance Tabs');
  const second = await context.newPage();
  try {
    await second.goto('/profile');
    await expect(second.getByLabel('Nombre', { exact: true })).toHaveValue('Acceptance Tabs');
    await Promise.all([page.reload(), second.reload()]);
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Acceptance Tabs');
    await expect(second.getByLabel('Nombre', { exact: true })).toHaveValue('Acceptance Tabs');
    expect(
      (
        await app.pool.query(
          'SELECT count(*) FROM auth.session_families WHERE user_id=$1 AND revoked_at IS NOT NULL',
          [user.id],
        )
      ).rows[0].count,
    ).toBe('0');
    for (const tab of [page, second]) {
      expect(
        await tab.evaluate(() =>
          [...Object.values(localStorage), ...Object.values(sessionStorage)].some((value) =>
            /eyJ[A-Za-z0-9_-]+\./.test(value),
          ),
        ),
      ).toBe(false);
    }
    await logout(page);
    await expect(second).toHaveURL(/\/login/);
    await second.reload();
    await expect(second).toHaveURL(/\/login/);
    expect(
      (
        await app.pool.query(
          'SELECT count(*) FROM auth.session_families WHERE user_id=$1 AND revoked_at IS NULL',
          [user.id],
        )
      ).rows[0].count,
    ).toBe('0');
  } finally {
    await second.close();
  }
});

test('QA-02: keyboard form order, labels, focus style and measured text contrast', async ({
  app,
  page,
}) => {
  await app.register('Acceptance Keyboard');
  await logout(page);
  const email = page.getByLabel('Correo electrónico');
  const password = page.getByLabel(/^Contraseña/);
  await email.focus();
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeFocused();
  const outline = await page
    .getByRole('button', { name: 'Entrar', exact: true })
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
  expect(outline.style).not.toBe('none');
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Shift+Tab');
  await expect(password).toBeFocused();
  const measurements = [];
  for (const path of ['/login', '/register']) {
    await page.goto(path);
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    const entries = await page
      .locator('main label, main h1, main p, main a, button:not(:disabled), nav a')
      .evaluateAll((elements) => {
        const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
        const blend = (front: number[], back: number[]) =>
          front.slice(0, 3).map((v, i) => v * (front[3] ?? 1) + back[i]! * (1 - (front[3] ?? 1)));
        const luminance = (color: number[]) =>
          color
            .map((v) => {
              const s = v / 255;
              return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            })
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0);
        return elements
          .filter((e) => e.getBoundingClientRect().height > 0 && e.textContent?.trim())
          .map((e) => {
            const chain: Element[] = [];
            for (let p: Element | null = e; p; p = p.parentElement) chain.unshift(p);
            let bg = [255, 255, 255];
            for (const ancestor of chain)
              bg = blend(rgb(getComputedStyle(ancestor).backgroundColor), bg);
            const style = getComputedStyle(e),
              fg = blend(rgb(style.color), bg);
            const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
            const ratio = (a! + 0.05) / (b! + 0.05);
            const large =
              parseFloat(style.fontSize) >= 24 ||
              (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
            return {
              tag: e.tagName,
              text: e.textContent!.trim().slice(0, 70),
              foreground: style.color,
              background: bg,
              ratio,
              required: large ? 3 : 4.5,
            };
          });
      });
    expect(entries.length).toBeGreaterThanOrEqual(4);
    measurements.push({ path, entries });
  }
  await mkdir('docs/acceptance/evidence', { recursive: true });
  await writeFile(
    'docs/acceptance/evidence/ui-metrics.json',
    JSON.stringify(
      {
        sourceCommit: 'b84255efc996f67af26d6478528eba42afe6bce6',
        scope: 'Computed default text styles on login/register; not full WCAG or human acceptance',
        outline,
        measurements,
      },
      null,
      2,
    ) + '\n',
  );
  expect(measurements.flatMap((m) => m.entries).filter((m) => m.ratio < m.required)).toEqual([]);
});

test('QA-02: exact 50% acceptance example and canonical corpus through real API/engine', async ({
  app,
  page,
}) => {
  const user = await app.register('Acceptance Corpus');
  expect(
    (
      await app.call(user, '/me/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillIds: ['java'] }),
      })
    ).status,
  ).toBe(200);
  const id = await app.create('Acceptance 50', 'Java y SQL');
  await expect(page.getByText('50%', { exact: true })).toBeVisible();
  const dto = await (await app.call(user, `/analyses/${id}`)).json();
  expect(dto.requiredSkillIds).toEqual(['java', 'sql']);
  expect(dto.matchedSkillIds).toEqual(['java']);
  expect(dto.missingSkillIds).toEqual(['sql']);
  const corpus = JSON.parse(
    await readFile('packages/catalog/fixtures/extraction-corpus.json', 'utf8'),
  ) as { cases: { id: string; jobText: string; requiredSkillIds: string[] }[] };
  for (const item of corpus.cases) {
    const response = await app.call(user, '/analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() },
      body: JSON.stringify({ source: { type: 'text', title: item.id, text: item.jobText } }),
    });
    if (!item.jobText.trim()) {
      expect(response.status, item.id).toBe(400);
      continue;
    }
    expect(response.status, item.id).toBe(201);
    expect((await response.json()).requiredSkillIds, item.id).toEqual(item.requiredSkillIds);
  }
});
