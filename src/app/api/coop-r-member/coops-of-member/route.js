import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOPXMEMBER, COLLECTION_ID_COOPERATIVES } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireMemberIdentity } from "@/lib/auth/membership-access";

// GET /api/coop-r-member/coops-of-member?memberId= - Get coops of a member with their share totals
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
    requireMemberIdentity(session, memberId);

    const { databases } = createAdminClient();

    // Get verified memberships for the member
    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [
        Query.equal("userId", memberId),
        Query.equal("status", ["Active", "NoticeGiven"]),
        Query.orderDesc("$createdAt"),
        Query.limit(5000),
      ]
    );

    // Group by coop
    const grouped = {};
    for (const tx of transactions.documents) {
      const id = tx.coopId;
      if (!id) continue;
      if (!grouped[id]) {
        grouped[id] = {
          totalShares: 0,
          statuses: new Set(),
        };
      }
      const sharesCount = tx.shares || 0;
      grouped[id].totalShares += sharesCount;
      if (tx.status) {
        grouped[id].statuses.add(tx.status);
      }
    }

    // Fetch coop details for all coopIds in a single batch query
    const coopIds = Object.keys(grouped);
    let coopMap = {};

    if (coopIds.length > 0) {
      try {
        const coopResults = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_COOPERATIVES,
          [
            Query.equal("$id", coopIds)
          ]
        );
        coopResults.documents.forEach((coop) => {
          coopMap[coop.$id] = {
            name: coop.name,
            sharePrice: coop.sharePrice || 0,
          };
        });
      } catch (err) {
        console.error("Batch Coop Fetch Error:", err);
      }
    }

    const result = coopIds.map((coopId) => {
      const coopInfo = coopMap[coopId];
      const totalShares = grouped[coopId].totalShares;
      const sharePrice = coopInfo?.sharePrice || 0;
      const statuses = Array.from(grouped[coopId].statuses);
      const overallStatus = statuses.includes("Active") ? "Active" : "NoticeGiven";
      return {
        coopId,
        name: coopInfo?.name || "Unknown",
        totalShares: totalShares,
        totalPrice: totalShares * sharePrice,
        status: overallStatus,
      };
    });

    return NextResponse.json({ success: true, coops: result });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to fetch coops for member:", error);
    return NextResponse.json({ success: false, coops: [] }, { status: 500 });
  }
}
