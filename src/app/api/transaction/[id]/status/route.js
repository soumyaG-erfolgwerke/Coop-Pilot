import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";

// PATCH /api/transaction/[id]/status - Update transaction status
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      id,
      { verificationStatus: status }
    );

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error("Failed to update transaction status:", error);
    return NextResponse.json({ success: false, transaction: null }, { status: 500 });
  }
}
