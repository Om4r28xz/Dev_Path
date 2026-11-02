import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import { AnalysisHistoryList } from './components/AnalysisHistoryList.js';
import { DeleteAnalysisDialog } from './components/DeleteAnalysisDialog.js';
const item = {
  id: '00000000-0000-4000-8000-000000000001',
  source: { type: 'text' as const, title: '<img src=x onerror=alert(1)>' },
  compatibilityPercentage: 0,
  skillsOutdated: true,
  createdAt: '2026-11-02T12:00:00Z',
};
describe('ANL-04 list and confirmation presentation', () => {
  it('links to persisted detail, escapes titles, preserves real0% and explains outdated skills', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(AnalysisHistoryList, { items: [item], onDelete: () => undefined }),
      ),
    );
    expect(html).toContain('/analyses/' + item.id);
    expect(html).toContain('0% de compatibilidad');
    expect(html).toContain('conserva la comparación original');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
    expect(html).toContain('Ver tecnologías y evidencias');
  });
  it('keeps null explanatory and uses a useful missing-title fallback', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(AnalysisHistoryList, {
          items: [
            { ...item, source: { type: 'text', title: null }, compatibilityPercentage: null },
          ],
          onDelete: () => undefined,
        }),
      ),
    );
    expect(html).toContain('Vacante sin título');
    expect(html).toContain('no se calcula un porcentaje');
    expect(html).not.toContain('0%');
  });
  it('requires explicit confirmation and offers cancellation before a destructive action', () => {
    const html = renderToStaticMarkup(
      createElement(DeleteAnalysisDialog, {
        item,
        pending: false,
        error: '',
        onCancel: () => undefined,
        onConfirm: () => undefined,
      }),
    );
    expect(html).toContain('<dialog');
    expect(html).toContain('Cancelar');
    expect(html).toContain('Confirmar eliminación');
    expect(html).toContain('no se puede deshacer');
    expect(html).not.toContain('<img');
  });
});
