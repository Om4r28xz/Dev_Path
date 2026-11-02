import { sampleAnalysis, sampleWithEvidence } from './test-fixtures.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../lib/http/client.js';
import { createAnalysis, loadAnalysis } from './api.js';
vi.mock('../../lib/http/client.js', () => ({ apiRequest: vi.fn() }));
describe('ANL-02 create command transport', () => {
  beforeEach(() => vi.clearAllMocks());
  it('uses the existing POST with a stable key, minimal body and cancellation signal', async () => {
    const command = { source: { type: 'text' as const, text: 'React Git' } };
    const signal = new AbortController().signal;
    vi.mocked(apiRequest).mockResolvedValue(sampleAnalysis);
    await createAnalysis(command, 'same-key', signal);
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/analyses', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'same-key' },
      body: JSON.stringify(command),
      signal,
    });
  });
  it('propagates failure so the draft can be retried with the same command/key', async () => {
    const cause = new Error('controlled network failure');
    vi.mocked(apiRequest).mockRejectedValue(cause);
    await expect(
      createAnalysis(
        { source: { type: 'text', text: 'Java' } },
        'same-key',
        new AbortController().signal,
      ),
    ).rejects.toBe(cause);
  });
  it('loads a saved owned detail using GET and the query cancellation signal', async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiRequest).mockResolvedValue(sampleAnalysis);
    await loadAnalysis('00000000-0000-4000-8000-000000000001', signal);
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/v1/analyses/00000000-0000-4000-8000-000000000001',
      { signal },
    );
  });
  it('escapes path segments instead of allowing a caller to select another route', async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiRequest).mockResolvedValue(sampleAnalysis);
    await loadAnalysis('../auth/logout', signal);
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/analyses/..%2Fauth%2Flogout', { signal });
  });
  it('preserves a detail404 for the page without fabricating a result', async () => {
    const missing = Object.assign(new Error('not found'), { status: 404, code: 'NOT_FOUND' });
    vi.mocked(apiRequest).mockRejectedValue(missing);
    await expect(
      loadAnalysis('00000000-0000-4000-8000-000000000001', new AbortController().signal),
    ).rejects.toBe(missing);
  });

  it('validates evidence on creation and detail before returning it', async () => {
    vi.mocked(apiRequest).mockResolvedValue(sampleWithEvidence);
    expect(
      await createAnalysis(
        { source: { type: 'text', text: 'Git JS React' } },
        'same-key',
        new AbortController().signal,
      ),
    ).toEqual(sampleWithEvidence);
    expect(await loadAnalysis(sampleWithEvidence.id, new AbortController().signal)).toEqual(
      sampleWithEvidence,
    );
  });
  it('rejects malformed successful responses instead of inventing a score', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: 'invalid' });
    await expect(loadAnalysis(sampleAnalysis.id, new AbortController().signal)).rejects.toThrow(
      'La respuesta del análisis no es válida.',
    );
  });
  it('omits invalid optional evidence and preserves a valid base snapshot', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      ...sampleAnalysis,
      evidence: [{ skillId: 'git', matches: [] }],
    });
    expect(await loadAnalysis(sampleAnalysis.id, new AbortController().signal)).toEqual(
      sampleAnalysis,
    );
  });
});
