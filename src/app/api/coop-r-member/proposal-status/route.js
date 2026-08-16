import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TRANSACTION, COLLECTION_ID_COOPXMEMBER } from "@/lib/appwrite-server";
import { getUpdatedHistoryJson } from "@/lib/memberHistoryService";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function PATCH(request) {
  try {
    const session = await resolveSession();
    const { transactionId, status, memberId, coopId } = await request.json();

    if (!transactionId || !status || !memberId || !coopId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: transactionId, status, memberId, coopId" },
        { status: 400 }
      );
    }
    await requireCoopAdministration(session, coopId);

    const { databases } = createAdminClient();
    const transaction = await databases.getDocument(DATABASE_ID, COLLECTION_ID_TRANSACTION, transactionId);
    if (
      (transaction.memberId?.$id || transaction.memberId) !== memberId ||
      (transaction.coopId?.$id || transaction.coopId) !== coopId
    ) return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });

    // 1. Handle Verified
    if (status === "verified") {
      const updatePayload = {
        isAdminApproved: true,
        approvedBy: session.email || session.userId,
      };
      const updatedTx = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_TRANSACTION,
        transactionId,
        updatePayload,
      );
      return NextResponse.json({ success: true, transaction: updatedTx });
    }

    // 2. Handle Rejected
    if (status === "rejected") {
      // Find the CoopXMember records by userId and coopId sorted descending
      const memberRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_COOPXMEMBER,
        [
          Query.equal("userId", memberId),
          Query.equal("coopId", coopId),
          Query.orderDesc("$createdAt")
        ]
      );

      if (memberRes.documents.length === 0) {
        return NextResponse.json(
          { success: false, error: "CoopXMember relationship record not found." },
          { status: 404 }
        );
      }

      // Find the membership record that contains this transaction's ID in its ProposalKeys list, or fall back to the latest
      const coopMemberDoc = memberRes.documents.find(
        (m) => m.ProposalKeys && m.ProposalKeys.includes(transactionId)
      ) || memberRes.documents[0];
      const currentStatus = (coopMemberDoc.status || "").toLowerCase();

      // Update Transaction Table verificationStatus to "rejected"
      const updatedTx = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_TRANSACTION,
        transactionId,
        {
          verificationStatus: "rejected"
        }
      );

      // If CoopXMember status is pending, update that to rejected and append history transition
      if (currentStatus === "pending") {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_COOPXMEMBER,
          coopMemberDoc.$id,
          {
            status: "rejected",
            historyJson: getUpdatedHistoryJson(coopMemberDoc.historyJson, "rejected")
          }
        );
      }

      return NextResponse.json({ success: true, transaction: updatedTx });
    }

    return NextResponse.json(
      { success: false, error: "Invalid status value. Must be 'verified' or 'rejected'." },
      { status: 400 }
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error updating proposal status:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 }
    );
  }
}
