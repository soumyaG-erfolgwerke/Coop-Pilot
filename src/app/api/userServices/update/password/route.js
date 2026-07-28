import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient, createPublicClient } from "@/lib/appwrite-server";
import { validatePassword } from "@/helpers/passwordValidator";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";

// POST /api/userServices/update/password
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    let { oldPassword, newPassword, captchaToken } = body;

    if (!captchaToken && process.env.NEXT_PUBLIC_NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Captcha token is required" },
        { status: 400 },
      );
    }

    if (process.env.NEXT_PUBLIC_NODE_ENV === "production") {
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

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 },
      );
    }

    const { cookieValue, userId } = sessionData;

    if (cookieValue) {
      try {
        const { appwriteFetchWithSession } =
          await import("@/lib/appwrite-server");

        const accRes = await appwriteFetchWithSession(cookieValue, "/account");

        if (accRes.ok) {
          const updateRes = await appwriteFetchWithSession(
            cookieValue,
            "/account/password",
            {
              method: "PATCH",
              body: JSON.stringify({
                password: newP,
                oldPassword: oldP,
              }),
            },
          );

          if (!updateRes.ok) {
            let errMsg = "Password update failed";
            try {
              const err = await updateRes.json();
              errMsg = err.message || errMsg;
            } catch {}

            return NextResponse.json(
              { success: false, error: errMsg },
              { status: 400 },
            );
          }

          return NextResponse.json({
            success: true,
            message: "Password updated",
          });
        }
      } catch {}
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Session expired. Please log in again." },
        { status: 401 },
      );
    }

    const { users } = createAdminClient();
    const userInfo = await users.get(userId);

    const { account: publicAccount } = createPublicClient();

    try {
      const tempSession = await publicAccount.createEmailPasswordSession(
        userInfo.email,
        oldP,
      );

      try {
        await users.deleteSession(userId, tempSession.$id);
      } catch {}
    } catch {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    await users.updatePassword(userId, newP);

    return NextResponse.json({
      success: true,
      message: "Password updated",
    });
  } catch (error) {
    console.error("Password update error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
