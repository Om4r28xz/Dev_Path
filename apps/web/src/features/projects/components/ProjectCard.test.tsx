import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProjectCard } from './ProjectCard.js';

const project = {
  id: '00000000-0000-4000-8000-000000000001',
  title: '<Proyecto sintético>',
  description: 'Trabajo declarado por la persona.',
  url: 'https://example.org/project',
  skillIds: ['react'],
  createdAt: '2026-11-03T00:00:00.000Z',
  updatedAt: '2026-11-03T00:00:00.000Z',
};

describe('PRJ-02 project card', () => {
  it('marks self-declared data, escapes text and opens external links safely', () => {
    const html = renderToStaticMarkup(
      <ProjectCard
        project={project}
        skillNames={new Map([['react', 'React']])}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(html).toContain('Información autodeclarada');
    expect(html).toContain('&lt;Proyecto sintético&gt;');
    expect(html).not.toContain('<Proyecto sintético>');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain('abre en una pestaña nueva');
    expect(html).toContain('React');
  });

  it('does not invent a link or verified technology evidence', () => {
    const html = renderToStaticMarkup(
      <ProjectCard
        project={{ ...project, url: null, skillIds: [] }}
        skillNames={new Map()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(html).not.toContain('Visitar proyecto');
    expect(html).toContain('Sin tecnologías asociadas.');
  });
});
