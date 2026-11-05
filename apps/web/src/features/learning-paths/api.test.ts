import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../lib/http/client.js';
import {
  createLearningPath,
  loadLearningPath,
  loadLearningPaths,
  updateLearningStep,
} from './api.js';

vi.mock('../../lib/http/client.js', () => ({ apiRequest: vi.fn() }));

describe('LRN-04 learning path API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue({});
  });

  it('lists owned paths with opaque continuation and cancellation', async () => {
    const signal = new AbortController().signal;
    await loadLearningPaths('opaque-cursor', signal);
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/v1/learning-paths?limit=20&cursor=opaque-cursor',
      { signal },
    );
  });

  it('creates from an analysis using a stable idempotency key', async () => {
    await createLearningPath(
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
    );
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/learning-paths', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': '00000000-0000-4000-8000-000000000002',
      },
      body: JSON.stringify({ analysisId: '00000000-0000-4000-8000-000000000001' }),
    });
  });

  it('escapes identifiers in detail and progress routes', async () => {
    await loadLearningPath('../other');
    expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/learning-paths/..%2Fother', {});
    await updateLearningStep('../path', '../step', 'completed');
    expect(apiRequest).toHaveBeenLastCalledWith(
      '/api/v1/learning-paths/..%2Fpath/steps/..%2Fstep',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      },
    );
  });

  it('propagates a rejected progress update instead of fabricating success', async () => {
    const cause = new Error('controlled failure');
    vi.mocked(apiRequest).mockRejectedValue(cause);
    await expect(updateLearningStep('path-id', 'step-id', 'completed')).rejects.toBe(cause);
  });
});
