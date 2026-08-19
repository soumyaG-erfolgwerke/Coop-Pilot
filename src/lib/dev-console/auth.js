import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "coopilot-dev-console";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.DEV_CONSOLE_SESSION_SECRET || process.env.DEV_CONSOLE_PASSWORD;
  if (!value || value.length < 8) throw new Error("DEV_CONSOLE_PASSWORD is not configured");
  return value;
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyDevPassword(password) {
  const configured = process.env.DEV_CONSOLE_PASSWORD || "";
  return configured.length >= 8 && safeEqual(password, configured);
}

export function createDevSessionValue() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyDevSessionValue(value) {
  if (!value || typeof value !== "string") return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(parsed.exp) > Date.now();
  } catch {
    return false;
  }
}

export async function requireDevSession() {
  const store = await cookies();
  if (!verifyDevSessionValue(store.get(COOKIE_NAME)?.value)) {
    const error = new Error("DEV_UNAUTHORIZED");
    error.status = 401;
    throw error;
  }
}

export function setDevSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, createDevSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearDevSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

