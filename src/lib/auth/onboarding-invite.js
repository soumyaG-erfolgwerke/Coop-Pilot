import crypto from "crypto";

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function signingKey() {
  const key = process.env.ONBOARDING_INVITE_SECRET || process.env.APPWRITE_API_KEY;
  if (!key || key.length < 32) throw new Error("Onboarding invitation signing is unavailable");
  return crypto.createHmac("sha256", key).update("coopilot:onboarding-invite:v1").digest();
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

export function createOnboardingInviteToken({ inviteId, email, coopId }) {
  const payload = encode(JSON.stringify({
    v: 1,
    inviteId,
    email: email.trim().toLowerCase(),
    coopId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  }));
  const signature = crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOnboardingInviteToken(token) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expected = crypto.createHmac("sha256", signingKey()).update(payload).digest();
  let supplied;
  try { supplied = Buffer.from(suppliedSignature, "base64url"); } catch { return null; }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      data?.v !== 1 || typeof data.inviteId !== "string" ||
      typeof data.email !== "string" || typeof data.coopId !== "string" ||
      !Number.isInteger(data.exp) || data.exp < Math.floor(Date.now() / 1000)
    ) return null;
    return data;
  } catch {
    return null;
  }
}
