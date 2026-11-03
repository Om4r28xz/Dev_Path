import { expect } from '@playwright/test';

// The catalog may render before the independent saved-skills request completes.
// Assert the restored state, rather than taking an immediate loading-state snapshot.
export async function expectRestoredProfile(page, name) {
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(name, { timeout: 20000 });
  for (const skill of ['JavaScript', 'React']) {
    await expect(page.getByRole('checkbox', { name: skill, exact: true })).toBeChecked({
      timeout: 20000,
    });
  }
}
