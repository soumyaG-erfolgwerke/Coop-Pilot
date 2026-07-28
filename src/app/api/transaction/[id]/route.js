import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";

// PUT /api/transaction/[id] - Update transaction
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updatedTransaction = await request.json();

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
    console.error("Error updating transaction:", error);
    return NextResponse.json({ success: false, transaction: null }, { status: 500 });
  }
}
