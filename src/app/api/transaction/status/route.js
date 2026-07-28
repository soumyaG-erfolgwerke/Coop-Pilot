import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const coopId = searchParams.get("coopId");

    if (!userId || !coopId) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      [
        Query.equal("memberId", userId),
        Query.equal("coopId", coopId),
        Query.orderDesc("$createdAt"), // to get the latest
        Query.limit(1)
      ]
    );

    return NextResponse.json({ success: true, transaction: transactions.documents[0] || null });
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
