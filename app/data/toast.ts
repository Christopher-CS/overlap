import { Alert } from "react-native";

import { getErrorMessage, isPolicyDenial, logger } from "./logger";

/**
 * Minimal toast/error surface. We deliberately keep this as a thin
 * wrapper around `Alert` for now — once a real toast library is wired
 * in, only this module changes; every call site stays the same.
 */
export type ShowErrorOptions = {
  /** Title of the alert. Defaults to "Something went wrong". */
  title?: string;
  /** Friendly message to render. Falls back to the error message. */
  fallbackMessage?: string;
  /**
   * Tag used for logging. Convention is `"<domain>.<action>"`,
   * e.g. `"events.create"` or `"chat.send"`.
   */
  op: string;
  /** Extra context to attach to the log entry. */
  context?: Record<string, unknown>;
};

export const showError = (error: unknown, options: ShowErrorOptions) => {
  logger.error(options.op, error, options.context);

  const title = options.title ?? "Something went wrong";
  const message = isPolicyDenial(error)
    ? "You don't have permission to do that. (Policy denied this request.)"
    : getErrorMessage(error, options.fallbackMessage ?? "Please try again.");

  Alert.alert(title, message);
};

export const showInfo = (title: string, message: string) => {
  Alert.alert(title, message);
};
