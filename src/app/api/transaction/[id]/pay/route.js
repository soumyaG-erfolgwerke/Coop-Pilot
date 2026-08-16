import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { generateMembershipPdf } from "@/lib/membershipPdfService";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_TRANSACTION,
  COLLECTION_ID_COOPXMEMBER,
  COLLECTION_ID_KYC_APPLICATIONS,
  COLLECTION_ID_KYC_DOCUMENTS,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_PROFILE,
  AVV_BUCKET_id
} from "@/lib/appwrite-server";
import { getNewVerifiedMemberCountInternal } from "@/lib/memberService";
import { getUpdatedHistoryJson } from "@/lib/memberHistoryService";
import { getSecureFileUrl } from "@/lib/secureFileUrl";
import { safePublicError } from "@/lib/api/safe-public-error";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export async function POST(request, { params }) {

  //TODO: ACTUAL MOLLIE intregration coming
  try {
    const session = requireRole(await resolveSession(), ["coopadmin", "superuser"]);
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }

    const { databases, storage } = createAdminClient();

    // 1. Fetch transaction
    const transaction = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      id
    );

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const coopId = transaction.coopId?.$id || transaction.coopId;
    if (!coopId) return sessionErrorResponse({ status: 403 });
    if (session.role !== "superuser") await ensureCoopAdminAccess(coopId);

    if (transaction.havePaid === true && transaction.verificationStatus === "verified") {
      return NextResponse.json({ success: true, transaction, memApplicationUrl: null });
    }

    // 2. Update transaction table: havePaid -> true, verificationStatus -> "verified"
    const updatedTransaction = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTION,
      id,
      {
        havePaid: true,
        verificationStatus: "verified"
      }
    );

    const userId = transaction.memberId?.$id || transaction.memberId;

    // 3. Find coopXmember relationships sorted descending by $createdAt to get the latest
    const existingMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.orderDesc("$createdAt")
      ]
    );

    if (existingMembers.documents.length === 0) {
      return NextResponse.json({ success: false, error: "Coop membership relation not found" }, { status: 404 });
    }

    const member = existingMembers.documents[0];
    const status = (member.status || "").toLowerCase();
    let memApplicationUrl = null;

    if (status === "pending") {
      // --- CASE A: status is pending ---

      // A1. Add a kycApplication with status verified and coopId
      const kycApp = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_KYC_APPLICATIONS,
        ID.unique(),
        {
          userId: userId,
          kycStatus: "VERIFIED",
          coopId: coopId,
          reviewerId: "system",
          reviewedAt: new Date().toISOString(),
          submissionAttempt: 1,
          resubmissionRequested: false
        }
      );

      // A2. Update kycApplicationId to the column of kycDocument table of id = kycDocId from coopxmember
      const kycDocId = member.kycDocId;
      if (kycDocId) {
        try {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_KYC_DOCUMENTS,
            kycDocId,
            {
              kycApplicationId: kycApp.$id
            }
          );
        } catch (err) {
          console.error(`Failed to update kycApplicationId for doc ${kycDocId}:`, err);
        }
      }

      // A3. Calculate total members for membership ID formatting
      // Fetch cooperative to get member_number_format
      const coop = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coopId
      );
      const format = coop.member_number_format || "M-";

      const totalMember = await getNewVerifiedMemberCountInternal(coopId);
      const newMembershipId = `${format}${totalMember + 1}`;

      // A4. Fetch profile to get PDF fields
      const profileResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_PROFILE,
        [Query.equal("userId", userId)]
      );
      const profile = profileResult.documents[0] || {};

      // entry date - $createdAt of the 0th index ProposalKey transaction
      let entryDateRaw = null;
      const firstTxId = member.ProposalKeys?.[0];
      if (firstTxId) {
        try {
          const firstTx = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_ID_TRANSACTION,
            firstTxId
          );
          if (firstTx?.$createdAt) {
            entryDateRaw = firstTx.$createdAt;
          }
        } catch (err) {
          console.error("Error fetching first transaction for entry date:", err);
        }
      }

      // A5. Generate PDF membership Application using the high-fidelity service
      const pdfBuffer = await generateMembershipPdf({
        coop,
        profile,
        member,
        newMembershipId,
        entryDateRaw
      });

      // A6. Upload to AVV bucket
      const uploadedFile = await storage.createFile(
        AVV_BUCKET_id,
        ID.unique(),
        InputFile.fromBuffer(pdfBuffer, `Membership_${newMembershipId}.pdf`)
      );

      memApplicationUrl = getSecureFileUrl(AVV_BUCKET_id, uploadedFile.$id);

      // A7. Update coopxmember document with history transition
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPXMEMBER,
        member.$id,
        {
          status: "Active",
          membershipId: newMembershipId,
          shares: transaction.shares,
          MemApplication: memApplicationUrl,
          historyJson: getUpdatedHistoryJson(member.historyJson, "Active")
        }
      );

    } else if (status === "active" || status === "noticegiven") {
      // --- CASE B: status is active or noticegiven ---
      memApplicationUrl = null;
      const newShares = (member.shares || 0) + transaction.shares;
      const updateData = {
        shares: newShares,
        status: "Active"
      };

      if (member.status !== "Active") {
        updateData.historyJson = getUpdatedHistoryJson(member.historyJson, "Active");
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPXMEMBER,
        member.$id,
        updateData
      );
    } else {
      console.log(`Unknown member status: ${member.status} for membership ${member.$id}`);
    }

    return NextResponse.json({ success: true, transaction: updatedTransaction, memApplicationUrl });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Payment confirmation failed:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to confirm payment") },
      { status: 500 }
    );
  }
}
