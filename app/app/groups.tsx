import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTopBar } from "./components/AppTopBar";
import type { CalendarActor, CalendarEventTemplate } from "./components/ScheduleCalendar";
import { getRepositories } from "../data/repository-provider";
import type { GroupRecord } from "../data/groups-types";

const { groups: groupsRepository } = getRepositories();

type RecentActivityItem = {
  id: string;
  groupId: string;
  title: string;
  groupName: string;
  statusLabel: string;
  statusTone: "live" | "soon" | "tomorrow";
  metaLabel: string;
  imageTone: string;
};

type GroupListItem = {
  id: string;
  name: string;
  eventCount: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconTone: string;
  iconBackground: string;
};

type MockCalendarData = {
  actors: CalendarActor[];
  eventTemplates: CalendarEventTemplate[];
};

const MOCK_CALENDAR = require("../data/mock-calendar-events.json") as MockCalendarData;

const GROUP_ICON_TOKENS: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  iconTone: string;
  iconBackground: string;
}> = [
  { icon: "code-slash-outline", iconTone: "#2D6BFF", iconBackground: "#EAF1FF" },
  { icon: "color-palette-outline", iconTone: "#DE7E19", iconBackground: "#FFF1E5" },
  { icon: "barbell-outline", iconTone: "#19A36B", iconBackground: "#E4F8EE" },
  { icon: "film-outline", iconTone: "#8E5CE6", iconBackground: "#F0E9FF" },
  { icon: "restaurant-outline", iconTone: "#D36A5A", iconBackground: "#FDECE8" },
];

const EVENT_IMAGE_TONES = ["#B48A72", "#A9825F", "#6D8EA8", "#8C9B66", "#A27CB5"];

const parseEventDateTime = (dateValue: string, timeValue: string) => {
  const [hoursText, minutesText] = timeValue.split(":");
  const eventDate = new Date(`${dateValue}T00:00:00`);
  eventDate.setHours(Number(hoursText), Number(minutesText), 0, 0);
  return eventDate;
};

