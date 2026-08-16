import { NextResponse } from "next/server";
import { getCoopById, getSettingsDocumentByCoopId, deriveDefaultSettingsFromCoop } from "@/lib/helpers/_helpers";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopMembership } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json({ success: false, error: "coopId is required" }, { status: 400 });
    }
    await requireCoopMembership(session, coopId);

    const coopDoc = await getCoopById(coopId);
    const settingsDoc = await getSettingsDocumentByCoopId(coopId);
    const mergedSettings = deriveDefaultSettingsFromCoop(coopDoc, settingsDoc);

    return NextResponse.json({
      success: true,
      settings: {
        fiscal_year_end: mergedSettings.fiscal_year_end || "12-31",
        member_exit_notice_period_days: mergedSettings.member_exit_notice_period_days ?? 30,
        sharePrice: (mergedSettings.share_price_cents || 0) / 100 || coopDoc.sharePrice || 0,
      }
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to fetch coop settings:", error);
    return NextResponse.json({ success: false, error: safePublicError(error)}, { status: 500 });
  }
}
