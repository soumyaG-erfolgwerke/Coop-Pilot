import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOPXMEMBER, COLLECTION_ID_COOPERATIVES } from "@/lib/appwrite-server";
import { getSettingsDocumentByCoopId, deriveDefaultSettingsFromCoop } from "@/lib/helpers/_helpers";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopMembership } from "@/lib/auth/membership-access";
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

    if (!userId || !coopId) {
      return NextResponse.json({ success: false, error: "userId and coopId are required" }, { status: 400 });
    }
    await requireCoopMembership(session, coopId, userId);

    const { databases } = createAdminClient();

    // Query active memberships for this user and coop
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
      return NextResponse.json({ success: false, error: "No active membership found for this cooperative." }, { status: 404 });
    }

    const activeDocs = memberRes.documents;
    const totalShares = activeDocs.reduce((sum, doc) => sum + (doc.shares || 0), 0);
    const memberId = activeDocs[0].membershipId || activeDocs[0].memberId || "";

    // Fetch cooperative and its settings
    const coopDoc = await databases.getDocument(DATABASE_ID, COLLECTION_ID_COOPERATIVES, coopId);
    const settingsDoc = await getSettingsDocumentByCoopId(coopId);
    const mergedSettings = deriveDefaultSettingsFromCoop(coopDoc, settingsDoc);

    const sharePrice = (mergedSettings.share_price_cents || 0) / 100 || coopDoc.sharePrice || 0;
    const fiscalYearEnd = mergedSettings.fiscal_year_end || "12-31";
    const noticePeriod = mergedSettings.member_exit_notice_period_days ?? 30;

    const submissionDate = new Date().toISOString().split("T")[0];
    const exitDate = calculateExitDate(submissionDate, fiscalYearEnd, noticePeriod);

    return NextResponse.json({
      success: true,
      preview: {
        memberId,
        shares: totalShares,
        price: totalShares * sharePrice,
        submissionDate,
        exitDate,
      }
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to generate cancellation preview:", error);
    return NextResponse.json({ success: false, error: safePublicError(error)}, { status: 500 });
  }
}
