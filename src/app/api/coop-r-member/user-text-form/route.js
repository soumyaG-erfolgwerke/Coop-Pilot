import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_USERTEXTFORM } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopMembership } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

// GET /api/coop-r-member/user-text-form - Retrieve sign and place for user declaration
export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const coopId = searchParams.get("coopId");

    if (!userId || !coopId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId and coopId are required." },
        { status: 400 }
      );
    }
    await requireCoopMembership(session, coopId, userId);

    const { databases } = createAdminClient();

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_USERTEXTFORM,
      [
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.orderDesc("$createdAt")
      ]
    );

    if (result.documents.length === 0) {
      return NextResponse.json({ success: true, form: null });
    }

    return NextResponse.json({ success: true, form: result.documents[0] });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching userTextForm:", error);
    return NextResponse.json({ success: false, error: safePublicError(error)}, { status: 500 });
  }
}

// POST /api/coop-r-member/user-text-form - Save sign and place for user declaration
export async function POST(request) {
  try {
    const session = await resolveSession();
    const { userId, coopId, sign, place } = await request.json();

    if (!userId || !coopId || !sign) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, coopId, and sign are required." },
        { status: 400 }
      );
    }
    await requireCoopMembership(session, coopId, userId);
    if (typeof sign !== "string" || sign.length > 5000 || (place && (typeof place !== "string" || place.length > 200))) {
      return NextResponse.json({ success: false, error: "Invalid declaration data" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const newForm = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_USERTEXTFORM,
      ID.unique(),
      {
        userId,
        coopId,
        sign,
        place: place || null
      }
    );

    return NextResponse.json({ success: true, form: newForm });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error creating userTextForm:", error);
    return NextResponse.json({ success: false, error: safePublicError(error)}, { status: 500 });
  }
}

