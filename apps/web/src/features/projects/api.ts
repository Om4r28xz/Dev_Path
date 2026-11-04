import { apiRequest } from '../../lib/http/client.js';
import { projectCommand, type Project, type ProjectDraft, type ProjectPage } from './types.js';

export function loadProjects(cursor: string | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: '20' });
  if (cursor) query.set('cursor', cursor);
  return apiRequest<ProjectPage>('/api/v1/projects?' + query.toString(), signal ? { signal } : {});
}

export function createProject(draft: ProjectDraft) {
  return apiRequest<Project>('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify(projectCommand(draft)),
  });
}

export function updateProject(id: string, draft: ProjectDraft) {
  return apiRequest<Project>('/api/v1/projects/' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(projectCommand(draft)),
  });
}

export function deleteProject(id: string) {
  return apiRequest<void>('/api/v1/projects/' + encodeURIComponent(id), { method: 'DELETE' });
}
