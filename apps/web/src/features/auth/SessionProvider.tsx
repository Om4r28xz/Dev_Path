import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { browserSession, type SessionState } from '../../lib/session/session.js';

interface SessionContextValue extends SessionState {
  refresh: typeof browserSession.refresh;
  logout: typeof browserSession.logout;
  accept: typeof browserSession.accept;
}
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(browserSession.subscribe, browserSession.snapshot);
  useEffect(() => {
    void browserSession.bootstrap().catch(() => undefined);
  }, []);
  return (
    <SessionContext.Provider
      value={{
        ...state,
        refresh: () => browserSession.refresh(),
        logout: () => browserSession.logout(),
        accept: (session) => browserSession.accept(session),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider is required.');
  return context;
}
