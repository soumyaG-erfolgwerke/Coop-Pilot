import { NextResponse } from "next/server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

// GET /api/coopAdminSignUp/checkEmailValidation - Check current user's email validation status
export async function GET() {
  try {
    const session = await resolveSession({ requireProfile: false });

    return NextResponse.json({
      success: true,
      isEmailVerified: session.account.emailVerification === true,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error checking email validation:", error);
    return NextResponse.json(
      { success: false, error: "Could not check email validation" },
      { status: 500 }
    );
  }
}
