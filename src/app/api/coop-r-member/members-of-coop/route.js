import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createAdminClient, DATABASE_ID,
    COLLECTION_ID_TRANSACTION, COLLECTION_ID_PROFILE,
    COLLECTION_ID_COOPXMEMBER, COLLECTION_ID_COOPERATIVES,
    COLLECTION_ID_KYC_APPLICATIONS
} from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";

// GET /api/coop-r-member/members-of-coop?coopId= - Get members of a coop with their share totals
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
        await requireCoopAdministration(session, coopId);

        const { databases } = createAdminClient();

        // Get verified transactions for the coop
        const transactions = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_COOPXMEMBER,
            [
                Query.equal("coopId", coopId),
                Query.equal("status", ["Active", "NoticeGiven"]),
                Query.orderDesc("$createdAt"),
            ]
        );

        //fetching the share price

        const data = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_ID_COOPERATIVES,
            coopId,
            [
                Query.select(["sharePrice"])
            ]
        );


        // Group by member
        const grouped = {};
        for (const tx of transactions.documents) {
            const id = tx.userId;
            if (!id) continue;
            if (!grouped[id]) {
                grouped[id] = {
                    totalShares: 0,
                    totalPrice: 0,
                };
            }
            const sharesCount = tx.shares || 0;
            grouped[id].totalShares += sharesCount;
            grouped[id].totalPrice += sharesCount * data.sharePrice;
        }

        // 3. Batch fetch KYC status and Profiles for all members
        const memberIds = Object.keys(grouped);
        let kycMap = {};
        let profileMap = {};

        if (memberIds.length > 0) {
            try {
                const kycResults = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_ID_KYC_APPLICATIONS,
                    [
                        Query.equal("userId", memberIds),
                        Query.orderDesc("$createdAt"),
                        Query.limit(5000)
                    ]
                );

                // Group KYC documents by userId
                const kycDocsByUser = {};
                kycResults.documents.forEach(doc => {
                    if (!kycDocsByUser[doc.userId]) {
                        kycDocsByUser[doc.userId] = [];
                    }
                    kycDocsByUser[doc.userId].push(doc);
                });

                // Map the correct KYC status for each member
                memberIds.forEach(userId => {
                    const userDocs = kycDocsByUser[userId] || [];
                    if (userDocs.length > 0) {
                        const sortedDocs = [...userDocs].sort((a, b) => {
                            const dateA = new Date(a.$createdAt || a.createdAt || 0);
                            const dateB = new Date(b.$createdAt || b.createdAt || 0);
                            return dateB - dateA;
                        });
                        // Find the first (newest) document that is either coop-specific or global/legacy
                        const matchedDoc = sortedDocs.find(d =>
                            (d.coopId === coopId || (d.coopId && d.coopId.$id === coopId)) ||
                            (!d.coopId || (d.coopId && typeof d.coopId === 'object' && !d.coopId.$id))
                        );
                        if (matchedDoc) {
                            kycMap[userId] = matchedDoc.kycStatus;
                        }
                    }
                });

                // Fetch profiles for names and emails
                const profileResults = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_ID_PROFILE,
                    [
                        Query.equal("userId", memberIds)
                    ]
                );

                profileResults.documents.forEach(doc => {
                    profileMap[doc.userId] = {
                        name: `${doc.FirstName || ""} ${doc.LastName || ""}`.trim(),
                        email: doc.contactEmail || doc.email || ""
                    };
                });
            } catch (err) {
                console.error("Batch Fetch Error:", err);
            }
        }

        // Build result with merged data
        const result = memberIds.map((memberId) => ({
            userId: memberId,
            membername: profileMap[memberId]?.name || "Unknown",
            memberemail: profileMap[memberId]?.email || "Unknown",
            totalShares: grouped[memberId].totalShares,
            totalPrice: grouped[memberId].totalPrice,
            kycStatus: kycMap[memberId] || "PENDING", // Default to PENDING if no record exists yet
        }));

        return NextResponse.json({ success: true, members: result });
    } catch (error) {
        if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
        console.error("Failed to fetch members for coop:", error);
        return NextResponse.json({ success: false, members: [] }, { status: 500 });
    }
}
