import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCooperativeAccess, requireMemberSelf } from "@/lib/auth/transaction-access";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const coopId = searchParams.get("coopId");

    if (!userId || !coopId) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }
    if (session.userId === userId || session.role === "superuser") {
      requireMemberSelf(session, userId);
    } else {
      await requireCooperativeAccess(session, coopId);
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
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Error fetching transaction status:", error);
    return NextResponse.json({ success: false, error: safePublicError(error)}, { status: 500 });
  }
}
