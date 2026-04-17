import type {
  AuthRepository,
  AuthSession,
  AuthSubscription,
  SessionUser,
  SignInWithEmailInput,
  SignUpWithEmailInput,
} from "./auth-types";

/**
 * A single "me" user the mock repositories already assume.
 *
 * This id must line up with the `senderId` used in the chat repository
 * and the actor id `"me"` that shows up in the calendar, so that once
 * we swap to real auth we can migrate ownership in one place.
 */
export const LOCAL_ME_USER_ID = "me";

const buildInitialSession = (): AuthSession => ({
  status: "authenticated",
  user: {
    id: LOCAL_ME_USER_ID,
    email: "me@overlap.local",
  },
});

const createLocalAuthRepository = (): AuthRepository => {
  let currentSession: AuthSession = buildInitialSession();
  const listeners = new Set<(session: AuthSession) => void>();

  const emit = (nextSession: AuthSession) => {
    currentSession = nextSession;
    listeners.forEach((listener) => {
      listener(nextSession);
    });
  };

  const fakeUser = (email: string): SessionUser => ({
    id: LOCAL_ME_USER_ID,
    email,
  });

  return {
    async getSession() {
      return currentSession;
    },
    onSessionChange(listener): AuthSubscription {
      listeners.add(listener);
      listener(currentSession);
      return {
        unsubscribe: () => {
          listeners.delete(listener);
        },
      };
    },
    async signInWithEmail(input: SignInWithEmailInput) {
      const nextSession: AuthSession = {
        status: "authenticated",
        user: fakeUser(input.email.trim().toLowerCase()),
      };
      emit(nextSession);
      return nextSession;
    },
    async signUpWithEmail(input: SignUpWithEmailInput) {
      const nextSession: AuthSession = {
        status: "authenticated",
        user: fakeUser(input.email.trim().toLowerCase()),
      };
      emit(nextSession);
      return nextSession;
    },
    async signOut() {
      emit({ status: "unauthenticated", user: null });
    },
  };
};

export const localAuthRepository: AuthRepository = createLocalAuthRepository();
