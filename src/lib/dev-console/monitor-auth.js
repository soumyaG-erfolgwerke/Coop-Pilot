import crypto from "crypto";

function configuredAccounts() {
  try { return Object.values(JSON.parse(process.env.DEV_MONITOR_ACCOUNTS_JSON || "{}")); }
  catch { return []; }
}

function signature(email, timestamp) {
  const secret = process.env.DEV_MONITOR_INTERNAL_SECRET;
  if (!secret || secret.length < 32) return null;
  return crypto.createHmac("sha256", secret).update(`${email}\n${timestamp}`).digest("base64url");
}

export function createMonitorAuthProof(email) {
  const timestamp = Date.now();
  const monitorSignature = signature(email, timestamp);
  if (!monitorSignature) throw new Error("DEV_MONITOR_INTERNAL_SECRET is not configured securely");
  return { monitorTimestamp: timestamp, monitorSignature };
}

export function verifyMonitorAuthProof(email, timestamp, suppliedSignature) {
  if (!Number.isFinite(Number(timestamp)) || Math.abs(Date.now() - Number(timestamp)) > 60_000) return false;
  if (!configuredAccounts().some((account) => account?.email === email)) return false;
  const expected = signature(email, timestamp);
  if (!expected || typeof suppliedSignature !== "string") return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(suppliedSignature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
