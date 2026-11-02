import { apiRequest } from '../../lib/http/client.js';
import { HistoryResponseError, parseHistory, type AnalysisListResponse } from './history.js';
export async function loadHistory(
  cursor: string | null,
  signal: AbortSignal,
): Promise<AnalysisListResponse> {
  const query = new URLSearchParams({ limit: '20' });
  if (cursor !== null) query.set('cursor', cursor);
  const page = parseHistory(
    await apiRequest<unknown>('/api/v1/analyses?' + query.toString(), { signal }),
  );
  if (cursor !== null && page.nextCursor === cursor) throw new HistoryResponseError();
  return page;
}
export async function deleteAnalysis(id: string, signal: AbortSignal): Promise<void> {
  const result = await apiRequest<unknown>('/api/v1/analyses/' + encodeURIComponent(id), {
    method: 'DELETE',
    signal,
  });
  if (result !== undefined) throw new HistoryResponseError();
}
