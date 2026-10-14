import { createEventBus, type PlatformContext, type PlatformEvents, type Session } from '@verity/contracts';
import { applyTenant, type TenantId } from '@verity/design-system';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { telemetry } from './telemetry';

const STORAGE_KEY = 'verity.session';

export const REVIEWERS = [
  { userId: 'amorgan', displayName: 'Alex Morgan' },
  { userId: 'pnatarajan', displayName: 'Priya Natarajan' },
] as const;

interface SessionApi {
  session: Session | null;
  signIn(userId: string, tenant: TenantId): void;
  signOut(): void;
  setTenant(tenant: TenantId): void;
}

const SessionContext = createContext<SessionApi | null>(null);

function readStored(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/**
 * Session stub. A real shell would run the OIDC flow and refresh tokens; the
 * shape remotes see (PlatformContext.session) would not change.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStored);

  useEffect(() => {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
    applyTenant((session?.tenant ?? 'acme') as TenantId);
  }, [session]);

  const signIn = useCallback((userId: string, tenant: TenantId) => {
    const reviewer = REVIEWERS.find((r) => r.userId === userId) ?? REVIEWERS[0];
    setSession({
      userId: reviewer.userId,
      displayName: reviewer.displayName,
      tenant,
      accessToken: `stub.${reviewer.userId}.${encodeURIComponent(reviewer.displayName)}`,
      roles: ['reviewer'],
    });
    telemetry.event('session.started', { userId: reviewer.userId, tenant });
  }, []);

  const api = useMemo<SessionApi>(
    () => ({
      session,
      signIn,
      signOut: () => setSession(null),
      setTenant: (tenant) => setSession((s) => (s ? { ...s, tenant } : s)),
    }),
    [session, signIn],
  );

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const api = useContext(SessionContext);
  if (!api) throw new Error('useSession must be used inside SessionProvider');
  return api;
}

/** One bus for the app; a failing subscriber is reported, not rethrown. */
const events: PlatformEvents = createEventBus((error, type) => telemetry.error(error, { event: type, phase: 'event-handler' }));

/** Builds the PlatformContext handed to every remote. Stable while the session is. */
export function usePlatformContext(session: Session): PlatformContext {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      session,
      apiBaseUrl: '/api',
      navigate: (to: string) => void navigate(to),
      events,
      telemetry,
    }),
    [session, navigate],
  );
}
