import { describe, expect, it } from 'vitest';
import { AnalysisResponseError, parseAnalysis } from './validation.js';
import { sampleAnalysis, sampleWithEvidence } from './test-fixtures.js';
describe('ANL-02 public Analysis boundary', () => {
  it('accepts a stored result with evidence and an older server without it', () => {
    expect(parseAnalysis(sampleAnalysis)).toEqual(sampleAnalysis);
    expect(parseAnalysis(sampleWithEvidence)).toEqual(sampleWithEvidence);
    expect(parseAnalysis(sampleWithEvidence)).not.toBe(sampleWithEvidence);
  });
  it('accepts empty evidence only for no requirements and keeps null distinct from zero', () => {
    const empty = {
      ...sampleAnalysis,
      requiredSkillIds: [],
      matchedSkillIds: [],
      missingSkillIds: [],
      compatibilityPercentage: null,
      evidence: [],
      warnings: ['NO_TECHNOLOGIES_DETECTED'],
    };
    expect(parseAnalysis(empty)).toEqual(empty);
    const zero = {
      ...sampleAnalysis,
      matchedSkillIds: [],
      missingSkillIds: sampleAnalysis.requiredSkillIds,
      compatibilityPercentage: 0,
    };
    expect(parseAnalysis(zero).compatibilityPercentage).toBe(0);
    expect(parseAnalysis({ ...sampleAnalysis, evidence: [] })).toEqual(sampleAnalysis);
  });
  it.each(
    [
      null,
      {},
      'not-json',
      undefined,
      [],
      { ...sampleAnalysis, id: 'invalid' },
      { ...sampleAnalysis, source: { type: 'text', title: 'a'.repeat(121) } },
      { ...sampleAnalysis, versions: { ...sampleAnalysis.versions, scoring: 'unknown' } },
      { ...sampleAnalysis, compatibilityPercentage: 0 },
      { ...sampleAnalysis, matchedSkillIds: ['javascript', 'javascript'] },
      { ...sampleAnalysis, missingSkillIds: [] },
      { ...sampleAnalysis, createdAt: 'yesterday' },
      { ...sampleAnalysis, candidateSkillsRevision: -1 },
      { ...sampleAnalysis, skillsOutdated: 'false' },
      { ...sampleAnalysis, job_text: 'private' },
    ].map((payload) => ({ payload })),
  )('rejects an invalid base snapshot %#', ({ payload }) => {
    expect(() => parseAnalysis(payload)).toThrow(AnalysisResponseError);
  });
  it.each(
    [
      null,
      {},
      Array(101).fill(sampleWithEvidence.evidence![0]),
      [],
      [{ skillId: 'git', matches: [] }],
      [{ skillId: 'git', matches: [{ text: 'Git', start: -1, end: 2 }] }],
      [{ skillId: 'git', matches: [{ text: 'Git', start: 0, end: 20001 }] }],
      [{ skillId: 'git', matches: [{ text: ' ', start: 0, end: 1 }] }],
      [{ skillId: 'git', matches: [{ text: 'Git', start: 0, end: 2 }] }],
      sampleWithEvidence.evidence!.map((g) => ({ ...g, skillId: 'git' })),
      sampleWithEvidence.evidence!.map((g) => ({ ...g, matches: Array(21).fill(g.matches[0]) })),
      sampleWithEvidence.evidence!.map((g) => ({ ...g, extra: 'private' })),
      sampleWithEvidence.evidence!.map((g) => ({
        ...g,
        matches: [{ ...g.matches[0], extra: 'private' }],
      })),
      sampleWithEvidence.evidence!.map((g) => ({ ...g, matches: [g.matches[0], g.matches[0]] })),
    ].map((evidence) => ({ evidence })),
  )('omits a malformed optional field %# without inventing a result', ({ evidence }) => {
    expect(parseAnalysis({ ...sampleAnalysis, evidence })).toEqual(sampleAnalysis);
  });
  it('keeps UTF-16 ranges and safely transports arbitrary text without interpreting it', () => {
    const html = '<img src=x onerror=alert(1)>';
    const evidence = sampleWithEvidence.evidence!.map((g) => ({
      ...g,
      matches: [{ text: html, start: 3, end: 3 + html.length }],
    }));
    expect(parseAnalysis({ ...sampleAnalysis, evidence }).evidence).toEqual(evidence);
  });

  it('omits an excessive optional UTF-8 payload without changing the base result', () => {
    const required = Array.from({ length: 100 }, (_, i) => 'skill-' + i);
    const base = {
      ...sampleAnalysis,
      requiredSkillIds: required,
      matchedSkillIds: [],
      missingSkillIds: required,
      compatibilityPercentage: 0,
    };
    const evidence = required.map((skillId) => ({
      skillId,
      matches: Array.from({ length: 20 }, (_, i) => ({
        text: 'é'.repeat(100),
        start: i * 100,
        end: (i + 1) * 100,
      })),
    }));
    expect(
      new TextEncoder().encode(JSON.stringify({ ...base, evidence })).byteLength,
    ).toBeGreaterThan(128 * 1024);
    expect(parseAnalysis({ ...base, evidence })).toEqual(base);
  });
});
