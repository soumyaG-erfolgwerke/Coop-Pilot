import { NextResponse } from "next/server";
import { getKycStatus } from "@/lib/getKycStatus";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

/**
 * GET /api/member/kyc-status
 * Fetches the current member's KYC status and resubmission requests.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    const session = await resolveSession();

    // Use the upgraded getKycStatus with includeDetails = true
    const kycDetails = await getKycStatus(session.userId, true, coopId);

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
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    console.error("KYC Status API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
