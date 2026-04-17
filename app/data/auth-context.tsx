import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getRepositories } from "./repository-provider";
import type {
  AuthSession,
  SessionUser,
  SignInWithEmailInput,
  SignUpWithEmailInput,
} from "./auth-types";

type AuthContextValue = {
  session: AuthSession;
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (input: SignInWithEmailInput) => Promise<void>;
  signUpWithEmail: (input: SignUpWithEmailInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const INITIAL_SESSION: AuthSession = { status: "loading", user: null };

const AuthContext = createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession>(INITIAL_SESSION);
  const auth = getRepositories().auth;

  useEffect(() => {
    const subscription = auth.onSessionChange((nextSession) => {
      setSession(nextSession);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [auth]);

  const signInWithEmail = useCallback(
    async (input: SignInWithEmailInput) => {
      await auth.signInWithEmail(input);
    },
    [auth],
  );

  const signUpWithEmail = useCallback(
    async (input: SignUpWithEmailInput) => {
      await auth.signUpWithEmail(input);
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session.user,
      isAuthenticated: session.status === "authenticated",
      isLoading: session.status === "loading",
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [session, signInWithEmail, signUpWithEmail, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return value;
};

/**
 * Convenience hook for reading only the current user id without
 * rerendering on every session field change.
 */
export const useCurrentUserId = (): string | null => {
  const { user } = useAuth();
  return user?.id ?? null;
};
