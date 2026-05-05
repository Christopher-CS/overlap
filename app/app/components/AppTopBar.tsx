import { Feather, Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { GroupRecord } from "../../data/groups-types";
import { getDisplayInitials, useCurrentProfile } from "../../data/profile-context";
import { getRepositories } from "../../data/repository-provider";
import { showError, showInfo } from "../../data/toast";

const { groups: groupsRepository } = getRepositories();

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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [groups, setGroups] = useState<GroupRecord[]>([]);

  useEffect(() => {
    if (!isInviteOpen) {
      return;
    }
    const loadGroups = async () => {
      try {
        const loadedGroups = await groupsRepository.listGroups();
        setGroups(loadedGroups);
      } catch (error) {
        showError(error, { op: "groups.listForInvite", title: "Could not load groups" });
      }
    };
    void loadGroups();
  }, [isInviteOpen]);

  const buildInviteToken = (groupId: string) =>
    `overlap://join/${groupId}?token=stub-${Date.now().toString(36)}`;

  const handleSelectGroup = (group: GroupRecord) => {
    const link = buildInviteToken(group.id);
    setIsInviteOpen(false);
    showInfo(
      "Invite link (stub)",
      `${link}\n\nReal invite tokens land with the cloud rollout. For now, share this link with someone who already has the app installed.`,
    );
  };

  return (
    <>
      <View style={styles.topBar}>
        <Text style={isBrand ? styles.brand : styles.pageTitle} numberOfLines={1}>
          {title ?? "Overlap"}
        </Text>
        {showActions ? (
          <View style={styles.topBarActions}>
            <TouchableOpacity
              accessibilityLabel="Invite to group"
              accessibilityRole="button"
              onPress={() => setIsInviteOpen(true)}
              style={styles.iconButton}
            >
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

      <Modal
        animationType="fade"
        onRequestClose={() => setIsInviteOpen(false)}
        transparent
        visible={isInviteOpen}
      >
        <Pressable onPress={() => setIsInviteOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={() => {}} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite to a group</Text>
            <Text style={styles.modalSubtitle}>
              Pick a group to generate a stub invite link. Real tokens ship with cloud auth.
            </Text>
            <View style={styles.groupList}>
              {groups.length === 0 ? (
                <Text style={styles.emptyGroups}>You're not in any groups yet.</Text>
              ) : (
                groups.map((group) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={group.id}
                    onPress={() => handleSelectGroup(group)}
                    style={styles.groupRow}
                  >
                    <View style={[styles.groupSwatch, { backgroundColor: group.color }]} />
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Feather color="#94A3B8" name="chevron-right" size={16} />
                  </TouchableOpacity>
                ))
              )}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setIsInviteOpen(false)}
              style={styles.modalDismiss}
            >
              <Text style={styles.modalDismissText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  modalBackdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    color: "#22304D",
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: "#6E7B93",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
  },
  groupList: {
    marginTop: 12,
  },
  groupRow: {
    alignItems: "center",
    borderColor: "#E9EEF7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupSwatch: {
    borderRadius: 6,
    height: 14,
    width: 14,
  },
  groupName: {
    color: "#22304D",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyGroups: {
    color: "#7B879F",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 6,
    textAlign: "center",
  },
  modalDismiss: {
    alignItems: "center",
    backgroundColor: "#EEF2F8",
    borderRadius: 10,
    marginTop: 6,
    paddingVertical: 10,
  },
  modalDismissText: {
    color: "#425170",
    fontSize: 14,
    fontWeight: "700",
  },
});
