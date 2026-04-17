import Constants from "expo-constants";

/**
 * Runtime environment identifier.
 *
 * Used for logging, feature flags, and repository selection. Keep this
 * list short and explicit so screens can branch on it predictably.
 */
export type RuntimeEnvironment = "development" | "staging" | "production";

export type AppEnv = {
  environment: RuntimeEnvironment;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  /**
   * When true, the repository provider MUST return the local mock
   * implementations. This is the safety valve during migration so that
   * UI work can run without real credentials.
   */
  useLocalRepositories: boolean;
};

const asString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asBoolean = (value: unknown, fallback: boolean): boolean => {
  const raw = asString(value);
  if (raw === null) {
    return fallback;
  }
  return raw.toLowerCase() === "true" || raw === "1";
};

const asEnvironment = (value: unknown): RuntimeEnvironment => {
  const raw = asString(value)?.toLowerCase();
  if (raw === "production" || raw === "staging") {
    return raw;
  }
  return "development";
};

/**
 * Read a value first from `process.env` (Expo inlines EXPO_PUBLIC_*
 * variables at build time) and fall back to `expo-constants.extra`,
 * which is how app.json / eas.json provide values when needed.
 */
const readPublicVar = (key: string): string | undefined => {
  const fromProcess = (process.env as Record<string, string | undefined>)[key];
  if (fromProcess !== undefined) {
    return fromProcess;
  }
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const fromExtra = extra[key];
  return typeof fromExtra === "string" ? fromExtra : undefined;
};

const resolveAppEnv = (): AppEnv => {
  const environment = asEnvironment(readPublicVar("EXPO_PUBLIC_ENV"));
  const supabaseUrl = asString(readPublicVar("EXPO_PUBLIC_SUPABASE_URL"));
  const supabaseAnonKey = asString(readPublicVar("EXPO_PUBLIC_SUPABASE_ANON_KEY"));

  // If credentials are missing we must stay on local repositories, no
  // matter what the flag says, otherwise the app would crash on cloud
  // requests.
  const hasCredentials = supabaseUrl !== null && supabaseAnonKey !== null;
  const flagUseLocal = asBoolean(readPublicVar("EXPO_PUBLIC_USE_LOCAL_REPOSITORIES"), true);
  const useLocalRepositories = flagUseLocal || !hasCredentials;

  return {
    environment,
    supabaseUrl,
    supabaseAnonKey,
    useLocalRepositories,
  };
};

export const appEnv: AppEnv = resolveAppEnv();

export const isProduction = () => appEnv.environment === "production";
export const isStaging = () => appEnv.environment === "staging";
export const isDevelopment = () => appEnv.environment === "development";
