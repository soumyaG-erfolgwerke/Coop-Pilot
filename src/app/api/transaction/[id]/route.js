import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { boundedText, validateStrictObject } from "@/lib/validation/strict-object";

// PUT /api/transaction/[id] - Update transaction
export async function PUT(request, { params }) {
  try {
    requireRole(await resolveSession(), ["superuser"]);
    const { id } = await params;
    const input = await request.json();
    const shape = validateStrictObject(input, ["metadata", "buyFor"], { maxBytes: 4096, requireAtLeastOne: true });
    if (!shape.ok) return NextResponse.json({ success: false, error: shape.error }, { status: 400 });
    const metadata = boundedText(input.metadata, { max: 2000 });
    const buyFor = boundedText(input.buyFor, { max: 100 });
    if (metadata === null || buyFor === null) return NextResponse.json({ success: false, error: "Invalid transaction fields" }, { status: 422 });
    const updatedTransaction = {
      ...(metadata !== undefined ? { metadata } : {}),
      ...(buyFor !== undefined ? { buyFor } : {}),
    };
    if (Object.keys(updatedTransaction).length === 0) {
      return NextResponse.json({ success: false, error: "No permitted fields" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      id,
      updatedTransaction
    );

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error updating transaction:", error);
    return NextResponse.json({ success: false, transaction: null }, { status: 500 });
  }
}
