import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../lib/http/client.js';
import { createProject, deleteProject, loadProjects, updateProject } from './api.js';
import { emptyProjectDraft, projectCommand, validateProjectDraft } from './types.js';

vi.mock('../../lib/http/client.js', () => ({ apiRequest: vi.fn() }));

describe('PRJ-02 project API and form rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({});
  });

  it('lists pages with an opaque cursor and cancellation signal', async () => {
    const signal = new AbortController().signal;
    await loadProjects('opaque-cursor', signal);
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/projects?limit=20&cursor=opaque-cursor', {
      signal,
    });
  });

  it('trims a project command and sends create/update to owned routes', async () => {
    const draft = {
      title: ' Portfolio ',
      description: ' Trabajo personal ',
      url: ' https://example.org/project ',
      skillIds: ['react'],
    };
    expect(projectCommand(draft)).toEqual({
      title: 'Portfolio',
      description: 'Trabajo personal',
      url: 'https://example.org/project',
      skillIds: ['react'],
    });
    await createProject(draft);
    expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(projectCommand(draft)),
    });
    await updateProject('../other', draft);
    expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/projects/..%2Fother', {
      method: 'PATCH',
      body: JSON.stringify(projectCommand(draft)),
    });
  });

  it('uses DELETE without putting owner identity in the path or body', async () => {
    await deleteProject('../other');
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/projects/..%2Fother', { method: 'DELETE' });
  });

  it('preserves form values while reporting required and unsafe URL errors', () => {
    const draft = { ...emptyProjectDraft(), url: 'https://example.org/line\nbreak' };
    expect(validateProjectDraft(draft)).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      url: expect.any(String),
    });
    expect(draft.url).toContain('line');
    expect(
      validateProjectDraft({
        title: 'Project',
        description: 'Description',
        url: 'javascript:alert(1)',
        skillIds: [],
      }),
    ).toHaveProperty('url');
  });
});
