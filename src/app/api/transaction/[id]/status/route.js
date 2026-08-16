import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

const ALLOWED_STATUSES = ["pending", "verified", "rejected", "cancelled"];

// PATCH /api/transaction/[id]/status - Update transaction status
export async function PATCH(request, { params }) {
  try {
    const session = requireRole(await resolveSession(), ["coopadmin", "superuser"]);
    const { id } = await params;
    const { status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction status" },
        { status: 422 }
      );
    }

    const { databases } = createAdminClient();
    const transaction = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      id,
    );
    const coopId = transaction.coopId?.$id || transaction.coopId;
    if (session.role !== "superuser") {
      if (!coopId) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      await ensureCoopAdminAccess(coopId);
    }

    const currentStatus = transaction.verificationStatus || "pending";
    if (currentStatus === status) {
      return NextResponse.json({ success: true, transaction });
    }
    if (currentStatus !== "pending") {
      return NextResponse.json(
        { success: false, error: "Finalized transaction status cannot be changed" },
        { status: 409 },
      );
    }

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      id,
      { verificationStatus: status }
    );

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Failed to update transaction status:", error);
    return NextResponse.json({ success: false, transaction: null }, { status: 500 });
  }
}
