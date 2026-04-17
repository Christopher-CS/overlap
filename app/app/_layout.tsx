import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthProvider } from "../data/auth-context";
import { AuthGuard } from "../data/auth-guard";
import { ProfileProvider } from "../data/profile-context";

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <AuthProvider>
        <ProfileProvider>
          <AuthGuard>
            <RootTabs insets={insets} />
          </AuthGuard>
        </ProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

type RootTabsProps = {
  insets: { bottom: number };
};

function RootTabs({ insets }: RootTabsProps) {
  return (
    <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2D6BFF",
          tabBarInactiveTintColor: "#8C98AE",
          tabBarStyle: {
            borderTopColor: "#E9EEF7",
            borderTopWidth: 1,
            backgroundColor: "#FFFFFF",
            height: 60 + Math.max(insets.bottom, 10),
            paddingTop: 1,
            paddingBottom: Math.max(insets.bottom, 10),
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "700",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons color={color} name="calendar-blank-outline" size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Groups",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons color={color} name="account-group-outline" size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="conflicts"
          options={{
            title: "Conflicts",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons color={color} name="alert-outline" size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons color={color} name="cog-outline" size={size} />
            ),
          }}
        />
        <Tabs.Screen name="components" options={{ href: null }} />
        <Tabs.Screen name="components/AppTopBar" options={{ href: null }} />
        <Tabs.Screen name="components/ScheduleCalendar" options={{ href: null }} />
        <Tabs.Screen name="components/scheduleCalendarStyles" options={{ href: null }} />
        <Tabs.Screen name="group-chat/[groupId]" options={{ href: null }} />
        <Tabs.Screen name="+not-found" options={{ href: null }} />
      </Tabs>
  );
}
