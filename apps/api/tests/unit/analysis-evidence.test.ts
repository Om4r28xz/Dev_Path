import { describe, expect, it } from 'vitest';
import {
  withStoredEvidence,
  MAX_ANALYSIS_RESPONSE_BYTES,
} from '../../src/modules/analyses/evidence.js';
const dto = {
  requiredSkillIds: ['javascript'],
  versions: { catalog: '1.0.0' },
  compatibilityPercentage: 67,
};
const stored = [{ skillId: 'javascript', matches: [{ text: 'JS', start: 0, end: 2 }] }];
const project = (value: unknown, source: unknown = 'JS') => withStoredEvidence(dto, value, source);
describe('stored evidence public projection', () => {
  it('returns only validated mention fields, without source text', () => {
    expect(project(stored)).toEqual({ ...dto, evidence: stored });
    expect(JSON.stringify(project(stored))).not.toContain('job_text');
  });
  it('keeps absent legacy evidence absent, and preserves the snapshot', () => {
    expect(project([])).toBe(dto);
    expect(project(undefined)).toBe(dto);
  });
  it('exposes an empty array only with no required skills', () => {
    const empty = { ...dto, requiredSkillIds: [] };
    expect(withStoredEvidence(empty, [], 'No technologies.')).toEqual({ ...empty, evidence: [] });
    expect(withStoredEvidence(empty, stored, 'JS')).toBe(empty);
  });
  it.each(
    [
      null,
      {},
      'JS',
      1,
      [{ skillId: 'javascript', matches: [] }],
      [{ skillId: 'javascript', matches: [{ text: '', start: 0, end: 1 }] }],
      [{ skillId: 'javascript', matches: [{ text: '  ', start: 0, end: 2 }] }],
      [{ skillId: 'javascript', matches: [{ text: 'JS', start: -1, end: 2 }] }],
      [{ skillId: 'javascript', matches: [{ text: 'JS', start: 0.5, end: 2 }] }],
      [{ skillId: 'javascript', matches: [{ text: 'JS', start: 2, end: 2 }] }],
      [{ skillId: 'javascript', matches: [{ text: 'JS', start: 0, end: 3 }] }],
      [{ skillId: 'javascript', matches: [{ text: 'JavaScript', start: 0, end: 2 }] }],
      [{ skillId: 'git', matches: [{ text: 'JS', start: 0, end: 2 }] }],
      [
        {
          skillId: 'javascript',
          matches: [{ text: 'JS', start: 0, end: 2, secret: 'not-public' }],
        },
      ],
      [{ skillId: 'javascript', matches: [{ text: 'JS', start: 0, end: 2 }], extra: 'not-public' }],
      [...stored, ...stored],
      [{ skillId: 'javascript', matches: Array(21).fill(stored[0]!.matches[0]) }],
      Array(101).fill(stored[0]),
      [{ skillId: 'javascript', matches: [stored[0]!.matches[0], stored[0]!.matches[0]] }],
    ].map((value) => [value]),
  )('omits malformed, duplicate or excessive evidence %# without changing base', (value) => {
    expect(project(value)).toBe(dto);
  });
  it.each(['person@example.test', '<img src=x onerror=alert(1)>', 'a'.repeat(101)])(
    'does not publish arbitrary stored source substrings %#',
    (text) => {
      expect(
        project([{ skillId: 'javascript', matches: [{ text, start: 0, end: text.length }] }], text),
      ).toBe(dto);
    },
  );
  it('does not reinterpret an unsupported historical catalog', () => {
    const old = { ...dto, versions: { catalog: '0.9.0' } };
    expect(withStoredEvidence(old, stored, 'JS')).toBe(old);
  });
  it('checks missing/oversized source and unknown required skills conservatively', () => {
    expect(project(stored, null)).toBe(dto);
    expect(project(stored, 'JS' + ' '.repeat(20000))).toBe(dto);
    const unknown = { ...dto, requiredSkillIds: ['unknown'] };
    expect(
      withStoredEvidence(
        unknown,
        [{ skillId: 'unknown', matches: [{ text: 'JS', start: 0, end: 2 }] }],
        'JS',
      ),
    ).toBe(unknown);
  });
  it('preserves UTF-16 offsets through emoji and NFKC aliases', () => {
    const source = '🙂 ＪＳ';
    const value = [{ skillId: 'javascript', matches: [{ text: 'ＪＳ', start: 3, end: 5 }] }];
    expect(project(value, source)).toEqual({ ...dto, evidence: value });
    expect(
      project([{ skillId: 'javascript', matches: [{ text: 'ＪＳ', start: 2, end: 4 }] }], source),
    ).toBe(dto);
  });
  it('measures the complete UTF-8 JSON at the response budget boundary', () => {
    const base = { ...dto, padding: '' };
    const size = Buffer.byteLength(JSON.stringify({ ...base, evidence: stored }), 'utf8');
    const exact = { ...base, padding: 'a'.repeat(MAX_ANALYSIS_RESPONSE_BYTES - size) };
    expect(withStoredEvidence(exact, stored, 'JS').evidence).toEqual(stored);
    const tooLarge = { ...exact, padding: exact.padding + 'é' };
    expect(withStoredEvidence(tooLarge, stored, 'JS')).toBe(tooLarge);
  });
});
