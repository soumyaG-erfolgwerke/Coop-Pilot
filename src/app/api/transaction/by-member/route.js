import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireMemberSelf } from "@/lib/auth/transaction-access";

// GET /api/transaction/by-member?memberId= - Get transactions by member ID
export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: "memberId is required" },
        { status: 400 }
      );
    }
    requireMemberSelf(session, memberId);

    const { databases } = createAdminClient();

    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      [
        Query.equal("memberId", memberId),
        Query.orderDesc("time"),
      ]
    );

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to fetch transactions for memberId:`, error);
    return NextResponse.json({ success: false, transactions: null }, { status: 500 });
  }
}
