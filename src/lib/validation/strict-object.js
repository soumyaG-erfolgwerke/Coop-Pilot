export function validateStrictObject(value, allowedKeys, options = {}) {
  const { maxBytes = 64 * 1024, requireAtLeastOne = false } = options;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Request body must be an object" };
  }

  let size;
  try {
    size = Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return { ok: false, error: "Request body must be JSON serializable" };
  }
  if (size > maxBytes) return { ok: false, error: "Request body is too large" };

  const allowed = new Set(allowedKeys);
  const keys = Object.keys(value);
  const unknown = keys.filter((key) => !allowed.has(key));
  if (unknown.length) {
    return { ok: false, error: `Unsupported field: ${unknown[0]}` };
  }
  if (requireAtLeastOne && keys.length === 0) {
    return { ok: false, error: "At least one field is required" };
  }
  return { ok: true, value };
}
export function boundedText(value, { min = 0, max, required = false } = {}) {
  if (value === undefined || value === null) return required ? null : undefined;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if ((required && normalized.length === 0) || normalized.length < min || normalized.length > max) {
    return null;
  }
  return normalized;
}

export function boundedId(value) {
  return boundedText(value, { min: 1, max: 64, required: true });
}
