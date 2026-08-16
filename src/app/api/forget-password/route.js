import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";

// POST /api/forget-password - Create password recovery email
export async function POST(request) {
  try {
    const { email, captchaToken } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    if (process.env.NODE_ENV === "production" && !(await verifyCaptcha(captchaToken))) {
      return NextResponse.json(
        { success: false, status: 400, message: "CAPTCHA verification failed" },
        { status: 400 },
      );
    }

    const { account } = createAdminClient();

    await account.createRecovery({
      email: email,
      url: `${process.env.DEPLOYMENT_URL}/signinpage?recoverPassword=true`,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Recovery email sent successfully",
    });
  } catch (error) {
    console.error("Error creating recovery:", error);
    return NextResponse.json({
      success: true,
      status: 200,
      message: "If the account exists, a recovery email has been sent",
    });
  }
}

// PUT /api/forget-password - Update password with recovery token
export async function PUT(request) {
  try {
    const { userId, secret, newPassword, captchaToken } = await request.json();

    if (!userId || !secret || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "userId, secret, and newPassword are required",
        },
        { status: 400 },
      );
    }

    if (!captchaToken && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Captcha token is required" },
        { status: 400 },
      );
    }

    if (process.env.NODE_ENV === "production") {
      const ok = await verifyCaptcha(captchaToken);
      if (!ok) {
        return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
      }
    }

    const { account } = createAdminClient();

    await account.updateRecovery(userId, secret, newPassword);

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { success: false, status: 500, message: "Error updating password" },
      { status: 500 },
    );
  }
}
