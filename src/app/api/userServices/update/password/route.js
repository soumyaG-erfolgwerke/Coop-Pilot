import { NextResponse } from "next/server";
import { appwriteFetchWithSession } from "@/lib/appwrite-server";
import { validatePassword } from "@/helpers/passwordValidator";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

// POST /api/userServices/update/password
export async function POST(request) {
  try {
    const session = await resolveSession();
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { oldPassword, newPassword, captchaToken } = body;

    if (!captchaToken && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Captcha token is required" },
        { status: 400 },
      );
    }

    if (process.env.NODE_ENV === "production") {
      const ok = await verifyCaptcha(captchaToken);
      console.log("Captcha verification result:", ok);
      if (!ok) {
        return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
      }
    }

    if (typeof oldPassword !== "string" || typeof newPassword !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid password format" },
        { status: 400 },
      );
    }

    const oldP = oldPassword.trim();
    const newP = newPassword.trim();

    if (!oldP || !newP) {
      return NextResponse.json(
        { success: false, error: "Old password and new password are required" },
        { status: 400 },
      );
    }

    if (oldP === newP) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be different from old password",
        },
        { status: 400 },
      );
    }

    if (newP.length > 128) {
      return NextResponse.json(
        { success: false, error: "Password must not exceed 128 characters" },
        { status: 400 },
      );
    }

    const passwordErrors = validatePassword(newP);
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must include " + passwordErrors.join(", "),
        },
        { status: 400 },
      );
    }

    const updateRes = await appwriteFetchWithSession(session.secret, "/account/password", {
      method: "PATCH",
      body: JSON.stringify({ password: newP, oldPassword: oldP }),
    });
    if (!updateRes.ok) {
      return NextResponse.json({ success: false, error: "Current password is incorrect or update was rejected" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Password updated",
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Password update error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
