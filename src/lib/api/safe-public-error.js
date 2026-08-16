const SAFE_ERROR_MESSAGES = new Map([
  ["UNAUTHORIZED", "Unauthorized"],
  ["FORBIDDEN", "Forbidden"],
  ["NOT_FOUND", "Not found"],
  ["CONFLICT", "Conflict"],
  ["RATE_LIMITED", "Too many requests"],
]);

/**
 * Return only explicitly approved public error text. Provider/database error
 * messages remain available to server-side logging but never become an API
 * response by accident.
 */
export function safePublicError(error, fallback = "Request failed") {
  const normalizedFallback =
    typeof fallback === "string" && fallback.trim()
      ? fallback.trim().slice(0, 200)
      : "Request failed";
  const code =
    typeof error?.code === "string"
      ? error.code.toUpperCase()
      : typeof error?.message === "string"
        ? error.message.toUpperCase()
        : "";
  return SAFE_ERROR_MESSAGES.get(code) || normalizedFallback;
}
