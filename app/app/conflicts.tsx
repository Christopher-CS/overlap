import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTopBar } from "./components/AppTopBar";
import type { CalendarActor, CalendarEventTemplate } from "./components/ScheduleCalendar";
import { detectConflicts } from "../data/conflict-utils";

type MockCalendarData = {
  actors: CalendarActor[];
  eventTemplates: CalendarEventTemplate[];
};

const MOCK_CALENDAR = require("../data/mock-calendar-events.json") as MockCalendarData;

const formatDisplayTime = (time: string) => {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${minutesText} ${suffix}`;
};

const formatDateLabel = (dateValue: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));

export default function ConflictsScreen() {
  const actorMap = Object.fromEntries(MOCK_CALENDAR.actors.map((actor) => [actor.id, actor])) as Record<
    string,
    CalendarActor
  >;
  const eventMap = Object.fromEntries(
    MOCK_CALENDAR.eventTemplates.map((eventTemplate) => [`${eventTemplate.id}-${eventTemplate.date}`, eventTemplate]),
  ) as Record<string, CalendarEventTemplate>;
  const { conflictGroupsByDate } = detectConflicts(MOCK_CALENDAR.eventTemplates);
  const datesWithConflicts = Object.keys(conflictGroupsByDate).sort();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppTopBar title="Conflicts" />
        <View style={styles.body}>
          {datesWithConflicts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No conflicts detected</Text>
              <Text style={styles.emptySubtitle}>Your current events do not overlap.</Text>
            </View>
          ) : (
            datesWithConflicts.map((dateValue) => (
              <View key={dateValue} style={styles.dateSection}>
                <Text style={styles.dateTitle}>{formatDateLabel(dateValue)}</Text>
                {conflictGroupsByDate[dateValue].map((conflictGroup, groupIndex) => (
                  <View key={`${dateValue}-${groupIndex}`} style={styles.conflictCard}>
                    <View style={styles.conflictHeader}>
                      <MaterialCommunityIcons color="#FFFFFF" name="alert" size={12} />
                      <Text style={styles.conflictHeaderText}>
                        {formatDisplayTime(conflictGroup.startTime)} - {formatDisplayTime(conflictGroup.endTime)}
                      </Text>
                    </View>
                    {conflictGroup.eventKeys.map((eventKey) => {
                      const eventTemplate = eventMap[eventKey];
                      const actor = eventTemplate ? actorMap[eventTemplate.ownerId] : null;
                      return (
                        <Text key={eventKey} style={styles.conflictEventText}>
                          - {eventTemplate?.title ?? "Event"} ({actor?.name ?? "Unknown"})
                        </Text>
                      );
                    })}
                  </View>
                ))}
              </View>
            ))
          )}
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
  dateSection: {
    marginBottom: 16,
  },
  dateTitle: {
    color: "#22304D",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  conflictCard: {
    backgroundColor: "#FFF5F5",
    borderColor: "#F3B8BB",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  conflictHeader: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E0464D",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  conflictHeaderText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  conflictEventText: {
    color: "#4B3A3B",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E9EEF7",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  emptyTitle: {
    color: "#22304D",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#6D7B92",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
});
