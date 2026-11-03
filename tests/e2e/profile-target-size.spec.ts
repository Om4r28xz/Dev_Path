import { test, expect } from './fixtures.js';

test('profile skill checkboxes have usable targets and retain keyboard/save behavior', async ({
  page,
  app,
}) => {
  const user = await app.register('Synthetic Target Size');
  const boxes = page
    .getByRole('list', { name: 'Tecnologías del catálogo', exact: true })
    .getByRole('checkbox');
  await expect(boxes.first()).toBeVisible();
  const sizes = await boxes.evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    }),
  );
  expect(sizes.length).toBeGreaterThan(0);
  expect(sizes.every((size) => size.width >= 24 && size.height >= 24)).toBe(true);
  const javascript = page.getByRole('checkbox', { name: 'JavaScript', exact: true });
  await javascript.focus();
  await page.keyboard.press('Space');
  await expect(javascript).toBeChecked();
  await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
  await expect(page.getByText('Habilidades guardadas.', { exact: true })).toBeVisible();
  expect((await (await app.call(user, '/me/skills')).json()).skillIds).toContain('javascript');
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'JavaScript', exact: true })).toBeChecked();
});
