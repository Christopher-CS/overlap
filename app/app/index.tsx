import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTopBar } from "./components/AppTopBar";
import ScheduleCalendar, {
  type CalendarActor,
  type CalendarEventTemplate,
} from "./components/ScheduleCalendar";
import { getRepositories } from "../data/repository-provider";

const { events: eventsRepository } = getRepositories();

type MockCalendarData = {
  actors: CalendarActor[];
  eventTemplates: CalendarEventTemplate[];
};

const MOCK_CALENDAR = require("../data/mock-calendar-events.json") as MockCalendarData;

export default function Index() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<CalendarEventTemplate[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const actorOptions = useMemo(() => MOCK_CALENDAR.actors, []);

  const loadEvents = async () => {
    const loadedEvents = await eventsRepository.listEvents();
    setEvents(loadedEvents);
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const resetForm = () => {
    setTitle("");
    setOwnerId(actorOptions[0]?.id ?? "");
    setDate("");
    setStartTime("");
    setEndTime("");
  };

  useEffect(() => {
    if (!ownerId && actorOptions.length > 0) {
      setOwnerId(actorOptions[0].id);
    }
  }, [actorOptions, ownerId]);

  const validateTime = (timeValue: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeValue);
  const validateDate = (dateValue: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateValue);

  const handleCreateEvent = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !ownerId || !date || !startTime || !endTime) {
      Alert.alert("Missing fields", "Please fill out all event fields.");
      return;
    }
    if (!validateDate(date)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
      return;
    }
    if (!validateTime(startTime) || !validateTime(endTime)) {
      Alert.alert("Invalid time", "Use HH:mm format.");
      return;
    }
    if (endTime <= startTime) {
      Alert.alert("Invalid range", "End time must be after start time.");
      return;
    }
    const ownerExists = actorOptions.some((actor) => actor.id === ownerId);
    if (!ownerExists) {
      Alert.alert("Invalid owner", "Please choose a valid owner.");
      return;
    }

    try {
      setIsSaving(true);
      await eventsRepository.createEvent({
        title: trimmedTitle,
        ownerId,
        date,
        startTime,
        endTime,
      });
      await loadEvents();
      setIsCreateModalVisible(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppTopBar />

        <ScheduleCalendar
          actors={MOCK_CALENDAR.actors}
          eventTemplates={events}
        />

        <TouchableOpacity
          onPress={() => setIsCreateModalVisible(true)}
          style={[styles.fab, { bottom: Math.max(insets.bottom, 12)}]}
        >
          <Ionicons color="#FFFFFF" name="add" size={28} />
        </TouchableOpacity>

        <Modal
          animationType="fade"
          onRequestClose={() => setIsCreateModalVisible(false)}
          transparent
          visible={isCreateModalVisible}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create event</Text>
              <TextInput
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor="#8A96AA"
                style={styles.input}
                value={title}
              />

              <Text style={styles.fieldLabel}>Owner</Text>
              <View style={styles.ownerRow}>
                {actorOptions.map((actor) => {
                  const selected = actor.id === ownerId;
                  return (
                    <TouchableOpacity
                      key={actor.id}
                      onPress={() => setOwnerId(actor.id)}
                      style={[
                        styles.ownerChip,
                        selected && { borderColor: actor.color, backgroundColor: actor.chipColor },
                      ]}
                    >
                      <Text style={[styles.ownerChipText, selected && { color: actor.color }]}>
                        {actor.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                onChangeText={setDate}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor="#8A96AA"
                style={styles.input}
                value={date}
              />
              <View style={styles.timeRow}>
                <TextInput
                  onChangeText={setStartTime}
                  placeholder="Start (HH:mm)"
                  placeholderTextColor="#8A96AA"
                  style={[styles.input, styles.timeInput]}
                  value={startTime}
                />
                <TextInput
                  onChangeText={setEndTime}
                  placeholder="End (HH:mm)"
                  placeholderTextColor="#8A96AA"
                  style={[styles.input, styles.timeInput]}
                  value={endTime}
                />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => {
                    setIsCreateModalVisible(false);
                    resetForm();
                  }}
                  style={[styles.actionButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    void handleCreateEvent();
                  }}
                  style={[styles.actionButton, styles.createButton]}
                >
                  <Text style={styles.createButtonText}>{isSaving ? "Saving..." : "Create"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    maxWidth: 460,
    padding: 16,
    width: "100%",
  },
  modalTitle: {
    color: "#1F2C48",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  fieldLabel: {
    color: "#6B7891",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 2,
    textTransform: "uppercase",
  },
  ownerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  ownerChip: {
    backgroundColor: "#F6F8FC",
    borderColor: "#DDE4F1",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ownerChipText: {
    color: "#50607B",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDE4F1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#22304D",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
  },
  timeInput: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cancelButton: {
    backgroundColor: "#EEF2F8",
  },
  createButton: {
    backgroundColor: "#2D6BFF",
  },
  cancelButtonText: {
    color: "#425170",
    fontSize: 14,
    fontWeight: "700",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
