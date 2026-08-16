import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOPERATIVES } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopMembership } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 }
      );
    }
    await requireCoopMembership(session, coopId);

    const { databases } = createAdminClient();

    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    return NextResponse.json({ success: true, name: coop.name });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to fetch cooperative name:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 }
    );
  }
}
