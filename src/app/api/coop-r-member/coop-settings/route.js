import { NextResponse } from "next/server";
import { getCoopById, getSettingsDocumentByCoopId, deriveDefaultSettingsFromCoop } from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json({ success: false, error: "coopId is required" }, { status: 400 });
    }

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
    console.error("Failed to fetch coop settings:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
