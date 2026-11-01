import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserSession, type SessionResponse } from './session.js';

const account = (id: string, accessToken = 'token-' + id): SessionResponse => ({
  accessToken,
  tokenType: 'Bearer',
  expiresIn: 900,
  user: { id, name: id, email: id + '@example.test' },
});

class TestChannel {
  static channels = new Set<TestChannel>();
  onmessage: ((event: MessageEvent) => void) | null = null;
  constructor(readonly name: string) {
    TestChannel.channels.add(this);
  }
  postMessage(data: unknown): void {
    for (const channel of TestChannel.channels) {
      if (channel !== this && channel.name === this.name)
        queueMicrotask(() => channel.onmessage?.({ data } as MessageEvent));
    }
  }
  close(): void {
    TestChannel.channels.delete(this);
  }
}

const lock = {
  tail: Promise.resolve() as Promise<unknown>,
  request<T>(_name: string, _options: unknown, callback: () => Promise<T>): Promise<T> {
    const result = this.tail.then(callback);
    this.tail = result.catch(() => undefined);
    return result;
  },
};

beforeEach(() => {
  lock.tail = Promise.resolve();
  vi.stubGlobal('window', {});
  vi.stubGlobal('navigator', { locks: lock });
  vi.stubGlobal('BroadcastChannel', TestChannel);
});

afterEach(() => {
  TestChannel.channels.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('browser session', () => {
  it('shares one refresh for simultaneous calls in one tab', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(account('a')), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const session = new BrowserSession(new QueryClient());
    const [first, second] = await Promise.all([session.bootstrap(), session.bootstrap()]);
    expect(first?.accessToken).toBe('token-a');
    expect(second?.accessToken).toBe('token-a');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    session.dispose();
  });

  it('coordinates two tabs and keeps access tokens in memory', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(account('a')), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const first = new BrowserSession(new QueryClient());
    const second = new BrowserSession(new QueryClient());
    const results = await Promise.all([first.bootstrap(), second.bootstrap()]);
    expect(results.map((result) => result?.accessToken)).toEqual(['token-a', 'token-a']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    first.dispose();
    second.dispose();
  });

  it('clears account cache on logout and shares logout with another tab', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const cache = new QueryClient();
    cache.setQueryData(['profile'], { name: 'Private' });
    const first = new BrowserSession(cache);
    const second = new BrowserSession(new QueryClient());
    await first.accept(account('a'));
    await vi.waitFor(() => expect(second.snapshot().status).toBe('authenticated'));
    await first.logout();
    await vi.waitFor(() => expect(second.snapshot().status).toBe('anonymous'));
    expect(cache.getQueryData(['profile'])).toBeUndefined();
    first.dispose();
    second.dispose();
  });

  it('clears cached data before publishing a different account', async () => {
    const cache = new QueryClient();
    const session = new BrowserSession(cache);
    await session.accept(account('a'));
    cache.setQueryData(['profile'], { name: 'Account A' });
    await session.accept(account('b'));
    expect(session.snapshot().session?.user.id).toBe('b');
    expect(cache.getQueryData(['profile'])).toBeUndefined();
    session.dispose();
  });

  it('preserves the local session when server logout fails', async () => {
    const session = new BrowserSession(new QueryClient());
    await session.accept(account('a'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(session.logout()).rejects.toMatchObject({ status: 503 });
    expect(session.snapshot().status).toBe('authenticated');
    session.dispose();
  });

  it('serializes refresh and logout across two tabs', async () => {
    const first = new BrowserSession(new QueryClient());
    const second = new BrowserSession(new QueryClient());
    await first.accept(account('a'));
    await vi.waitFor(() => expect(second.snapshot().status).toBe('authenticated'));
    const fetchMock = vi
      .fn()
      .mockImplementation((path: string) =>
        Promise.resolve(
          path.endsWith('/refresh')
            ? new Response(JSON.stringify(account('a', 'rotated')), { status: 200 })
            : new Response(null, { status: 204 }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([first.refresh(), second.logout()]);
    await vi.waitFor(() => expect(first.snapshot().status).toBe('anonymous'));
    expect(second.snapshot().status).toBe('anonymous');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    first.dispose();
    second.dispose();
  });

  it('does not blindly repeat an ambiguous refresh failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network failure'));
    vi.stubGlobal('fetch', fetchMock);
    const session = new BrowserSession(new QueryClient());
    await expect(session.bootstrap()).rejects.toThrow('Network failure');
    await expect(session.refreshAfterUnauthorized('old-token')).rejects.toMatchObject({
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    session.dispose();
  });
});
