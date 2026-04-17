import { Feather, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { getDisplayInitials, useCurrentProfile } from "../../data/profile-context";

export type AppTopBarProps = {
  /** When set, shown as the left title (tab / inner screens). When omitted, shows the Overlap brand. */
  title?: string;
  /** Renders invite + profile actions on the right (default: true). */
  showActions?: boolean;
};

export function AppTopBar({ title, showActions = true }: AppTopBarProps) {
  const isBrand = !title;
  const { profile } = useCurrentProfile();
  const initials = getDisplayInitials(profile?.displayName);
  const avatarTint = profile?.accentColor ?? "#2D6BFF";

  return (
    <View style={styles.topBar}>
      <Text style={isBrand ? styles.brand : styles.pageTitle} numberOfLines={1}>
        {title ?? "Overlap"}
      </Text>
      {showActions ? (
        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
            <Feather color="#22304D" name="user-plus" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={profile?.displayName ?? "Profile"}
            accessibilityRole="button"
            style={[styles.avatarButton, initials ? { backgroundColor: avatarTint } : null]}
          >
            {initials ? (
              <Text style={styles.avatarInitials}>{initials}</Text>
            ) : (
              <Ionicons color="#A9AEB8" name="person" size={22} />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionsPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    borderBottomColor: "#E9EEF7",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  brand: {
    color: "#2D6BFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    flexShrink: 1,
  },
  pageTitle: {
    color: "#22304D",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  topBarActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  actionsPlaceholder: {
    width: 82,
  },
  iconButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: "#F1F2F4",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
