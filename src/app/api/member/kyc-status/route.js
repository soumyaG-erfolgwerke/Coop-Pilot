import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getKycStatus } from "@/lib/getKycStatus";

/**
 * GET /api/member/kyc-status
 * Fetches the current member's KYC status and resubmission requests.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const userId = sessionData.userId;

    // Use the upgraded getKycStatus with includeDetails = true
    const kycDetails = await getKycStatus(userId, true, coopId);

    if (!kycDetails) {
      return NextResponse.json({
        success: true,
        kycStatus: "PENDING",
        resubmissionRequested: false,
        reason: null
      });
    }

    return NextResponse.json({
      success: true,
      kycStatus: kycDetails.status,
      resubmissionRequested: kycDetails.resubmissionRequested,
      reason: kycDetails.reason
    });

  } catch (error) {
    console.error("KYC Status API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
