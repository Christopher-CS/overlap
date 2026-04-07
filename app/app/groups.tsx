import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTopBar } from "./components/AppTopBar";

export default function GroupsScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <AppTopBar title="Groups" />
        <View style={styles.body}>
          <Text style={styles.subtitle}>Coming soon</Text>
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
  subtitle: {
    color: "#6D7B92",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
});
