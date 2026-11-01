import { apiRequest } from '../../lib/http/client.js';

export interface Profile {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  location: string | null;
  skillsRevision: number;
  createdAt: string;
  updatedAt: string;
}
export interface ProfileDraft {
  name: string;
  headline: string;
  location: string;
}
export const profileDraft = (profile: Profile): ProfileDraft => ({
  name: profile.name,
  headline: profile.headline ?? '',
  location: profile.location ?? '',
});
export function profileCommand(draft: ProfileDraft) {
  return {
    name: draft.name.trim(),
    headline: draft.headline.trim() || null,
    location: draft.location.trim() || null,
  };
}
export function loadProfile(signal?: AbortSignal) {
  return apiRequest<Profile>('/api/v1/me', signal ? { signal } : {});
}
export function saveProfile(draft: ProfileDraft) {
  return apiRequest<Profile>('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify(profileCommand(draft)),
  });
}
