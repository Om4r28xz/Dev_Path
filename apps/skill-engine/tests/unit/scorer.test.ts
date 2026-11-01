import { describe, expect, it } from 'vitest';

import { scoreAnalysis } from '../../src/modules/analysis/scorer.js';

describe('scoreAnalysis', () => {
  it('partitions required skills and rounds 2 of 3 to 67', () => {
    expect(scoreAnalysis(['javascript', 'react', 'git'], ['react', 'javascript'])).toEqual({
      matchedSkillIds: ['javascript', 'react'],
      missingSkillIds: ['git'],
      matchPercentage: 67,
    });
  });

  it('distinguishes no requirements from no candidate skills', () => {
    expect(scoreAnalysis([], [])).toEqual({
      matchedSkillIds: [],
      missingSkillIds: [],
      matchPercentage: null,
    });
    expect(scoreAnalysis(['git'], [])).toEqual({
      matchedSkillIds: [],
      missingSkillIds: ['git'],
      matchPercentage: 0,
    });
  });

  it('deduplicates inputs and preserves required order', () => {
    expect(scoreAnalysis(['git', 'git', 'docker'], ['git', 'git'])).toEqual({
      matchedSkillIds: ['git'],
      missingSkillIds: ['docker'],
      matchPercentage: 50,
    });
  });
});
