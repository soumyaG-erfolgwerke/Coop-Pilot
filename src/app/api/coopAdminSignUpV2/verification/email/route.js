import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appwriteFetchWithSession } from "@/lib/appwrite-server";

// POST /api/coopAdminSignUp/verification/email - Create email verification
export async function POST(request) {
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
        { success: false, error: "No session cookie found - please log in again" },
        { status: 401 }
      );
    }

    // Use the Cookie header to authenticate (not X-Appwrite-Session)
    // Appwrite only accepts session auth via Cookie or X-Fallback-Cookies headers
    const response = await appwriteFetchWithSession(
      cookieValue,
      "/account/verifications/email",
      {
        method: "POST",
        body: JSON.stringify({
          url: `${process.env.DEPLOYMENT_URL}/verify`,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Appwrite verification error:", errorData);
      throw new Error(errorData.message || "Failed to create verification");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Verification email sent successfully" 
    });
  } catch (error) {
    console.error("Error creating email verification:", error);
    return NextResponse.json(
      { success: false, error: "Could not send verification email" },
      { status: 500 }
    );
  }
}

// PUT /api/coopAdminSignUp/verification/email - Update/confirm email verification
export async function PUT(request) {
  try {
    const { userId, secret } = await request.json();

    if (!userId || !secret) {
      return NextResponse.json(
        { success: false, error: "userId and secret are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const parsedPut = JSON.parse(sessionCookie.value);
    const cookieValue = parsedPut.cookieValue || parsedPut.secret;

    const response = await appwriteFetchWithSession(
      cookieValue,
      "/account/verifications/email",
      {
        method: "PUT",
        body: JSON.stringify({ userId, secret }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Appwrite verification update error:", errorData);
      throw new Error(errorData.message || "Failed to verify email");
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { success: false, error: "Could not verify email", verified: false },
      { status: 500 }
    );
  }
}
