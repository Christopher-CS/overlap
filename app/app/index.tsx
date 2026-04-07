import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ScheduleCalendar, {
  type CalendarActor,
  type CalendarEventTemplate,
} from "./components/ScheduleCalendar";

type MockCalendarData = {
  actors: CalendarActor[];
  eventTemplates: CalendarEventTemplate[];
};

const MOCK_CALENDAR = require("../data/mock-calendar-events.json") as MockCalendarData;

const tabItems = [
  { id: "calendar", label: "Calendar", icon: "calendar-blank-outline" as const },
  { id: "groups", label: "Groups", icon: "account-group-outline" as const },
  { id: "conflicts", label: "Conflicts", icon: "alert-outline" as const },
  { id: "settings", label: "Settings", icon: "cog-outline" as const },
];

export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>Overlap</Text>
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather color="#22304D" name="user-plus" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton}>
              <Ionicons color="#A9AEB8" name="person" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <ScheduleCalendar
          actors={MOCK_CALENDAR.actors}
          eventTemplates={MOCK_CALENDAR.eventTemplates}
        />

        <TouchableOpacity
          style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 66 }]}
        >
          <Ionicons color="#FFFFFF" name="add" size={28} />
        </TouchableOpacity>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 4 },
          ]}
        >
          {tabItems.map((tabItem) => {
            const isActive = tabItem.id === "calendar";

            return (
              <TouchableOpacity key={tabItem.id} style={styles.bottomBarItem}>
                <MaterialCommunityIcons
                  color={isActive ? "#2D6BFF" : "#8C98AE"}
                  name={tabItem.icon}
                  size={24}
                />
                <Text
                  style={[
                    styles.bottomBarLabel,
                    isActive && styles.bottomBarLabelActive,
                  ]}
                >
                  {tabItem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  },
  topBarActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
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
  fab: {
    alignItems: "center",
    backgroundColor: "#2D6BFF",
    borderRadius: 26,
    elevation: 5,
    height: 52,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    shadowColor: "#1B4CC5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    width: 52,
  },
  bottomBar: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E9EEF7",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 16,
    paddingTop: 10,
  },
  bottomBarItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 68,
  },
  bottomBarLabel: {
    color: "#8C98AE",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomBarLabelActive: {
    color: "#2D6BFF",
  },
});
