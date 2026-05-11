// ============================================================
// hooks/use-auth.tsx
//
// Auth context for the native app. Reads the token from
// expo-secure-store on mount, exposes the current token state,
// and provides `setSession` / `signOut` mutators.
//
// The token itself never leaves services/api.ts beyond this
// context — screens read `useAuth()` to know whether the user
// is authenticated, but they don't read or pass the token value.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { clearToken, getToken, setToken, setUnauthorizedHandler } from '@/services/api';

type AuthValue = {
  token: string | null;
  loading: boolean;
  /** Persist the token and mark the session as signed in. */
  setSession: (token: string) => Promise<void>;
  /** Clear the token and mark the session as signed out. */
  signOut: () => Promise<void>;
};

const Context = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getToken()
      .then((t) => {
        if (cancelled) return;
        setTokenState(t);
      })
      .catch(() => {
        if (cancelled) return;
        setTokenState(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Register the 401 handler so api.ts can flip React state when the
  // server rejects a token. Without this, secure-store would clear but
  // the auth context would still think the user is signed in.
  useEffect(() => {
    setUnauthorizedHandler(() => setTokenState(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const setSession = useCallback(async (newToken: string) => {
    await setToken(newToken);
    setTokenState(newToken);
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setTokenState(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ token, loading, setSession, signOut }),
    [token, loading, setSession, signOut],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
