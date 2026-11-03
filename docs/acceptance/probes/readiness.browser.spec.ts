import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { test, expect } from '../../../tests/e2e/fixtures.js';

interface Finding {
  id: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  nodes: { target: string[]; failureSummary?: string }[];
}
interface Audit {
  testEngine: { version: string };
  violations: Finding[];
  incomplete: Finding[];
  passes: { id: string }[];
}

test('M1 readiness: automated accessibility, narrow reflow and evidence/error states', async ({
  page,
  app,
}) => {
  const path = process.env.QA_AXE_CORE_SOURCE;
  if (!path)
    throw Error(
      'Set QA_AXE_CORE_SOURCE to axe-core4.11.0 axe.min.js installed outside the repository.',
    );
  const source = await readFile(path, 'utf8');
  const results: {
    screen: string;
    axeVersion: string;
    violations: Finding[];
    incomplete: Finding[];
    passedRules: number;
    narrowViewport: { width: number; scrollWidth: number; clientWidth: number };
  }[] = [];
  const scan = async (screen: string) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addScriptTag({ content: source });
    const audit = await page.evaluate(async () => {
      const axe = (
        window as unknown as { axe: { run: (root: Document, options: unknown) => Promise<Audit> } }
      ).axe;
      return axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      });
    });
    // Never save DOM/HTML, input values, cookies or tokens from the scanner.
    const safe = (finding: Finding): Finding => ({
      id: finding.id,
      impact: finding.impact,
      help: finding.help,
      helpUrl: finding.helpUrl,
      nodes: finding.nodes.map((node) => ({
        target: node.target,
        ...(node.failureSummary ? { failureSummary: node.failureSummary } : {}),
      })),
    });
    await page.setViewportSize({ width: 320, height: 900 });
    const narrowViewport = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    results.push({
      screen,
      axeVersion: audit.testEngine.version,
      violations: audit.violations.map(safe),
      incomplete: audit.incomplete.map(safe),
      passedRules: audit.passes.length,
      narrowViewport,
    });
    await page.setViewportSize({ width: 1280, height: 900 });
  };
  try {
    await page.goto('/login');
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await scan('login');
    await page.goto('/register');
    await expect(page.getByLabel('Nombre completo')).toBeVisible();
    await scan('register');
    await app.register('Readiness Synthetic');
    await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible();
    await scan('profile');
    for (const skill of ['JavaScript', 'React'])
      await page.getByRole('checkbox', { name: skill, exact: true }).check();
    await page.getByRole('button', { name: 'Guardar habilidades', exact: true }).click();
    await expect(page.getByText('Habilidades guardadas.', { exact: true })).toBeVisible();
    await page.goto('/analysis/new');
    await expect(page.getByLabel('Texto de la vacante', { exact: true })).toBeVisible();
    await scan('analysis-form');
    await app.create('Readiness Evidence', 'JavaScript, React y Git.');
    await expect(page.getByText('67%', { exact: true })).toBeVisible();
    await scan('analysis-detail-evidence');
    await page.getByRole('link', { name: 'Volver al historial', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Readiness Evidence', exact: true })).toBeVisible();
    await scan('history');
    const remove = page.getByRole('button', {
      name: 'Eliminar análisis: Readiness Evidence',
      exact: true,
    });
    await remove.click();
    const dialog = page.getByRole('dialog', { name: '¿Eliminar este análisis?', exact: true });
    await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused();
    await scan('delete-dialog');
    await page.keyboard.press('Escape');
    await expect(remove).toBeFocused();
    const id = await app.create('Readiness Legacy', 'JavaScript');
    await app.pool.query('UPDATE app.analyses SET evidence=$1::jsonb WHERE id=$2', ['[]', id]);
    await page.reload();
    await expect(
      page.getByText('No hay fragmentos disponibles para este análisis.', { exact: true }),
    ).toBeVisible();
    await scan('legacy-evidence-absent');
    await page.goto(`/analyses/${randomUUID()}`);
    await expect(
      page.getByRole('heading', { name: 'Análisis no encontrado', exact: true }),
    ).toBeVisible();
    await scan('detail-404');
    await app.engine('stop');
    await page.goto('/analysis/new');
    await page.getByLabel('Texto de la vacante', { exact: true }).fill('JavaScript');
    await page.getByRole('button', { name: 'Analizar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Conservamos la vacante');
    await scan('engine-503');
  } finally {
    await app.engine('start');
    await mkdir('docs/acceptance/evidence', { recursive: true });
    await writeFile(
      'docs/acceptance/evidence/readiness-accessibility.json',
      JSON.stringify(
        {
          productCommit:
            process.env.QA_PRODUCT_COMMIT ?? '6d057b15d8a5fb886e66420d6dfd5910728bce9b',
          scope:
            'Automated axe checks and320CSS-px overflow measurement; not human acceptance, real browser200% zoom, or full WCAG certification',
          results,
        },
        null,
        2,
      ) + '\n',
    );
  }
  expect(results).toHaveLength(10);
  expect(
    results.flatMap((r) =>
      r.violations.map((v) => ({
        screen: r.screen,
        id: v.id,
        impact: v.impact,
        target: v.nodes.map((n) => n.target),
      })),
    ),
  ).toEqual([]);
  expect(
    results
      .filter((r) => r.narrowViewport.scrollWidth > r.narrowViewport.width + 1)
      .map((r) => ({ screen: r.screen, ...r.narrowViewport })),
  ).toEqual([]);
});
