import { completeCognitoHostedUISignIn, startCognitoHostedUISignIn, startCognitoLogout } from '@/lib/cognito-auth';
import {
  clearStoredSession,
  CognitoSession,
  CognitoUser,
  getUserFromSession,
  isSessionExpired,
  loadStoredSession,
  storeSession,
} from '@/lib/cognito-session';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: CognitoSession | null;
  user: CognitoUser | null;
  accessToken: string | null;
  apiToken: string | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<CognitoSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const callbackSession = await completeCognitoHostedUISignIn();
        if (!isMounted) return;

        if (callbackSession && !isSessionExpired(callbackSession)) {
          storeSession(callbackSession);
          setSession(callbackSession);
          setError(null);
          return;
        }

        if (callbackSession && isSessionExpired(callbackSession)) {
          clearStoredSession();
          setSession(null);
          setError('Received an expired session. Please sign in again.');
          return;
        }

        const existingSession = loadStoredSession();
        if (existingSession && !isSessionExpired(existingSession)) {
          setSession(existingSession);
        } else {
          clearStoredSession();
          setSession(null);
        }
      } catch (err) {
        clearStoredSession();
        setSession(null);
        setError(err instanceof Error ? err.message : 'Authentication failed.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    await startCognitoHostedUISignIn('Google');
  }, []);

  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setError(null);
    startCognitoLogout();
  }, []);

  useEffect(() => {
    if (session && isSessionExpired(session)) {
      clearStoredSession();
      setSession(null);
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(() => {
    const activeSession = session && !isSessionExpired(session) ? session : null;

    return {
      isLoading,
      isAuthenticated: Boolean(activeSession),
      session: activeSession,
      user: getUserFromSession(activeSession),
      accessToken: activeSession?.idToken ?? activeSession?.accessToken ?? null,
      apiToken: activeSession?.idToken ?? activeSession?.accessToken ?? null,
      error,
      signInWithGoogle,
      signOut,
    };
  }, [error, isLoading, session, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
