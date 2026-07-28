import { NextResponse } from "next/server";
import {
  OTP_FUNCTION_ENDPOINT,
  PROJECT_ID,
} from "@/lib/appwrite-server";

const apiKey = process.env.APPWRITE_API_KEY;

// POST /api/forget-password/otp - Send OTP to email
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const response = await fetch(OTP_FUNCTION_ENDPOINT, {
      method: "POST",
      headers: {
        "x-appwrite-key": apiKey,
        "Content-Type": "application/json",
        "x-appwrite-project": PROJECT_ID,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to send OTP" },
        { status: response.status }
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
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const response = await fetch(OTP_FUNCTION_ENDPOINT, {
      method: "PUT",
      headers: {
        "x-appwrite-key": apiKey,
        "Content-Type": "application/json",
        "x-appwrite-project": PROJECT_ID,
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        reset_token: data.reset_token,
        message: "OTP verified successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || "Invalid OTP" },
        { status: response.status }
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
    const { email, reset_token, password } = await request.json();

    if (!email || !reset_token || !password) {
      return NextResponse.json(
        { success: false, error: "Email, reset_token, and password are required" },
        { status: 400 }
      );
    }

    const response = await fetch(OTP_FUNCTION_ENDPOINT, {
      method: "PATCH",
      headers: {
        "x-appwrite-key": apiKey,
        "Content-Type": "application/json",
        "x-appwrite-project": PROJECT_ID,
      },
      body: JSON.stringify({ email, reset_token, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Password reset successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || "Failed to reset password" },
        { status: response.status }
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
