import { NextResponse } from "next/server";
import { getNewVerifiedMemberCountInternal } from "@/lib/memberService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 }
      );
    }

    const count = await getNewVerifiedMemberCountInternal(coopId);

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Failed to fetch verified member count:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch verified member count" },
      { status: 500 }
    );
  }
}
