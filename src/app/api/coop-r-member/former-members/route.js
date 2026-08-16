import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
    createAdminClient, DATABASE_ID,
    COLLECTION_ID_PROFILE,
    COLLECTION_ID_COOPXMEMBER
} from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";

// GET /api/coop-r-member/former-members?coopId= - Get former members of a coop with exitDate
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

        // Get former members from coopXmember for the coop
        const formerMembersResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_COOPXMEMBER,
            [
                Query.equal("coopId", coopId),
                Query.equal("status", "Former"),
                Query.orderDesc("$createdAt"),
                Query.limit(5000)
            ]
        );

        const memberIds = formerMembersResult.documents
            .map(doc => doc.userId)
            .filter(id => !!id);

        let profileMap = {};

        if (memberIds.length > 0) {
            try {
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
                console.error("Batch Fetch Profiles Error:", err);
            }
        }

        // Build result with merged data
        const result = formerMembersResult.documents.map((doc) => {
            const memberId = doc.userId;
            return {
                userId: memberId,
                membername: profileMap[memberId]?.name || "Unknown",
                memberemail: profileMap[memberId]?.email || "Unknown",
                exitDate: doc.exitDate || null,
                status: doc.status
            };
        });

        return NextResponse.json({ success: true, members: result });
    } catch (error) {
        if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
        console.error("Failed to fetch former members for coop:", error);
        return NextResponse.json({ success: false, members: [] }, { status: 500 });
    }
}
