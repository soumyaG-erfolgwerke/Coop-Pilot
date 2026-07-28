import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TICKETS } from "@/lib/appwrite-server";

const STATUSES = ["Issued", "InProgress", "InReview", "Completed", "Cancelled"];

// PATCH /api/ticket/[id]/status - Update ticket status
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    if (!STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}. Allowed: ${STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const ticket = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id,
      { status }
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error(`Error updating ticket status:`, error);
    return NextResponse.json({ success: false, ticket: null }, { status: 500 });
  }
}
