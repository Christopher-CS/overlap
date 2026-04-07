import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTopBar } from "./components/AppTopBar";
import ScheduleCalendar, {
  type CalendarActor,
  type CalendarEventTemplate,
} from "./components/ScheduleCalendar";

type MockCalendarData = {
  actors: CalendarActor[];
  eventTemplates: CalendarEventTemplate[];
};

const MOCK_CALENDAR = require("../data/mock-calendar-events.json") as MockCalendarData;

export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppTopBar />

        <ScheduleCalendar
          actors={MOCK_CALENDAR.actors}
          eventTemplates={MOCK_CALENDAR.eventTemplates}
        />

        <TouchableOpacity
          style={[styles.fab, { bottom: Math.max(insets.bottom, 12)}]}
        >
          <Ionicons color="#FFFFFF" name="add" size={28} />
        </TouchableOpacity>
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
});
