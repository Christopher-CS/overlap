/**
 * Represents the authenticated user in the most minimal form the app
 * needs at the repository / routing layer. Display-oriented fields
 * (display name, avatar) live on {@link ProfileRecord} so that cached
 * profiles can be updated independently from session state.
 */
export type SessionUser = {
  id: string;
  email: string | null;
};

/**
 * Stable status machine for rendering loading / signed-in / signed-out
 * UI without having to check nullability in multiple places.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthSession = {
  status: AuthStatus;
  user: SessionUser | null;
};

export type SignInWithEmailInput = {
  email: string;
  password: string;
};

export type SignUpWithEmailInput = {
  email: string;
  password: string;
  displayName?: string;
};

export type AuthSubscription = {
  unsubscribe: () => void;
};

/**
 * Repository abstraction for authentication. Every concrete
 * implementation (local mock, Supabase, etc.) must satisfy this
 * contract so screens never depend on a specific auth provider.
 */
export type AuthRepository = {
  getSession: () => Promise<AuthSession>;
  onSessionChange: (listener: (session: AuthSession) => void) => AuthSubscription;
  signInWithEmail: (input: SignInWithEmailInput) => Promise<AuthSession>;
  signUpWithEmail: (input: SignUpWithEmailInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
};
