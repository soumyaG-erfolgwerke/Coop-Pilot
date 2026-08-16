import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCooperativeAccess } from "@/lib/auth/transaction-access";

// GET /api/transaction/verified/by-coop?coopId= - Get verified transactions by coop ID
export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 }
      );
    }
    await requireCooperativeAccess(session, coopId);

    const { databases } = createAdminClient();

    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      [
        Query.equal("coopId", coopId),
        Query.equal("verificationStatus", "verified"),
        Query.orderDesc("time"),
      ]
    );

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error(`Failed to fetch verified transactions for coopId:`, error);
    return NextResponse.json({ success: false, transactions: null }, { status: 500 });
  }
}
