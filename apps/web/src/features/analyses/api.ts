import { parseAnalysis } from './validation.js';
import { apiRequest } from '../../lib/http/client.js';
import type { Analysis, AnalysisCommand } from './types.js';
export function createAnalysis(
  command: AnalysisCommand,
  key: string,
  signal: AbortSignal,
): Promise<Analysis> {
  return apiRequest<unknown>('/api/v1/analyses', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: JSON.stringify(command),
    signal,
  }).then(parseAnalysis);
}

export function loadAnalysis(id: string, signal: AbortSignal): Promise<Analysis> {
  return apiRequest<Analysis>('/api/v1/analyses/' + encodeURIComponent(id), { signal }).then(
    parseAnalysis,
  );
}
