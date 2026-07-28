import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appwriteFetchWithSession } from "@/lib/appwrite-server";

// POST /api/coopAdminSignUp/verification/phone - Create phone verification
export async function POST() {
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
        { success: false, error: "No session found - please log in again" },
        { status: 401 }
      );
    }

    const response = await appwriteFetchWithSession(
      cookieValue,
      "/account/verifications/phone",
      { method: "POST" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Appwrite phone verification error:", errorData);
      throw new Error(errorData.message || "Failed to create phone verification");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating phone verification:", error);
    return NextResponse.json(
      { success: false, error: "Could not create phone verification" },
      { status: 500 }
    );
  }
}

// PUT /api/coopAdminSignUp/verification/phone - Update/confirm phone verification
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
      "/account/verifications/phone",
      {
        method: "PUT",
        body: JSON.stringify({ userId, secret }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.message || "Failed to verify phone" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying phone:", error);
    return NextResponse.json(
      { success: false, error: "Could not verify phone" },
      { status: 500 }
    );
  }
}
