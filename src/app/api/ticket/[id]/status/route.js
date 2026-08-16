import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TICKETS } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

const STATUSES = ["Issued", "InProgress", "InReview", "Completed", "Cancelled"];

// PATCH /api/ticket/[id]/status - Update ticket status
export async function PATCH(request, { params }) {
  try {
    const session = requireRole(await resolveSession(), ["coopadmin", "superuser"]);
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
    const existingTicket = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id,
    );
    const coopId = existingTicket.forCoop?.$id || existingTicket.forCoop;
    if (session.role === "coopadmin") {
      if (!coopId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      await ensureCoopAdminAccess(coopId);
    }

    const ticket = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id,
      { status }
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error(`Error updating ticket status:`, error);
    return NextResponse.json({ success: false, ticket: null }, { status: 500 });
  }
}
