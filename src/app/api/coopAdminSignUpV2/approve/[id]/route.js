import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOP_PLATFORM_REGISTRY } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";

// PATCH /api/coopAdminSignUp/approve/[id] - Approve coop
export async function PATCH(request, { params }) {
  try {
    requireRole(await resolveSession(), ["superuser"]);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coop ID is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const updatedCoop = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOP_PLATFORM_REGISTRY,
      id,
      { isPending: false }
    );

    return NextResponse.json({ success: true, document: updatedCoop });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    console.error("Error approving coop:", error);
    return NextResponse.json(
      { success: false, error: "Could not approve coop" },
      { status: 500 }
    );
  }
}
