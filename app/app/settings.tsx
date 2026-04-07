import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTopBar } from "./components/AppTopBar";

const APP_VERSION = "0.1";

export default function SettingsScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppTopBar title="Settings" />

        <View style={styles.body}>
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>App version</Text>
              <Text style={styles.rowValue}>{APP_VERSION}</Text>
            </View>
          </View>
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
  section: {
    paddingTop: 8,
  },
  row: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E9EEF7",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
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
});
