const SENSITIVE_KEY = /(?:authorization|cookie|password|passwd|secret|token|api[-_]?key|session|credential|captcha|otp|private[-_]?key)/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const APPWRITE_KEY = /\b(?:standard|dynamic)_[A-Za-z0-9_-]{24,}\b/g;
const LONG_SECRET = /\b[A-Fa-f0-9]{48,}\b/g;

function redactString(value) {
  return value
    .slice(0, 4000)
    .replace(BEARER, "Bearer [REDACTED]")
    .replace(JWT, "[REDACTED_TOKEN]")
    .replace(APPWRITE_KEY, "[REDACTED_API_KEY]")
    .replace(LONG_SECRET, "[REDACTED_SECRET]")
    .replace(EMAIL, "[REDACTED_EMAIL]");
}
export function redactLogValue(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (["number", "boolean", "bigint"].includes(typeof value)) return value;
  if (depth > 5) return "[TRUNCATED]";

  if (value instanceof Error) {
    return {
      name: redactString(value.name || "Error"),
      message: redactString(value.message || "Request failed"),
      ...(value.code !== undefined ? { code: redactLogValue(value.code, depth + 1, seen) } : {}),
      ...(value.type !== undefined ? { type: redactLogValue(value.type, depth + 1, seen) } : {}),
    };
  }

  if (typeof value !== "object") return "[UNSERIALIZABLE]";
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => redactLogValue(item, depth + 1, seen));
  }

  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 100)) {
    output[key] = SENSITIVE_KEY.test(key)
      ? "[REDACTED]"
      : redactLogValue(item, depth + 1, seen);
  }
  return output;
}

export function redactLogArguments(args) {
  return args.map((value) => redactLogValue(value));
}
