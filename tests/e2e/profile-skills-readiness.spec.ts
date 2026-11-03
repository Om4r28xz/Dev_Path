import { test, expect, logout } from './fixtures.js';
import { expectRestoredProfile } from './support/profile-readiness.mjs';

test('saved skills remain in PostgreSQL while a fresh login waits for their real API response', async ({
  app,
  page,
}) => {
  const user = await app.register('Skills Readiness Synthetic');
  const saved = await app.call(user, '/me/skills', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skillIds: ['javascript', 'react'] }),
  });
  expect(saved.status).toBe(200);
  const persisted = async () =>
    (
      await app.pool.query<{ skill_id: string }>(
        'SELECT skill_id FROM app.user_skills WHERE user_id=$1 ORDER BY skill_id',
        [user.id],
      )
    ).rows.map((row) => row.skill_id);
  expect(await persisted()).toEqual(['javascript', 'react']);
  await logout(page);

  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  let responseRead!: () => void;
  const fetched = new Promise<void>((resolve) => (responseRead = resolve));
  let realStatus: number | undefined;
  let realSkillIds: string[] | undefined;
  await page.route('**/api/v1/me/skills', async (route) => {
    // Forward to the real Express/PostgreSQL service; preserve its actual payload.
    // Only delivery is gated, without sleeps, fabricated bodies or status codes.
    const upstream = await route.fetch();
    realStatus = upstream.status();
    realSkillIds = (await upstream.json()).skillIds;
    responseRead();
    await held;
    await route.fulfill({ response: upstream });
  });
  try {
    await app.login(user);
    await fetched;
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(
      'Skills Readiness Synthetic',
    );
    const javascript = page.getByRole('checkbox', { name: 'JavaScript', exact: true });
    await expect(javascript).toBeVisible();
    await expect(page.getByText('Cargando habilidades…', { exact: true })).toBeVisible();
    expect(realStatus).toBe(200);
    expect(realSkillIds).toEqual(['javascript', 'react']);
    expect(await persisted()).toEqual(['javascript', 'react']);
    // This reproduces the old probe's false result despite persisted, valid API data.
    expect(await javascript.isChecked()).toBe(false);
    await expect(javascript).toBeDisabled();
    const restored = expectRestoredProfile(page, 'Skills Readiness Synthetic');
    release();
    await restored;
    await expect(javascript).toBeEnabled();
    expect(await persisted()).toEqual(['javascript', 'react']);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
