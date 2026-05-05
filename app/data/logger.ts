import { appEnv, isDevelopment } from "../config/env";

/**
 * Generic structured payload for log entries. Repository call sites
 * pass an `op` (e.g. "events.create") plus any context that helps
 * debugging (eg `groupId`, `userId`).
 */
export type LogContext = Record<string, unknown>;

const formatPrefix = (level: string, op: string) =>
  `[Overlap ${appEnv.environment}] ${level} ${op}`;

export const logger = {
  info(op: string, context?: LogContext) {
    if (!isDevelopment()) {
      return;
    }
    if (context && Object.keys(context).length > 0) {
      console.info(formatPrefix("info", op), context);
    } else {
      console.info(formatPrefix("info", op));
    }
  },

  warn(op: string, context?: LogContext) {
    if (context && Object.keys(context).length > 0) {
      console.warn(formatPrefix("warn", op), context);
    } else {
      console.warn(formatPrefix("warn", op));
    }
  },

  error(op: string, error: unknown, context?: LogContext) {
    const formattedError = normalizeError(error);
    const payload = { ...context, error: formattedError };
    console.error(formatPrefix("error", op), payload);
  },
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isDevelopment() ? error.stack : undefined,
    };
  }
  return { message: String(error) };
};

/**
 * Try to identify a Supabase / PostgREST RLS denial. Cloud
 * implementations of the repositories should annotate `error.code` so
 * UI can render a friendly message instead of a stack trace.
 */
export const isPolicyDenial = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return code === "42501" || code === "PGRST301";
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  return fallback;
};
