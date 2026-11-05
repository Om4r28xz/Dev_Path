import { apiRequest } from '../../lib/http/client.js';
import type {
  LearningPath,
  LearningPathList,
  LearningStep,
  UpdateLearningStepRequest,
} from './types.js';

export function loadLearningPaths(cursor: string | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: '20' });
  if (cursor) query.set('cursor', cursor);
  return apiRequest<LearningPathList>(
    `/api/v1/learning-paths?${query.toString()}`,
    signal ? { signal } : {},
  );
}

export function loadLearningPath(id: string, signal?: AbortSignal) {
  return apiRequest<LearningPath>(
    `/api/v1/learning-paths/${encodeURIComponent(id)}`,
    signal ? { signal } : {},
  );
}

export function createLearningPath(analysisId: string, idempotencyKey: string) {
  return apiRequest<LearningPath>('/api/v1/learning-paths', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ analysisId }),
  });
}

export function updateLearningStep(pathId: string, stepId: string, status: LearningStep['status']) {
  const body: UpdateLearningStepRequest = { status };
  return apiRequest<LearningPath>(
    `/api/v1/learning-paths/${encodeURIComponent(pathId)}/steps/${encodeURIComponent(stepId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}
