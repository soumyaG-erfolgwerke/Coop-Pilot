import { NextResponse } from "next/server";
import {
  createAdminClient,
  OTP_FUNCTION_ID,
} from "@/lib/appwrite-server";
import { verifyCaptcha } from "@/lib/captcha/provider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseFunctionResponse(execution) {
  let data = {};
  try {
    data = execution.responseBody ? JSON.parse(execution.responseBody) : {};
  } catch {
    data = {};
  }

  const status = Number(execution.responseStatusCode || 500);
  return { data, status };
}

async function executeOtpFunction(method, payload) {
  const { functions } = createAdminClient();
  const execution = await functions.createExecution({
    functionId: OTP_FUNCTION_ID,
    body: JSON.stringify(payload),
    async: false,
    xpath: "/",
    method,
    headers: { "content-type": "application/json" },
  });

  return parseFunctionResponse(execution);
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

// POST /api/forget-password/otp - Send OTP to email
export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const captchaToken = typeof body.captchaToken === "string" ? body.captchaToken : "";

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json(
        { success: false, error: "A valid email is required" },
        { status: 400 }
      );
    }
    if (process.env.NODE_ENV === "production" && !(await verifyCaptcha(captchaToken))) {
      return NextResponse.json(
        { success: false, error: "CAPTCHA verification failed" },
        { status: 400 },
      );
    }

    const { data, status } = await executeOtpFunction("POST", { email });

    if (status >= 200 && status < 300) {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to send OTP" },
        { status: status >= 400 && status < 500 ? status : 502 }
      );
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

// PUT /api/forget-password/otp - Verify OTP
export async function PUT(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!EMAIL_PATTERN.test(email) || email.length > 254 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const { data, status } = await executeOtpFunction("PUT", { email, otp });

    if (status >= 200 && status < 300 && typeof data.reset_token === "string") {
      return NextResponse.json({
        success: true,
        reset_token: data.reset_token,
        message: "OTP verified successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || "Invalid OTP" },
        { status: status >= 400 && status < 500 ? status : 502 }
      );
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

// PATCH /api/forget-password/otp - Reset password with reset_token
export async function PATCH(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const reset_token = typeof body.reset_token === "string" ? body.reset_token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (
      !EMAIL_PATTERN.test(email) ||
      email.length > 254 ||
      reset_token.length < 16 ||
      reset_token.length > 4096 ||
      password.length < 8 ||
      password.length > 256
    ) {
      return NextResponse.json(
        { success: false, error: "Email, reset_token, and password are required" },
        { status: 400 }
      );
    }

    const { data, status } = await executeOtpFunction("PATCH", {
      email,
      reset_token,
      password,
    });

    if (status >= 200 && status < 300) {
      return NextResponse.json({
        success: true,
        message: "Password reset successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to reset password" },
        { status: status >= 400 && status < 500 ? status : 502 }
      );
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
