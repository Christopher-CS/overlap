import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "./auth-context";

export type AuthGuardProps = {
  /**
   * Optional fallback shown while the session is loading. Defaults to a
   * centered spinner.
   */
  loadingFallback?: ReactNode;
  children: ReactNode;
};

const LOGIN_SEGMENT = "login";

/**
 * Wraps protected screens. Behavior:
 *
 * - While the session is loading, renders {@link loadingFallback}.
 * - Children inside the `/login` route always render, regardless of
 *   authentication state, so unauthenticated users can sign in.
 * - For any other route: if the user is not authenticated, the guard
 *   navigates to `/login`. If the user is authenticated and currently
 *   sitting on `/login`, the guard navigates back to the root tabs.
 */
export function AuthGuard({ children, loadingFallback }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const isOnLoginRoute = segments[0] === LOGIN_SEGMENT;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated && !isOnLoginRoute) {
      router.replace("/login");
      return;
    }
    if (isAuthenticated && isOnLoginRoute) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isOnLoginRoute, router]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        {loadingFallback ?? <ActivityIndicator color="#2D6BFF" />}
      </View>
    );
  }

  // Always render the login screen itself, even if the auth context is
  // not yet authenticated.
  if (isOnLoginRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    // The effect above will redirect; render nothing in the meantime to
    // avoid flashing protected UI.
    return <View style={styles.center} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    backgroundColor: "#FCFCFE",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
