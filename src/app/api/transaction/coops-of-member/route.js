import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION, COLLECTION_ID_COOPERATIVES } from "@/lib/appwrite-server";

// GET /api/transaction/coops-of-member?memberId= - Get coops of a member with their share totals
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

    // Get verified transactions for the member
    const transactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      [
        Query.equal("memberId", memberId),
        Query.equal("verificationStatus", "verified"),
        Query.orderDesc("time"),
      ]
    );

    // Group by coop
    const grouped = {};
    for (const tx of transactions.documents) {
      const id = tx.coopId;
      if (!grouped[id]) {
        grouped[id] = {
          totalShares: 0,
          totalPrice: 0,
        };
      }
      grouped[id].totalShares += tx.shares;
      grouped[id].totalPrice += tx.price;
    }

    // Fetch coop details for each coopId
    const result = [];
    for (const coopId of Object.keys(grouped)) {
      try {
        const coop = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_COOPERATIVES,
          coopId
        );
        result.push({
          coopId,
          name: coop.name,
          totalShares: grouped[coopId].totalShares,
          totalPrice: grouped[coopId].totalPrice,
        });
      } catch (err) {
        console.warn(`Could not fetch coop ${coopId}`, err);
        // Still include the coop even without name
        result.push({
          coopId,
          name: "Unknown",
          totalShares: grouped[coopId].totalShares,
          totalPrice: grouped[coopId].totalPrice,
        });
      }
    }

    return NextResponse.json({ success: true, coops: result });
  } catch (error) {
    console.error("Failed to fetch coops for member:", error);
    return NextResponse.json({ success: false, coops: [] }, { status: 500 });
  }
}
