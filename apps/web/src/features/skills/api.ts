import { apiRequest } from '../../lib/http/client.js';
export interface Skill {
  id: string;
  name: string;
  category: string;
}
export interface SkillPage {
  catalogVersion: string;
  items: Skill[];
  nextCursor: string | null;
}
export interface UserSkills {
  skillIds: string[];
  revision: number;
}
export function searchSkills(search: string, cursor: string | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: '20' });
  if (search.trim()) query.set('q', search.trim());
  if (cursor) query.set('cursor', cursor);
  return apiRequest<SkillPage>('/api/v1/skills?' + query.toString(), signal ? { signal } : {});
}
export function loadSkills(signal?: AbortSignal) {
  return apiRequest<UserSkills>('/api/v1/me/skills', signal ? { signal } : {});
}
export function saveSkills(skillIds: readonly string[]) {
  return apiRequest<UserSkills>('/api/v1/me/skills', {
    method: 'PUT',
    body: JSON.stringify({ skillIds: [...new Set(skillIds)].sort() }),
  });
}
export function toggleSkill(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id].sort();
}
