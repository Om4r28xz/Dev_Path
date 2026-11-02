import { describe, expect, it } from 'vitest';
import { AnalysisAttempt, analysisCommand, validateAnalysisDraft } from './draft.js';
describe('ANL-02 independent draft and idempotency', () => {
  it('preserves vacancy text, normalizes optional title and rejects invalid boundaries', () => {
    expect(analysisCommand('  Junior  ', '  JavaScript  ')).toEqual({
      source: { type: 'text', title: 'Junior', text: '  JavaScript  ' },
    });
    expect(analysisCommand('   ', 'Java')).toEqual({ source: { type: 'text', text: 'Java' } });
    expect(validateAnalysisDraft('x'.repeat(120), 'x'.repeat(20000))).toEqual({});
    expect(validateAnalysisDraft('x'.repeat(121), 'x'.repeat(20001))).toMatchObject({
      title: expect.any(String),
      text: expect.any(String),
    });
    expect(validateAnalysisDraft('', ' \n\t').text).toBeTruthy();
    expect(() => analysisCommand('', '')).toThrow();
  });
  it('reuses the exact key and command across retries without altering input', () => {
    let count = 0;
    const attempt = new AnalysisAttempt(
      () => `00000000-0000-4000-8000-${String(++count).padStart(12, '0')}`,
    );
    const first = attempt.prepare('Junior', 'React Git');
    const retry = attempt.prepare('Junior', 'React Git');
    expect(retry).toEqual(first);
    expect(count).toBe(1);
  });
  it('makes a new key after edits even when the user returns to an earlier text', () => {
    let count = 0;
    const attempt = new AnalysisAttempt(() => String(++count));
    const first = attempt.prepare('', 'Java');
    attempt.edited();
    attempt.prepare('', 'React');
    attempt.edited();
    expect(attempt.prepare('', 'Java').key).not.toBe(first.key);
  });
  it('also detects a changed command if a caller forgets to notify an edit', () => {
    let count = 0;
    const attempt = new AnalysisAttempt(() => String(++count));
    const first = attempt.prepare('', 'Java');
    expect(attempt.prepare('Title', 'Java').key).not.toBe(first.key);
  });
});
