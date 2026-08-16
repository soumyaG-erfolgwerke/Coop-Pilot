const startsWith = (buffer, bytes) =>
  Buffer.isBuffer(buffer) &&
  buffer.length >= bytes.length &&
  bytes.every((value, index) => buffer[index] === value);

const SIGNATURE_CHECKS = {
  "application/pdf": (buffer) => startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d]),
  "image/jpeg": (buffer) => startsWith(buffer, [0xff, 0xd8, 0xff]),
  "image/png": (buffer) =>
    startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/webp": (buffer) =>
    buffer?.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    (buffer) => startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]),
};

export function hasExpectedFileSignature(buffer, claimedMimeType) {
  const check = SIGNATURE_CHECKS[claimedMimeType];
  return Boolean(check && check(buffer));
}

export function requireExpectedFileSignature(buffer, claimedMimeType) {
  if (!hasExpectedFileSignature(buffer, claimedMimeType)) {
    const error = new Error("Unsupported file content");
    error.code = "INVALID_FILE_SIGNATURE";
    throw error;
  }
}
