import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ONBOARDED_MEMBERS,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_COOPXMEMBER,
} from "@/lib/appwrite-server";
import { resolveSession } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";

// Helper to authenticate user and get user profile
async function getAuthenticatedUser() {
  try {
    const session = await resolveSession();
    if (session.isTeamMember) return null;
    return { userId: session.userId, profile: session.profile };
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const { databases } = createAdminClient();
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const email = auth.profile.contactEmail || auth.profile.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "User email not found in profile" },
        { status: 400 },
      );
    }

    // Query COLLECTION_ID_ONBOARDED_MEMBERS for records with this email and hasOnboarded === false
    const onboardedMembersResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ONBOARDED_MEMBERS,
      [Query.equal("memberEmail", email), Query.equal("hasOnboarded", false)],
    );

    const onboardingRecords = await Promise.all(
      onboardedMembersResult.documents.map(async (doc) => {
        let coopName = "Unknown Cooperative";
        try {
          const coopDoc = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_ID_COOPERATIVES,
            doc.coopId,
          );
          coopName = coopDoc.name || coopName;
        } catch (err) {
          console.error(
            `Failed to fetch cooperative for coopId: ${doc.coopId}`,
            err,
          );
        }

        return {
          $id: doc.$id,
          coopId: doc.coopId,
          coopName,
          membershipId: doc.membershipId || "",
          shares: doc.shares || 0,
          joinedDate: doc.joinedDate || doc.$createdAt,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: onboardingRecords,
    });
  } catch (error) {
    console.error("Error in member onboarding GET route:", error);
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to fetch onboarding list"),
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { databases } = createAdminClient();
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const email = auth.profile.contactEmail || auth.profile.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "User email not found in profile" },
        { status: 400 },
      );
    }

    const { coopIds } = await request.json();
    if (!coopIds || !Array.isArray(coopIds) || coopIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No cooperatives selected to onboard" },
        { status: 400 },
      );
    }

    const processedResults = await Promise.allSettled(
      coopIds.map(async (coopId) => {
        try {
          // 1. Query COLLECTION_ID_ONBOARDED_MEMBERS for the matching record
          const preOnboardResult = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_ONBOARDED_MEMBERS,
            [
              Query.equal("coopId", coopId),
              Query.equal("memberEmail", email),
              Query.equal("hasOnboarded", false),
            ],
          );

          if (preOnboardResult.documents.length === 0) {
            return null; // Skip
          }

          const preOnboardDoc = preOnboardResult.documents[0];
          const shares = preOnboardDoc.shares || 0;
          const membershipId = preOnboardDoc.membershipId || "";
          const joinedDate =
            preOnboardDoc.joinedDate || preOnboardDoc.$createdAt;

          // 2. Update or create COLLECTION_ID_COOPXMEMBER
          const existingMembers = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID_COOPXMEMBER,
            [
              Query.equal("userId", auth.userId),
              Query.equal("coopId", coopId),
              Query.orderDesc("$createdAt"),
              Query.limit(1),
            ],
          );

          const utcJoinedDate = new Date(joinedDate).toISOString();

          if (existingMembers.documents.length > 0) {
            const memberDoc = existingMembers.documents[0];
            if (memberDoc.status !== "Active") {
              return null; // Skip or report warning
            }
            const currentShares = memberDoc.shares || 0;
            // const currentHistory = [];
            // try {
            //   if (memberDoc.historyJson) {
            //     const parsed = JSON.parse(memberDoc.historyJson);
            //     if (Array.isArray(parsed)) {
            //       currentHistory.push(...parsed);
            //     }
            //   }
            // } catch (e) {
            //   console.error("Failed to parse historyJson", e);
            // }

            // const historyJson = JSON.stringify([
            //   ...currentHistory,
            //   { status: "Active", changedAt: utcJoinedDate }
            // ]);

            await databases.updateDocument(
              DATABASE_ID,
              COLLECTION_ID_COOPXMEMBER,
              memberDoc.$id,
              {
                status: "Active",
                // membershipId: membershipId || memberDoc.membershipId || "",
                shares: currentShares + shares,
                // historyJson
              },
            );
          } else {
            const historyJson = JSON.stringify([
              { status: "Active", changedAt: utcJoinedDate },
            ]);

            await databases.createDocument(
              DATABASE_ID,
              COLLECTION_ID_COOPXMEMBER,
              ID.unique(),
              {
                userId: auth.userId,
                coopId,
                status: "Active",
                membershipId: membershipId || "",
                shares: shares,
                historyJson,
              },
            );

            //! Increment totalMember for the Cooperative @Kunal25Das
            // try {
            //   const coopDoc = await databases.getDocument(
            //     DATABASE_ID,
            //     COLLECTION_ID_COOPERATIVES,
            //     coopId,
            //   );
            //   const currentTotalMember = coopDoc.totalMember || 0;
            //   await databases.updateDocument(
            //     DATABASE_ID,
            //     COLLECTION_ID_COOPERATIVES,
            //     coopId,
            //     {
            //       totalMember: currentTotalMember + 1,
            //     },
            //   );
            // } catch (err) {
            //   console.error(
            //     `Failed to update totalMember for coopId: ${coopId}`,
            //     err,
            //   );
            // }
          }

          // 3. Set hasOnboarded flag to true in COLLECTION_ID_ONBOARDED_MEMBERS
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_ONBOARDED_MEMBERS,
            preOnboardDoc.$id,
            {
              hasOnboarded: true,
            },
          );

          return coopId;
        } catch (err) {
          console.error(
            `Failed to process onboarding for coopId: ${coopId}`,
            err,
          );
          return null;
        }
      }),
    );

    const processedCoops = processedResults
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    return NextResponse.json({
      success: true,
      message: `Successfully onboarded to ${processedCoops.length} members.`,
      processedCoops,
    });
  } catch (error) {
    console.error("Error in member onboarding POST route:", error);
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to process onboarding"),
      },
      { status: 500 },
    );
  }
}
