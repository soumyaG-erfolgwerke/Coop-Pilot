import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  getSessionSecret,
} from "@/lib/auth/session";
import { appwriteFetchWithSession } from "@/lib/appwrite-server";

export async function POST() {
  const cookieStore = await cookies();
  try {
    const secret = await getSessionSecret();
    if (secret) {
      await appwriteFetchWithSession(secret, "/account/sessions/current", {
        method: "DELETE",
      });
    }
  } catch {
    // Logout remains successful locally even if the provider session is
    // already expired or unavailable.
  } finally {
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
