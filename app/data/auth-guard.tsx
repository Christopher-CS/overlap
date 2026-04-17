import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { useAuth } from "./auth-context";

export type AuthGuardProps = {
  /**
   * Optional fallback shown while the session is loading. Defaults to a
   * centered spinner.
   */
  loadingFallback?: ReactNode;
  /**
   * Optional fallback shown when the user is signed out. Defaults to a
   * simple "Signed out" placeholder so this component can be dropped in
   * before the login screen is implemented.
   */
  unauthenticatedFallback?: ReactNode;
  children: ReactNode;
};

/**
 * Wraps protected screens. While the cloud auth implementation is
 * pending, this renders its children whenever the local mock session
 * is authenticated (which is the default in development).
 *
 * Once a real sign-in flow exists, replace `unauthenticatedFallback`
 * with a redirect to the login route (e.g. `router.replace('/login')`).
 */
export function AuthGuard({
  children,
  loadingFallback,
  unauthenticatedFallback,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        {loadingFallback ?? <ActivityIndicator color="#2D6BFF" />}
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        {unauthenticatedFallback ?? (
          <Text style={styles.placeholder}>Please sign in to continue.</Text>
        )}
      </View>
    );
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
  placeholder: {
    color: "#50607B",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
