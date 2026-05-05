import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appEnv } from "../config/env";

/**
 * Thrown when something tries to use the Supabase client without the
 * URL/anon key being configured. The repository factory should never
 * reach this code path because {@link appEnv.useLocalRepositories} is
 * forced to `true` whenever credentials are missing — so this is a
 * second line of defense for direct callers.
 */
export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Supabase credentials are not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in app/.env, or keep EXPO_PUBLIC_USE_LOCAL_REPOSITORIES=true.",
    );
    this.name = "SupabaseConfigError";
  }
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a memoized Supabase client built from {@link appEnv}. Calling
 * this when credentials are missing throws {@link SupabaseConfigError}
 * loudly instead of letting `undefined` URLs reach `fetch()`.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (cachedClient) {
    return cachedClient;
  }
  if (!appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
    throw new SupabaseConfigError();
  }
  cachedClient = createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return cachedClient;
};

/**
 * Returns the cached client only if Supabase has been configured. Use
 * this when you want to soft-detect availability (e.g. metrics, debug
 * panels) without throwing.
 */
export const tryGetSupabaseClient = (): SupabaseClient | null => {
  if (!appEnv.supabaseUrl || !appEnv.supabaseAnonKey) {
    return null;
  }
  return getSupabaseClient();
};

/**
 * Test-only: reset the memoized client so a fresh one is built on the
 * next `getSupabaseClient()` call. Do not use from production code.
 */
export const __resetSupabaseClientForTesting = () => {
  cachedClient = null;
};
