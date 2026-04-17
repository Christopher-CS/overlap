import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appEnv } from "../config/env";
import { useAuth } from "../data/auth-context";
import { getDisplayInitials, useCurrentProfile } from "../data/profile-context";
import { AppTopBar } from "./components/AppTopBar";

const APP_VERSION = "0.1";

export default function SettingsScreen() {
  const { user, signOut, isAuthenticated } = useAuth();
  const { profile, isLoading } = useCurrentProfile();

  const initials = getDisplayInitials(profile?.displayName);
  const accentColor = profile?.accentColor ?? "#2D6BFF";

  const handleSignOut = () => {
    Alert.alert(
      "Sign out?",
      "You'll be taken back to the sign-in screen once it's wired up.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const backendLabel = appEnv.useLocalRepositories ? "Local (mock)" : "Supabase";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppTopBar title="Settings" />

        <View style={styles.body}>
          <View style={styles.profileCard}>
            <View style={[styles.profileAvatar, { backgroundColor: accentColor }]}>
              {initials ? (
                <Text style={styles.profileAvatarInitials}>{initials}</Text>
              ) : (
                <Text style={styles.profileAvatarInitials}>?</Text>
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>
                {isLoading ? "Loading…" : profile?.displayName ?? "Not signed in"}
              </Text>
              {user?.email ? <Text style={styles.profileEmail}>{user.email}</Text> : null}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>App version</Text>
              <Text style={styles.rowValue}>{APP_VERSION}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Environment</Text>
              <Text style={styles.rowValue}>{appEnv.environment}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Data source</Text>
              <Text style={styles.rowValue}>{backendLabel}</Text>
            </View>
          </View>

          {isAuthenticated ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutLabel}>Sign out</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FCFCFE",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FCFCFE",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E9EEF7",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  profileAvatar: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  profileAvatarInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: "#22304D",
    fontSize: 16,
    fontWeight: "800",
  },
  profileEmail: {
    color: "#6E7B93",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  section: {
    paddingTop: 4,
  },
  row: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E9EEF7",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowLabel: {
    color: "#50607B",
    fontSize: 16,
    fontWeight: "600",
  },
  rowValue: {
    color: "#22304D",
    fontSize: 16,
    fontWeight: "700",
  },
  signOutButton: {
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    borderColor: "#FBD4D9",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    paddingVertical: 14,
  },
  signOutLabel: {
    color: "#C73A4E",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
