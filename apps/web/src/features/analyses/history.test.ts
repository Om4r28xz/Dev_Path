import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '../../lib/http/client.js';
import { loadHistory, deleteAnalysis } from './history-api.js';
import {
  parseHistory,
  historyItems,
  removeHistoryItem,
  HistoryResponseError,
  type HistoryData,
} from './history.js';
vi.mock('../../lib/http/client.js', () => ({ apiRequest: vi.fn() }));
const item = {
  id: '00000000-0000-4000-8000-000000000001',
  source: { type: 'text' as const, title: 'Frontend' },
  compatibilityPercentage: 67,
  skillsOutdated: false,
  createdAt: '2026-11-02T12:00:00.123456Z',
};
const page = { items: [item], nextCursor: null };
beforeEach(() => vi.clearAllMocks());
describe('ANL-04 summary trust boundary', () => {
  it('accepts only the summary contract and distinguishes null and zero', () => {
    expect(parseHistory(page)).toEqual(page);
    expect(
      parseHistory({ items: [{ ...item, compatibilityPercentage: 0 }], nextCursor: null }).items[0]!
        .compatibilityPercentage,
    ).toBe(0);
    expect(
      parseHistory({ items: [{ ...item, compatibilityPercentage: null }], nextCursor: null })
        .items[0]!.compatibilityPercentage,
    ).toBeNull();
  });
  it.each(
    [
      null,
      {},
      { items: [], nextCursor: 'tiny' },
      { items: [], nextCursor: 'a'.repeat(513) },
      { items: Array(51).fill(item), nextCursor: null },
      { items: [item, item], nextCursor: null },
      { items: [{ ...item, evidence: [] }], nextCursor: null },
      { items: [{ ...item, id: 'invalid' }], nextCursor: null },
      { items: [{ ...item, compatibilityPercentage: 1.5 }], nextCursor: null },
      { items: [{ ...item, compatibilityPercentage: 101 }], nextCursor: null },
      { items: [{ ...item, skillsOutdated: 'false' }], nextCursor: null },
      { items: [{ ...item, createdAt: 'yesterday' }], nextCursor: null },
      { items: [{ ...item, source: { type: 'jsearch', title: null } }], nextCursor: null },
      { items: [{ ...item, source: { type: 'text', title: 'a'.repeat(121) } }], nextCursor: null },
    ].map((value) => ({ value })),
  )('rejects malformed pages without fabricating summaries %#', ({ value }) => {
    expect(() => parseHistory(value)).toThrow(HistoryResponseError);
  });
  it('deduplicates overlapping pages in server order, without mutating either', () => {
    const second = { ...item, id: '00000000-0000-4000-8000-000000000002' };
    const pages = [page, { items: [item, second], nextCursor: null }];
    expect(historyItems(pages)).toEqual([item, second]);
    expect(pages[1]!.items).toHaveLength(2);
  });
  it('removes only the confirmed record while preserving page cursors and other snapshots', () => {
    const data: HistoryData = {
      pages: [{ ...page, nextCursor: 'cursor-1234567890' }],
      pageParams: [null],
    };
    expect(removeHistoryItem(data, item.id)).toEqual({
      pages: [{ items: [], nextCursor: 'cursor-1234567890' }],
      pageParams: [null],
    });
    expect(data.pages[0]!.items).toEqual([item]);
    expect(removeHistoryItem(undefined, item.id)).toBeUndefined();
  });
});
describe('ANL-04 existing API transport', () => {
  it('uses the real limit/cursor and abort signal, with no invented pagination offset', async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiRequest).mockResolvedValue(page);
    await loadHistory(null, signal);
    expect(apiRequest).toHaveBeenLastCalledWith('/api/v1/analyses?limit=20', { signal });
    await loadHistory('opaque/&cursor=abc', signal);
    expect(apiRequest).toHaveBeenLastCalledWith(
      '/api/v1/analyses?limit=20&cursor=opaque%2F%26cursor%3Dabc',
      { signal },
    );
  });
  it('rejects a repeated cursor instead of allowing an infinite load loop', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ ...page, nextCursor: 'cursor-1234567890' });
    await expect(loadHistory('cursor-1234567890', new AbortController().signal)).rejects.toThrow(
      HistoryResponseError,
    );
  });
  it('deletes with the existing owned endpoint and cancellation', async () => {
    vi.mocked(apiRequest).mockResolvedValue(undefined);
    const signal = new AbortController().signal;
    await deleteAnalysis('../auth/logout', signal);
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/analyses/..%2Fauth%2Flogout', {
      method: 'DELETE',
      signal,
    });
  });
  it('propagates failures/404 and rejects a fake delete success body', async () => {
    const failure = new Error('controlled failure');
    vi.mocked(apiRequest).mockRejectedValueOnce(failure);
    await expect(deleteAnalysis(item.id, new AbortController().signal)).rejects.toBe(failure);
    vi.mocked(apiRequest).mockResolvedValue({ deleted: true });
    await expect(deleteAnalysis(item.id, new AbortController().signal)).rejects.toThrow(
      HistoryResponseError,
    );
  });
});
