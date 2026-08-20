import { NextResponse } from "next/server";
import { clearDevSessionCookie, requireDevSession, setDevSessionCookie, verifyDevPassword } from "@/lib/dev-console/auth";

const ATTEMPTS_KEY = Symbol.for("coopilot.dev.auth.attempts");
const attempts = globalThis[ATTEMPTS_KEY] || new Map();
globalThis[ATTEMPTS_KEY] = attempts;

export async function GET() {
  try { await requireDevSession(); return NextResponse.json({ authenticated: true }); }
  catch { return NextResponse.json({ authenticated: false }, { status: 401 }); }
}

export async function POST(request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = request.headers.get("x-real-ip") || forwarded || "unknown";
  const now = Date.now();
  const state = attempts.get(key) || { count: 0, resetAt: now + 15 * 60_000 };
  if (now >= state.resetAt) { state.count = 0; state.resetAt = now + 15 * 60_000; }
  if (state.count >= 8) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const { password } = await request.json().catch(() => ({}));
  if (!verifyDevPassword(password)) {
    state.count += 1; attempts.set(key, state);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  attempts.delete(key);
  const response = NextResponse.json({ authenticated: true });
  setDevSessionCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearDevSessionCookie(response);
  return response;
}
