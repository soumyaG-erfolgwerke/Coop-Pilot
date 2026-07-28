import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appwriteFetchWithSession } from "@/lib/appwrite-server";

// GET /api/coopAdminSignUp/checkEmailValidation - Check current user's email validation status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const parsed = JSON.parse(sessionCookie.value);
    const cookieValue = parsed.cookieValue || parsed.secret;

    if (!cookieValue) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 }
      );
    }

    const res = await appwriteFetchWithSession(cookieValue, "/account");

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to get account");
    }

    const user = await res.json();

    return NextResponse.json({
      success: true,
      isEmailVerified: user.emailVerification || false,
    });
  } catch (error) {
    console.error("Error checking email validation:", error);
    return NextResponse.json(
      { success: false, error: "Could not check email validation" },
      { status: 500 }
    );
  }
}
