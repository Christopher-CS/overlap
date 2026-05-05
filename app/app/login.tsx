import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appEnv } from "../config/env";
import { useAuth } from "../data/auth-context";

type LoginMode = "signIn" | "signUp";

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<LoginMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "signUp";

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }
    if (isSignUp && !displayName.trim()) {
      Alert.alert("Display name required", "Please enter a display name.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (isSignUp) {
        await signUpWithEmail({
          email: trimmedEmail,
          password,
          displayName: displayName.trim(),
        });
      } else {
        await signInWithEmail({ email: trimmedEmail, password });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      Alert.alert(isSignUp ? "Sign up failed" : "Sign in failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>Overlap</Text>
            <Text style={styles.tagline}>
              Find time that works for the whole group.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isSignUp ? "Create account" : "Sign in"}</Text>

            {isSignUp ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Display name</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor="#95A1B4"
                  style={styles.input}
                  value={displayName}
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@school.edu"
                placeholderTextColor="#95A1B4"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#95A1B4"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                void handleSubmit();
              }}
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting
                  ? "Working..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Text>
              {isSubmitting ? null : <Feather color="#FFFFFF" name="arrow-right" size={16} />}
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setMode(isSignUp ? "signIn" : "signUp")}
              style={styles.switchModeButton}
            >
              <Text style={styles.switchModeText}>
                {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
              </Text>
            </TouchableOpacity>
          </View>

          {appEnv.useLocalRepositories ? (
            <Text style={styles.devHint}>
              Local mock mode — any email/password is accepted.
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 28,
  },
  brand: {
    color: "#2D6BFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tagline: {
    color: "#50607B",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5EAF3",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardTitle: {
    color: "#22304D",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: "#6B7891",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDE4F1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#22304D",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2D6BFF",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 6,
    paddingVertical: 13,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  switchModeButton: {
    alignItems: "center",
    marginTop: 12,
  },
  switchModeText: {
    color: "#2D6BFF",
    fontSize: 13,
    fontWeight: "700",
  },
  devHint: {
    color: "#7B879F",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 18,
    textAlign: "center",
  },
});
