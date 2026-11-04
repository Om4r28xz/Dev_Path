import { readFile, writeFile } from 'node:fs/promises';
import { test, expect } from '../../../tests/e2e/fixtures.js';

interface ContrastMeasurement {
  state: string;
  foreground: string;
  background: string;
  backgroundImage: string;
  opacity: string;
  ancestors: { opacity: string; filter: string }[];
  ratio: number;
  opaqueColors: boolean;
  placeholderPresent: boolean;
  fontSize: string;
  coverage: { topTag: string | undefined; targetOnTop: boolean }[];
  geometry: { top: number; bottom: number; height: number; viewport: number };
  axe: { violations: string[]; incomplete: string[]; passes: string[] };
}

test('rechecks textarea contrast in normal and503 states with visible geometry and computed colors', async ({
  page,
  app,
}) => {
  const path = process.env.QA_AXE_CORE_SOURCE;
  if (!path) throw Error('Set QA_AXE_CORE_SOURCE to axe-core4.11.0.');
  const source = await readFile(path, 'utf8');
  const measurements: ContrastMeasurement[] = [];
  await app.register('Contrast Synthetic');
  await page.goto('/analysis/new');
  const textarea = page.getByLabel('Texto de la vacante', { exact: true });
  const measure = async (state: string) => {
    await textarea.scrollIntoViewIfNeeded();
    await textarea.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await page.addScriptTag({ content: source });
    const result = await textarea.evaluate(async (element) => {
      const style = getComputedStyle(element),
        box = element.getBoundingClientRect();
      const parse = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number);
      const fg = parse(style.color),
        bg = parse(style.backgroundColor);
      const luminance = (rgb: number[]) =>
        rgb
          .slice(0, 3)
          .map((n) => {
            const v = n / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          })
          .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i]!, 0);
      const [high, low] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
      const ancestors = [];
      for (let p: Element | null = element; p; p = p.parentElement)
        ancestors.push({
          opacity: getComputedStyle(p).opacity,
          filter: getComputedStyle(p).filter,
        });
      const points = [
        [box.x + box.width / 2, box.y + box.height / 2],
        [box.x + 10, box.y + 10],
        [box.right - 10, box.bottom - 10],
      ];
      const coverage = points.map(([x, y]) => ({
        topTag: document.elementFromPoint(x!, y!)?.tagName,
        targetOnTop: document.elementFromPoint(x!, y!) === element,
      }));
      const axe = (
        window as unknown as {
          axe: {
            run: (
              context: unknown,
              options: unknown,
            ) => Promise<{
              violations: { id: string }[];
              incomplete: { id: string }[];
              passes: { id: string }[];
            }>;
          };
        }
      ).axe;
      const audit = await axe.run(
        { include: [['#analysis-text']] },
        { runOnly: { type: 'rule', values: ['color-contrast'] } },
      );
      return {
        foreground: style.color,
        background: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        opacity: style.opacity,
        ancestors,
        ratio: (high! + 0.05) / (low! + 0.05),
        opaqueColors: (fg[3] ?? 1) === 1 && (bg[3] ?? 1) === 1,
        placeholderPresent: element.hasAttribute('placeholder'),
        fontSize: style.fontSize,
        coverage,
        geometry: { top: box.top, bottom: box.bottom, height: box.height, viewport: innerHeight },
        axe: {
          violations: audit.violations.map((r) => r.id),
          incomplete: audit.incomplete.map((r) => r.id),
          passes: audit.passes.map((r) => r.id),
        },
      };
    });
    measurements.push({ state, ...result });
  };
  try {
    await expect(textarea).toBeVisible();
    await measure('normal');
    await textarea.fill('JavaScript');
    await app.engine('stop');
    await page.getByRole('button', { name: 'Analizar tecnologías', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Conservamos la vacante');
    await measure('engine503');
  } finally {
    await app.engine('start');
    await writeFile(
      'docs/acceptance/evidence/contrast-recheck.json',
      JSON.stringify(
        {
          productCommit: process.env.QA_PRODUCT_COMMIT,
          method:
            'Scroll target into viewport, axe color-contrast only, and sRGB contrast on verified opaque computed colors; no human approval',
          measurements,
        },
        null,
        2,
      ) + '\n',
    );
  }
  expect(measurements).toHaveLength(2);
  for (const result of measurements) {
    expect(result.opaqueColors).toBe(true);
    expect(result.backgroundImage).toBe('none');
    expect(
      result.ancestors.every((ancestor) => ancestor.opacity === '1' && ancestor.filter === 'none'),
    ).toBe(true);
    expect(result.coverage.every((point) => point.targetOnTop)).toBe(true);
    expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    expect(result.axe.violations).toEqual([]);
  }
});
