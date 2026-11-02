import type { Analysis } from './types.js';
// Synthetic snapshot shared by transport/validation tests; no real user data.
export const sampleAnalysis: Analysis = {
  id: '00000000-0000-4000-8000-000000000001',
  source: { type: 'text', title: 'Frontend junior' },
  candidateSkillsRevision: 1,
  requiredSkillIds: ['git', 'javascript', 'react'],
  matchedSkillIds: ['javascript', 'react'],
  missingSkillIds: ['git'],
  compatibilityPercentage: 67,
  versions: { catalog: '1.0.0', extractor: '1.1.0', scoring: '1.0.0' },
  warnings: [],
  skillsOutdated: false,
  createdAt: '2026-11-01T00:00:00Z',
};
export const sampleWithEvidence: Analysis = {
  ...sampleAnalysis,
  evidence: [
    { skillId: 'git', matches: [{ text: 'Git', start: 0, end: 3 }] },
    { skillId: 'javascript', matches: [{ text: 'JavaScript', start: 4, end: 14 }] },
    { skillId: 'react', matches: [{ text: 'React', start: 15, end: 20 }] },
  ],
};
