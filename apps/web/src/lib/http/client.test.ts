import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserSession } from '../session/session.js';
import { apiRequest } from './client.js';

const account = (token: string) => ({
  accessToken: token,
  tokenType: 'Bearer' as const,
  expiresIn: 900,
  user: { id: 'account-a', name: 'A', email: 'a@example.test' },
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('authenticated API requests', () => {
  it.each([403, 429, 503])('never refreshes after HTTP %i', async (status) => {
    await browserSession.accept(account('old'));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'FORBIDDEN' } }), { status }),
      );
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest('/api/v1/me')).rejects.toMatchObject({ status });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes once after an authentication 401 and retries with the new token', async () => {
    await browserSession.accept(account('old'));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }), { status: 401 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(account('new')), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'account-a' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest<{ id: string }>('/api/v1/me')).resolves.toEqual({ id: 'account-a' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryHeaders = (fetchMock.mock.calls[2]![1] as RequestInit).headers as Headers;
    expect(retryHeaders.get('Authorization')).toBe('Bearer new');
  });
});
