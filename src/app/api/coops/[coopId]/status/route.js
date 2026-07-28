import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";

// PATCH /api/coops/[coopId]/status - Update cooperative status
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    const { status: newStatus } = await request.json();

    if (!coopId || !newStatus) {
      return NextResponse.json(
        { error: "Cooperative ID and status are required" },
        { status: 400 }
      );
    }

    if (!["active", "inactive", "pending"].includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active', 'inactive', or 'pending'" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      { status: newStatus }
    );

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error(`Failed to update cooperative status:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
