import { QueryClient } from '@tanstack/react-query';
import { ApiError, authHeaders, requestJson } from '../http/transport.js';

export interface SessionResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: { id: string; name: string; email: string };
}
export type SessionStatus = 'bootstrapping' | 'authenticated' | 'anonymous' | 'unavailable';
export interface SessionState {
  status: SessionStatus;
  session: SessionResponse | null;
}
type SessionEvent =
  | { kind: 'session'; sender: string; session: SessionResponse }
  | { kind: 'logout'; sender: string };

const lockName = 'devpath-refresh-session-v1';
const channelName = 'devpath-session-v1';

export class BrowserSession {
  private state: SessionState = { status: 'bootstrapping', session: null };
  private readonly listeners = new Set<() => void>();
  private readonly sender = crypto.randomUUID();
  private readonly channel: BroadcastChannel | null =
    typeof window === 'undefined' || typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel(channelName);
  private flight: Promise<SessionResponse | null> | null = null;
  private pendingTransition: Promise<void> = Promise.resolve();
  private bootstrapped = false;
  private revision = 0;

  constructor(private readonly queryClient: QueryClient) {
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<SessionEvent>) => {
        const message = event.data;
        if (!message || message.sender === this.sender) return;
        if (message.kind === 'session') void this.setSession(message.session, false);
        if (message.kind === 'logout') void this.setSession(null, false);
      };
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  snapshot = (): SessionState => this.state;

  private publish(): void {
    for (const listener of this.listeners) listener();
  }

  private async setSession(session: SessionResponse | null, broadcast: boolean): Promise<void> {
    const revision = ++this.revision;
    const transition = this.pendingTransition.then(async () => {
      if (this.state.session?.user.id !== session?.user.id) {
        // Cancel active account queries before any new identity becomes visible.
        await this.queryClient.cancelQueries();
        this.queryClient.clear();
      }
      if (revision !== this.revision) return;
      this.bootstrapped = true;
      this.state = { status: session ? 'authenticated' : 'anonymous', session };
      this.publish();
      if (broadcast) {
        this.channel?.postMessage(
          session
            ? { kind: 'session', sender: this.sender, session }
            : { kind: 'logout', sender: this.sender },
        );
      }
    });
    this.pendingTransition = transition.catch(() => undefined);
    await transition;
  }

  private async withSessionLock<T>(action: () => Promise<T>): Promise<T> {
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
      return navigator.locks.request(lockName, { mode: 'exclusive' }, action);
    }
    // Single-flight still serializes this tab. BroadcastChannel shares successful
    // outcomes, but browsers without Web Locks cannot guarantee cross-tab exclusion.
    return action();
  }

  bootstrap(): Promise<SessionResponse | null> {
    if (this.bootstrapped) return Promise.resolve(this.state.session);
    return this.refresh();
  }

  refresh(): Promise<SessionResponse | null> {
    if (this.flight) return this.flight;
    const startedAt = this.revision;
    const flight = this.withSessionLock(async () => {
      // A tab holding the lock may have already rotated the shared cookie.
      if (this.revision !== startedAt) {
        await this.pendingTransition;
        return this.state.session;
      }
      try {
        const session = await requestJson<SessionResponse>('/api/v1/auth/refresh', {
          method: 'POST',
          headers: authHeaders(),
          body: '{}',
        });
        await this.setSession(session, true);
        return session;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await this.setSession(null, true);
          return null;
        }
        // Ambiguous failures may have rotated the cookie. Never repeat blindly.
        this.bootstrapped = true;
        this.state = { status: 'unavailable', session: this.state.session };
        this.publish();
        throw error;
      }
    });
    this.flight = flight;
    void flight
      .finally(() => {
        if (this.flight === flight) this.flight = null;
      })
      .catch(() => undefined);
    return flight;
  }

  async refreshAfterUnauthorized(usedToken: string): Promise<SessionResponse | null> {
    if (this.state.status === 'unavailable')
      throw new ApiError(503, 'SESSION_UNAVAILABLE', 'No se pudo confirmar la sesión.', '');
    if (this.state.session?.accessToken !== usedToken) return this.state.session;
    return this.refresh();
  }

  async accept(session: SessionResponse): Promise<void> {
    await this.withSessionLock(async () => this.setSession(session, true));
  }

  async logout(): Promise<void> {
    await this.withSessionLock(async () => {
      await requestJson<void>('/api/v1/auth/logout', {
        method: 'POST',
        headers: authHeaders(),
        body: '{}',
      });
      await this.setSession(null, true);
    });
  }

  dispose(): void {
    this.channel?.close();
    this.listeners.clear();
  }
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});
export const browserSession = new BrowserSession(queryClient);
