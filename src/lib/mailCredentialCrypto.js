import crypto from "node:crypto";

const VERSION = "v1";

function encryptionKey() {
  const encoded = process.env.MAIL_CREDENTIAL_ENCRYPTION_KEY || "";
  if (!/^[a-fA-F0-9]{64}$/.test(encoded)) {
    throw new Error("Mailbox credential encryption is not configured");
  }
  return Buffer.from(encoded, "hex");
}

export function encryptMailCredential(plaintext) {
  if (typeof plaintext !== "string" || !plaintext) {
    throw new Error("Mailbox credential is required");
  }
  if (plaintext.startsWith(`${VERSION}:`)) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptMailCredential(value) {
  if (typeof value !== "string" || !value) throw new Error("Mailbox credential is unavailable");
  if (!value.startsWith(`${VERSION}:`)) return value;
  const parts = value.split(":");
  if (parts.length !== 4) throw new Error("Mailbox credential is invalid");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(parts[1], "base64url"),
  );
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(parts[3], "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
