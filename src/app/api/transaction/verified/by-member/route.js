import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";

// GET /api/transaction/verified/by-member?memberId= - Get verified transactions by member ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: "memberId is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      [
        Query.equal("memberId", memberId),
        Query.equal("verificationStatus", "verified"),
        Query.orderDesc("time"),
      ]
    );

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error(`Failed to fetch verified transactions for memberId:`, error);
    return NextResponse.json({ success: false, transactions: null }, { status: 500 });
  }
}