const formatDisplayTime = (timeValue: string) => {
  const [hoursText, minutesText] = timeValue.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${minutesText} ${suffix}`;
};

const formatStatusAndMeta = (eventDate: Date, startTime: string) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const eventDayStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  const dayDelta = Math.round(
    (eventDayStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDelta === 0) {
    return {
      statusLabel: "Live now",
      statusTone: "live" as const,
      metaLabel: formatDisplayTime(startTime),
    };
  }

  if (dayDelta === 1) {
    return {
      statusLabel: "Tomorrow",
      statusTone: "tomorrow" as const,
      metaLabel: formatDisplayTime(startTime),
    };
  }

  return {
    statusLabel: "Starting soon",
    statusTone: "soon" as const,
    metaLabel: `${eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${formatDisplayTime(startTime)}`,
  };
};

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const loadGroups = async () => {
    const loadedGroups = await groupsRepository.listGroups();
    setGroups(loadedGroups);
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const groupActors = MOCK_CALENDAR.actors.filter((actor) => actor.entityType === "group");
  const groupActorMap = Object.fromEntries(groupActors.map((actor) => [actor.id, actor])) as Record<
    string,
    CalendarActor
  >;
  const groupEvents = [...MOCK_CALENDAR.eventTemplates]
    .filter((eventTemplate) => Boolean(groupActorMap[eventTemplate.ownerId]))
    .sort((firstEvent, secondEvent) => {
      const firstDate = parseEventDateTime(firstEvent.date, firstEvent.startTime);
      const secondDate = parseEventDateTime(secondEvent.date, secondEvent.startTime);
      return firstDate.getTime() - secondDate.getTime();
    });

  const recentActivityItems: RecentActivityItem[] = groupEvents.slice(0, 3).map((eventTemplate, index) => {
    const actor = groupActorMap[eventTemplate.ownerId];
    const eventDate = parseEventDateTime(eventTemplate.date, eventTemplate.startTime);
    const statusAndMeta = formatStatusAndMeta(eventDate, eventTemplate.startTime);

    return {
      id: `${eventTemplate.id}-${eventTemplate.date}`,
      groupId: actor.id,
      title: eventTemplate.title,
      groupName: actor.name,
      statusLabel: statusAndMeta.statusLabel,
      statusTone: statusAndMeta.statusTone,
      metaLabel: statusAndMeta.metaLabel,
      imageTone: EVENT_IMAGE_TONES[index % EVENT_IMAGE_TONES.length],
    };
  });

  const groupListItems: GroupListItem[] = useMemo(
    () =>
      groups.map((group, index) => {
        const iconToken = GROUP_ICON_TOKENS[index % GROUP_ICON_TOKENS.length];
        const eventCount = groupEvents.filter((eventTemplate) => eventTemplate.ownerId === group.id).length;

        return {
          id: group.id,
          name: group.name,
          eventCount,
          icon: iconToken.icon,
          iconTone: iconToken.iconTone,
          iconBackground: iconToken.iconBackground,
        };
      }),
    [groupEvents, groups],
  );

  const handleAddGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      Alert.alert("Group name required", "Please enter a group name.");
      return;
    }

    try {
      setIsSavingGroup(true);
      await groupsRepository.addGroup({ name: trimmedName });
      await loadGroups();
      setNewGroupName("");
      setIsAddModalOpen(false);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleRemoveGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      "Remove group?",
      `${groupName} will be hidden from this list for now.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await groupsRepository.removeGroup(groupId);
            await loadGroups();
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppTopBar title="Groups" />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 22 }]}
          showsVerticalScrollIndicator={false}
          style={styles.body}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Recent activity</Text>
            <Text style={[styles.sectionActionLabel, styles.liveNowLabel]}>Live now</Text>
          </View>

          {recentActivityItems.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyBlockTitle}>No group activity yet</Text>
              <Text style={styles.emptyBlockSubtitle}>Upcoming group events will appear here.</Text>
            </View>
          ) : (
            recentActivityItems.map((activityItem) => {
              const statusToneStyle =
                activityItem.statusTone === "soon"
                  ? styles.statusChipSoon
                  : activityItem.statusTone === "live"
                    ? styles.statusChipLive
                    : styles.statusChipTomorrow;

              return (
                <View key={activityItem.id} style={styles.activityCard}>
                  <View style={[styles.activityImage, { backgroundColor: activityItem.imageTone }]}>
                    <View style={styles.activityImageFade} />
                  </View>

                  <View style={styles.activityContent}>
                    <View style={styles.activityTitleRow}>
                      <Text numberOfLines={1} style={styles.activityTitle}>
                        {activityItem.title}
                      </Text>
                      <View style={[styles.statusChip, statusToneStyle]}>
                        <Text style={styles.statusChipText}>{activityItem.statusLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.activitySubtitle}>{activityItem.groupName}</Text>

                    <View style={styles.activityFooterRow}>
                      <View style={styles.activityMetaRow}>
                        <Ionicons color="#5C7BB0" name="information-circle" size={15} />
                        <Text style={styles.activityMetaText}>{activityItem.metaLabel}</Text>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: "/group-chat/[groupId]",
                            params: { groupId: activityItem.groupId },
                          })
                        }
                        style={styles.chatButton}
                      >
                        <Ionicons color="#FFFFFF" name="chatbox" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>All groups</Text>
            <View style={styles.sectionActionRow}>
              <Text style={styles.sectionActionLabel}>View all</Text>
              <Feather color="#2D6BFF" name="chevron-right" size={14} />
            </View>
          </View>

          {groupListItems.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyBlockTitle}>No groups found</Text>
              <Text style={styles.emptyBlockSubtitle}>Create a group to start scheduling together.</Text>
            </View>
          ) : (
            groupListItems.map((groupItem) => (
              <View key={groupItem.id} style={styles.groupRow}>
                <View style={[styles.groupIconTile, { backgroundColor: groupItem.iconBackground }]}>
                  <Ionicons color={groupItem.iconTone} name={groupItem.icon} size={18} />
                </View>
                <View style={styles.groupInfo}>
                  <Text numberOfLines={1} style={styles.groupName}>
                    {groupItem.name}
                  </Text>
                  <Text style={styles.groupMembers}>
                    {groupItem.eventCount} scheduled event{groupItem.eventCount === 1 ? "" : "s"}
                  </Text>
                </View>
                <View style={styles.groupActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: "/group-chat/[groupId]",
                        params: { groupId: groupItem.id },
                      })
                    }
                    style={styles.groupChatIcon}
                  >
                    <Ionicons color="#889AB7" name="chatbubble-ellipses-outline" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleRemoveGroup(groupItem.id, groupItem.name)}
                    style={styles.groupRemoveIcon}
                  >
                    <Feather color="#A9B3C4" name="trash-2" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setIsAddModalOpen(true)}
            style={styles.createGroupButton}
          >
            <MaterialCommunityIcons color="#2D6BFF" name="plus-circle" size={18} />
            <Text style={styles.createGroupLabel}>Create new group</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
        transparent
        visible={isAddModalOpen}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create group</Text>
            <Text style={styles.modalSubtitle}>
              This is temporary local data and can be swapped to Supabase later.
            </Text>
            <TextInput
              autoFocus
              onChangeText={setNewGroupName}
              placeholder="Group name"
              placeholderTextColor="#95A1B4"
              style={styles.modalInput}
              value={newGroupName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setIsAddModalOpen(false);
                  setNewGroupName("");
                }}
                style={[styles.modalActionButton, styles.modalActionButtonSecondary]}
              >
                <Text style={styles.modalActionSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  void handleAddGroup();
                }}
                style={[styles.modalActionButton, styles.modalActionButtonPrimary]}
              >
                <Text style={styles.modalActionPrimaryText}>
                  {isSavingGroup ? "Saving..." : "Add group"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: {
    color: "#5A6780",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  sectionActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  sectionActionLabel: {
    color: "#2D6BFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  liveNowLabel: {
    color: "#1E59E8",
  },
  emptyBlock: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5EAF3",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyBlockTitle: {
    color: "#23314E",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyBlockSubtitle: {
    color: "#7D8799",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5EAF3",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  activityImage: {
    height: 116,
    width: "100%",
  },
  activityImageFade: {
    backgroundColor: "rgba(18,26,45,0.18)",
    flex: 1,
  },
  activityContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 12,
  },
  activityTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  activityTitle: {
    color: "#1E2B47",
    flex: 1,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusChipSoon: {
    backgroundColor: "#E8F8EC",
  },
  statusChipLive: {
    backgroundColor: "#E6F0FF",
  },
  statusChipTomorrow: {
    backgroundColor: "#EDF1FA",
  },
  statusChipText: {
    color: "#4A7D5D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  activitySubtitle: {
    color: "#7C8799",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  activityFooterRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  activityMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  activityMetaText: {
    color: "#4D6898",
    fontSize: 19,
    fontWeight: "700",
  },
  chatButton: {
    alignItems: "center",
    backgroundColor: "#2D6BFF",
    borderRadius: 11,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  groupRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E6EBF5",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  groupIconTile: {
    alignItems: "center",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    color: "#20304D",
    fontSize: 16,
    fontWeight: "700",
  },
  groupMembers: {
    color: "#8A96AA",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: "uppercase",
  },
  groupChatIcon: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  groupActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  groupRemoveIcon: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  createGroupButton: {
    alignItems: "center",
    backgroundColor: "#F8FBFF",
    borderColor: "#B9C8E8",
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 6,
    paddingVertical: 12,
  },
  createGroupLabel: {
    color: "#2D6BFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  modalBackdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
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
  modalInput: {
    borderColor: "#DCE3F0",
    borderRadius: 10,
    borderWidth: 1,
    color: "#1D2B47",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 14,
  },
  modalActionButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  modalActionButtonSecondary: {
    backgroundColor: "#EEF2F8",
  },
  modalActionButtonPrimary: {
    backgroundColor: "#2D6BFF",
  },
  modalActionSecondaryText: {
    color: "#425170",
    fontSize: 14,
    fontWeight: "700",
  },
  modalActionPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
