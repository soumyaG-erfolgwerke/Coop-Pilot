import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PENDINGPAYOUTS, COLLECTION_ID_COOPERATIVES, COLLECTION_ID_COOPXMEMBER, COLLECTION_ID_PROFILE, COLLECTION_ID_TRANSACTIONS_LEDGER } from "@/lib/appwrite-server";
import { getSettingsDocumentByCoopId, deriveDefaultSettingsFromCoop } from "@/lib/helpers/_helpers";
import { getUpdatedHistoryJson } from "@/lib/memberHistoryService";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration, requireCoopMembership, requireMemberIdentity } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

function calculateExitDate(submissionDateStr, fiscalYearEndStr, noticePeriodDays) {
  const [sYear, sMonth, sDay] = submissionDateStr.split("-").map(Number);
  const subDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
  const currentYear = sYear;
  const [fMonth, fDay] = fiscalYearEndStr.split("-").map(Number);

  let fyEnd = new Date(Date.UTC(currentYear, fMonth - 1, fDay));
  if (fyEnd < subDate) {
    fyEnd = new Date(Date.UTC(currentYear + 1, fMonth - 1, fDay));
  }

  const diffTime = fyEnd.getTime() - subDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let exitDate;
  if (diffDays >= noticePeriodDays) {
    exitDate = fyEnd;
  } else {
    exitDate = new Date(Date.UTC(fyEnd.getUTCFullYear() + 1, fMonth - 1, fDay));
  }

  const yyyy = exitDate.getUTCFullYear();
  const mm = String(exitDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(exitDate.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const coopId = searchParams.get("coopId");

    if (!userId && !coopId) {
      return NextResponse.json(
        { success: false, error: "userId or coopId is required" },
        { status: 400 }
      );
    }
    if (coopId && !userId) await requireCoopAdministration(session, coopId);
    else if (userId && coopId) await requireCoopMembership(session, coopId, userId);
    else requireMemberIdentity(session, userId);

    const { databases } = createAdminClient();

    const queries = [
      Query.orderDesc("$createdAt"),
      Query.limit(500),
    ];
    if (userId) {
      queries.push(Query.equal("userId", userId));
    }
    if (coopId) {
      queries.push(Query.equal("coopId", coopId));
    }

    // Query PendingPayouts
    const payoutsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PENDINGPAYOUTS,
      queries
    );

    const documents = payoutsRes.documents;

    // Fetch coop details for all coopIds in a single batch query
    const coopIds = [...new Set(documents.map((doc) => doc.coopId).filter(Boolean))];
    let coopMap = {};

    if (coopIds.length > 0) {
      try {
        const coopResults = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_COOPERATIVES,
          [
            Query.equal("$id", coopIds),
            Query.limit(coopIds.length),
          ]
        );
        coopResults.documents.forEach((coop) => {
          coopMap[coop.$id] = coop.name;
        });
      } catch (err) {
        console.error("Batch Coop Fetch Error in pending-payouts:", err);
      }
    }

    // Fetch profiles for all userIds in a single batch query
    const userIds = [...new Set(documents.map((doc) => doc.userId).filter(Boolean))];
    let profileMap = {};

    if (userIds.length > 0) {
      try {
        const profileResults = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_PROFILE,
          [
            Query.equal("userId", userIds),
            Query.limit(userIds.length),
          ]
        );
        profileResults.documents.forEach((profile) => {
          profileMap[profile.userId] = {
            name: [
              profile.salutation,
              profile.title,
              profile.FirstName || profile.firstName,
              profile.LastName || profile.lastName,
            ].filter(Boolean).join(" "),
            iban: profile.ibanNo || "",
            accountHolder: profile.accountHolder || "",
            email: profile.contactEmail || profile.email || "",
          };
        });
      } catch (err) {
        console.error("Batch Profile Fetch Error in pending-payouts:", err);
      }
    }

    const result = documents.map((doc) => ({
      id: doc.$id,
      userId: doc.userId,
      coopId: doc.coopId,
      coopName: coopMap[doc.coopId] || "Unknown Cooperative",
      shares: doc.shares,
      price: doc.price,
      exitDate: doc.exitDate,
      status: doc.status,
      memberId: doc.memberId,
      submissionDate: doc.submissionDate,
      textForm: doc.textForm,
      isPayPending: doc.isPayPending,
      TransactionId: doc.TransactionId || "",
      reason: doc.reason || "",
      memberProfile: profileMap[doc.userId] || null,
    }));

    return NextResponse.json({ success: true, payouts: result });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to fetch pending payouts:", error);
    return NextResponse.json({ success: false, payouts: [], error: safePublicError(error)}, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await resolveSession();
    const body = await request.json();
    const { userId, coopId, reason, signature } = body;

    if (!userId || !coopId || !signature) {
      return NextResponse.json(
        { success: false, error: "userId, coopId, and signature are required." },
        { status: 400 }
      );
    }
    await requireCoopMembership(session, coopId, userId);
    if (typeof signature !== "string" || signature.length > 5000 || (reason && (typeof reason !== "string" || reason.length > 2000))) {
      return NextResponse.json({ success: false, error: "Invalid cancellation data" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    // 1. Check if there is already a pending payout for this user and coop
    const existingPayouts = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PENDINGPAYOUTS,
      [
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.equal("isPayPending", true),
        Query.limit(1),
      ]
    );

    if (existingPayouts.documents.length > 0) {
      return NextResponse.json(
        { success: false, error: "A pending payout already exists for this cooperative." },
        { status: 400 }
      );
    }

    // 2. Query active memberships for this user and coop
    const memberRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.equal("status", "Active"),
        Query.limit(100),
      ]
    );

    if (memberRes.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active membership found for this cooperative." },
        { status: 404 }
      );
    }

    const activeDocs = memberRes.documents;
    const totalShares = activeDocs.reduce((sum, doc) => sum + (doc.shares || 0), 0);
    const memberId = activeDocs[0].membershipId || activeDocs[0].memberId || "";

    // 2. Fetch cooperative details & settings for exit date and share price calculations
    const coopDoc = await databases.getDocument(DATABASE_ID, COLLECTION_ID_COOPERATIVES, coopId);
    const settingsDoc = await getSettingsDocumentByCoopId(coopId);
    const mergedSettings = deriveDefaultSettingsFromCoop(coopDoc, settingsDoc);

    const sharePrice = (mergedSettings.share_price_cents || 0) / 100 || coopDoc.sharePrice || 0;
    const fiscalYearEnd = mergedSettings.fiscal_year_end || "12-31";
    const noticePeriod = mergedSettings.member_exit_notice_period_days ?? 30;

    const submissionDate = new Date().toISOString().split("T")[0];
    const exitDate = calculateExitDate(submissionDate, fiscalYearEnd, noticePeriod);

    // // 3. Generate a unique TransactionId
    // const TransactionId = `TX-CN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 4. Create document in PendingPayouts
    const payoutPayload = {
      userId,
      coopId,
      shares: totalShares,
      price: totalShares * sharePrice,
      exitDate,
      status: "NoticeGiven",
      memberId,
      submissionDate,
      textForm: signature,
      isPayPending: true,
      // TransactionId,
      reason: reason || "",
    };

    const payoutDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_PENDINGPAYOUTS,
      ID.unique(),
      payoutPayload
    );

    // 5. Update CoopXMember status to NoticeGiven & append to history in parallel
    await Promise.all(
      activeDocs.map((doc) =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_COOPXMEMBER,
          doc.$id,
          {
            status: "NoticeGiven",
            exitDate: exitDate,
            historyJson: getUpdatedHistoryJson(doc.historyJson, "NoticeGiven"),
          }
        )
      )
    );

    return NextResponse.json({ success: true, payout: payoutDoc });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to create cancellation notice:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to submit cancellation notice.") },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await resolveSession();
    const body = await request.json();
    const { payoutId, TransactionId } = body;

    if (!payoutId || !TransactionId) {
      return NextResponse.json(
        { success: false, error: "payoutId and TransactionId are required." },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();
    const existingPayout = await databases.getDocument(DATABASE_ID, COLLECTION_ID_PENDINGPAYOUTS, payoutId);
    await requireCoopAdministration(session, existingPayout.coopId);
    if (!existingPayout.isPayPending) {
      return NextResponse.json({ success: false, error: "Payout is already finalized" }, { status: 409 });
    }
    if (typeof TransactionId !== "string" || TransactionId.length > 200) {
      return NextResponse.json({ success: false, error: "Invalid transaction reference" }, { status: 400 });
    }
    const duplicateLedger = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTIONS_LEDGER,
      [Query.equal("paymentReference", TransactionId), Query.limit(1)],
    );
    if (duplicateLedger.total > 0) {
      return NextResponse.json({ success: false, error: "Transaction reference already used" }, { status: 409 });
    }

    // Update PendingPayouts document to mark it paid and store TransactionId
    const updatedPayout = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_PENDINGPAYOUTS,
      payoutId,
      {
        isPayPending: false,
        TransactionId: TransactionId,
      }
    );

    //UpdateTransactionLedger to store this payout as an immutable financial record
    const amountCents = Math.round((updatedPayout.price || 0) * 100);
    const sharePriceCents = Math.round(amountCents / (updatedPayout.shares || 1));

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_TRANSACTIONS_LEDGER,
      ID.unique(),
      {
        coopId: updatedPayout.coopId,
        memberId: updatedPayout.userId,
        memberNumber: updatedPayout.memberId,
        amountCents: amountCents,
        sharePriceCents: sharePriceCents,
        shares: updatedPayout.shares,
        sign: "DEBIT",
        paymentStatus: "PAID",
        type: "TRANSFER_DEBIT",
        paymentReference: updatedPayout.TransactionId,
      }
    );

    return NextResponse.json({ success: true, payout: updatedPayout });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to update payout:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to update payout.") },
      { status: 500 }
    );
  }
}
