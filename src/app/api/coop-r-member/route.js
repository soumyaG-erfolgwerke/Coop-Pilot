import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOPXMEMBER, COLLECTION_ID_TRANSACTION } from "@/lib/appwrite-server";
import { uploadKycDocument } from "@/lib/kycDocumentService";
import { createRollbackManager } from "@/lib/rollbackService";
import { getUpdatedHistoryJson } from "@/lib/memberHistoryService";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration, requireCoopMembership, requireMemberIdentity } from "@/lib/auth/membership-access";
import { requireTransactionAccess } from "@/lib/auth/transaction-access";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const coopId = searchParams.get("coopId");

    const { databases } = createAdminClient();
    if (userId && coopId) await requireCoopMembership(session, coopId, userId);
    else if (userId) requireMemberIdentity(session, userId);
    else if (coopId) await requireCoopAdministration(session, coopId);

    let queries = [];
    if (userId) queries.push(Query.equal("userId", userId));
    if (coopId) queries.push(Query.equal("coopId", coopId));
    
    // Sort by creation time descending to ensure the latest lifecycle record comes first
    queries.push(Query.orderDesc("$createdAt"));

    if (queries.length === 0) {
      return NextResponse.json({ success: false, error: "Must provide userId or coopId" }, { status: 400 });
    }

    const membership = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      queries
    );

    return NextResponse.json({ success: true, membership: membership.documents });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching coopXmember:", error);
    return NextResponse.json({ success: false, error: safePublicError(error)}, { status: 500 });
  }
}

export async function POST(request) {
  const rollback = createRollbackManager();

  try {
    const session = await resolveSession();
    const formData = await request.formData();
    const userId = formData.get("userId");
    const coopId = formData.get("coopId");
    const transactionId = formData.get("transactionId");

    // File inputs are optional if already active member
    const file = formData.get("file");
    const documentType = formData.get("documentType");

    if (!userId || !coopId || !transactionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();
    requireMemberIdentity(session, userId);
    const transaction = await databases.getDocument(DATABASE_ID, COLLECTION_ID_TRANSACTION, transactionId);
    await requireTransactionAccess(session, transaction);
    if (
      (transaction.memberId?.$id || transaction.memberId) !== userId ||
      (transaction.coopId?.$id || transaction.coopId) !== coopId
    ) {
      return NextResponse.json({ success: false, error: "Transaction does not match membership" }, { status: 400 });
    }

    // Look for existing member (ordered by creation descending to get latest)
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.orderDesc("$createdAt")
      ]
    );

    if (existing.documents.length > 0) {
      const member = existing.documents[0];
      const status = member.status || "";
      const lowerStatus = status.toLowerCase();

      if (lowerStatus === "active" || lowerStatus === "noticegiven") {
        // Append transactionId to ProposalKeys
        const currentKeys = member.ProposalKeys || [];
        const updated = await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_COOPXMEMBER,
          member.$id,
          {
            ProposalKeys: [...currentKeys, transactionId]
          }
        );
        rollback.add(() =>
          databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_COOPXMEMBER,
            member.$id,
            {
              ProposalKeys: currentKeys
            }
          )
        );
        return NextResponse.json({ success: true, membership: updated });
      } else if (lowerStatus === "pending") {
        return NextResponse.json({ success: false, error: "Membership is pending." }, { status: 400 });
      }
      // If status is "Former" or "rejected", a new application lifecycle starts.
    }

    // New membership lifecycle, needs file
    if (!file || !documentType) {
      return NextResponse.json({ success: false, error: "File and documentType required for new member" }, { status: 400 });
    }

    // upload KYC
    const uploadRes = await uploadKycDocument(userId, file, documentType, rollback);

    // Create coopXmember
    const memberData = {
      kycDocId: uploadRes.document.$id,
      status: "pending",
      coopId: coopId,
      userId: userId,
      ProposalKeys: [transactionId],
      historyJson: getUpdatedHistoryJson(null, "pending")
    };

    const newMember = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      ID.unique(),
      memberData
    );
    rollback.add(() =>
      databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPXMEMBER,
        newMember.$id
      )
    );

    return NextResponse.json({ success: true, membership: newMember });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("coopXmember POST Error:", error);
    await rollback.execute();
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 }
    );
  }
}
