import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOP_PLATFORM_REGISTRY } from "@/lib/appwrite-server";

// PATCH /api/coopAdminSignUp/approve/[id] - Approve coop
export async function PATCH(request, { params }) {
  try {
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
    console.error("Error approving coop:", error);
    return NextResponse.json(
      { success: false, error: "Could not approve coop" },
      { status: 500 }
    );
  }
}
