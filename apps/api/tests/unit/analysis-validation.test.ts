import { describe, expect, it } from 'vitest';
import {
  CATALOG_VERSION,
  engineResultSchema,
  validInvariants,
  type EngineResult,
} from '../../src/modules/analyses/schemas.js';
const input = {
  catalogVersion: CATALOG_VERSION,
  jobText: 'JavaScript React Git',
  candidateSkillIds: ['javascript', 'react'],
};
const known = new Set(['javascript', 'react', 'git']);
const valid: EngineResult = {
  requiredSkillIds: ['git', 'javascript', 'react'],
  matchedSkillIds: ['javascript', 'react'],
  missingSkillIds: ['git'],
  matchPercentage: 67,
  versions: { catalog: '1.0.0', extractor: '1.0.0', scoring: '1.0.0' },
  evidence: [
    { skillId: 'javascript', matches: [{ text: 'JavaScript', start: 0, end: 10 }] },
    { skillId: 'react', matches: [{ text: 'React', start: 11, end: 16 }] },
    { skillId: 'git', matches: [{ text: 'Git', start: 17, end: 20 }] },
  ],
};
describe('ANL-01 engine trust boundary', () => {
  it('accepts a partition, exact score and evidence from the input text', () =>
    expect(validInvariants(engineResultSchema.parse(valid), input, known)).toBe(true));
  it.each([
    { ...valid, matchPercentage: 66 },
    { ...valid, matchedSkillIds: ['git', 'javascript'], missingSkillIds: ['react'] },
    { ...valid, missingSkillIds: [] },
    { ...valid, versions: { ...valid.versions, catalog: '2.0.0' } },
    { ...valid, evidence: [...valid.evidence.slice(0, 2)] },
    { ...valid, evidence: [valid.evidence[0]!, valid.evidence[0]!, valid.evidence[2]!] },
    {
      ...valid,
      evidence: [
        { skillId: 'javascript', matches: [{ text: 'bogus', start: 0, end: 10 }] },
        ...valid.evidence.slice(1),
      ],
    },
  ])('rejects a syntactically valid response that violates invariants', (result) =>
    expect(validInvariants(result, input, known)).toBe(false),
  );
  it('rejects IDs outside the integrated catalog and duplicate schema IDs', () => {
    expect(validInvariants(valid, input, new Set(['javascript', 'react']))).toBe(false);
    expect(
      engineResultSchema.safeParse({ ...valid, requiredSkillIds: ['git', 'git'] }).success,
    ).toBe(false);
  });
});
