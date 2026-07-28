import {
  AVV_BUCKET_id,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_COOPXMEMBER,
  COLLECTION_ID_KYC_APPLICATIONS,
  COLLECTION_ID_KYC_DOCUMENTS,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_TRANSACTION,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { getUpdatedHistoryJson } from "@/lib/memberHistoryService";
import { getNewVerifiedMemberCountInternal } from "@/lib/memberService";
import { generateMembershipPdf } from "@/lib/membershipPdfService";
import { sendEmail } from "@/utils/mailer";
import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const processMembershipActivation = async (databases, storage, piData) => {
  let newMembershipId = null;
  try {
    const { coopId, userId, shares, transactionId } = piData;

    const tx = await databases.getDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_TRANSACTION,
      documentId: transactionId,
    });

    if(tx.havePaid && tx.paymentStatus === "payment_succeeded") {
      console.log(`[WEBHOOK] Transaction ${transactionId} already marked as paid. Skipping membership activation.`);
      return newMembershipId;
    }

    // 0. Toggle transaction proposal to verified
    await databases.updateDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_TRANSACTION,
      documentId: transactionId,
      data: { havePaid: true, verificationStatus: "verified" },
    });

    // 1. Fetch the existing coopXmember relationship
    const existingMembers = await databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID_COOPXMEMBER,
      queries: [
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.orderDesc("$createdAt"),
      ],
    });

    if (existingMembers.documents.length === 0) return newMembershipId;
    const member = existingMembers.documents[0];
    const status = (member.status || "").toLowerCase();

    if (status === "pending") {
      // --- CASE A: First-time membership activation ---

      // A1. Create KYC Application
      const kycApp = await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_KYC_APPLICATIONS,
        documentId: ID.unique(),
        data: {
          userId,
          kycStatus: "VERIFIED",
          coopId,
          reviewerId: "system",
          reviewedAt: new Date().toISOString(),
          submissionAttempt: 1,
          resubmissionRequested: false,
        },
      });

      // A2. Link KYC App to Document
      if (member.kycDocId) {
        await databases
          .updateDocument({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID_KYC_DOCUMENTS,
            documentId: member.kycDocId,
            data: {
              kycApplicationId: kycApp.$id,
            },
          })
          .catch((err) => console.error("KYC Link Error:", err));
      }

      // A3. Generate Membership ID
      const coop = await databases.getDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_COOPERATIVES,
        documentId: coopId,
      });
      const format = coop.member_number_format || "M-";
      const totalMember = await getNewVerifiedMemberCountInternal(coopId);
      newMembershipId = `${format}${totalMember + 1}`;

      // A4. Fetch Profile & Entry Date
      const profileResult = await databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_PROFILE,
        queries: [Query.equal("userId", userId)],
      });
      const profile = profileResult.documents[0] || {};

      let entryDateRaw = null;
      if (member.ProposalKeys?.[0]) {
        const firstTx = await databases
          .getDocument({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID_TRANSACTION,
            documentId: member.ProposalKeys[0],
          })
          .catch(() => null);
        entryDateRaw = firstTx?.$createdAt || null;
      }

      // A5. Generate and Upload PDF
      const pdfBuffer = await generateMembershipPdf({
        coop,
        profile,
        member,
        newMembershipId,
        entryDateRaw,
      });

      const uploadedFile = await storage.createFile(
        AVV_BUCKET_id,
        ID.unique(),
        InputFile.fromBuffer(pdfBuffer, `Membership_${newMembershipId}.pdf`),
      );

      const memApplicationUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${AVV_BUCKET_id}/files/${uploadedFile.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

      // A6. Activate Membership
      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_COOPXMEMBER,
        documentId: member.$id,
        data: {
          status: "Active",
          membershipId: newMembershipId,
          shares: shares,
          MemApplication: memApplicationUrl,
          historyJson: getUpdatedHistoryJson(member.historyJson, "Active"),
        },
      });

      try {
        await sendEmail({
          recipient: {
            name:
              `${profile.FirstName || ""} ${profile.LastName || ""}`.trim() ||
              "Member",
            email: profile.contactEmail,
          },
          subject: `Easycoop: Your Membership at ${coop.name} is Now Active`,
          body: `
                  <p>Your payment has cleared and your application has been verified by the system.</p>
                  <p><strong>Cooperative:</strong> ${coop.name}</p>
                  <p><strong>Membership ID:</strong> ${newMembershipId}</p>
                  <p>Your legally signed declaration copy has been successfully archived. You can inspect or store your copy at any point directly via the link below:</p>
                  <p><a href="${memApplicationUrl}" style="color: #B7416E; font-weight: bold; text-decoration: underline;">View Membership Application Document</a></p>
                `,
        });
      } catch (error) {
        // Safe logging wrapper so a down email cluster doesn't break the webhook lifecycle execution
        console.error("[WEBHOOK-EMAIL]", error);
        return newMembershipId;
      }

      return newMembershipId;

    } else if (status === "active" || status === "noticegiven") {
      // --- CASE B: Existing member buying more shares ---
      const newShares = (member.shares || 0) + shares;
      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID_COOPXMEMBER,
        documentId: member.$id,
        data: {
          shares: newShares,
          status: "Active",
          historyJson:
            member.status !== "Active"
              ? getUpdatedHistoryJson(member.historyJson, "Active")
              : member.historyJson,
        },
      });

      return newMembershipId;
    }
  } catch (error) {
    console.error("[WEBHOOK] Membership Activation Failed:", error);
    return newMembershipId;
  }
};

export { processMembershipActivation };
