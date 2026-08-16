import { NextResponse } from "next/server";
import { validateAdminRole, updateKycStatus } from "@/lib/kycReviewService";
import { safePublicError } from "@/lib/api/safe-public-error";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";
import { sessionErrorResponse } from "@/lib/auth/session";

/**
 * PATCH /api/coop-admin/kyc-applications/review
 * Consolidated endpoint for accepting, rejecting, or requesting resubmission of KYC applications.
 * Body: { userId, action: "accept" | "reject" | "resubmit", reason?: string, askResubmission?: boolean }
 */
export async function PATCH(request) {
  try {
    const { userId, action, reason, askResubmission, coopId } = await request.json();

    if (!userId || !coopId || !["accept", "reject", "resubmit"].includes(action)) {
      return NextResponse.json({ success: false, error: "Valid userId, coopId, and action are required" }, { status: 400 });
    }

    // 1. Verify role
    const adminUserId = await validateAdminRole();
    await ensureCoopAdminAccess(coopId);

    // 2. Determine status and resubmission flag based on action
    let status;
    let resubmitRequested;

    if (action === "accept") {
      status = "VERIFIED";
      resubmitRequested = false;
    } else if (action === "resubmit") {
      // Yellow button: standalone resubmission request
      status = "RESUBMISSION_REQUIRED";
      resubmitRequested = true;
    } else {
      // Reject action
      if (askResubmission === true) {
        // [User Request] Reject with tick mark -> RESUBMISSION_REQUIRED
        status = "RESUBMISSION_REQUIRED";
        resubmitRequested = true;
      } else {
        // Normal reject -> REJECTED
        status = "REJECTED";
        resubmitRequested = false;
      }
    }

    const updatedApplication = await updateKycStatus(
      userId,
      status,
      adminUserId,
      reason,
      resubmitRequested,
      coopId
    );

    return NextResponse.json({
      success: true,
      message: `KYC application ${action}ed successfully`,
    });
  } catch (error) {
    if (error?.code === 404 || error?.type === "document_not_found") {
      return sessionErrorResponse({ status: 403 });
    }
    if (error?.status === 401 || error?.status === 403 || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return sessionErrorResponse({ status: error?.status === 403 || error?.message === "FORBIDDEN" ? 403 : 401 });
    }
    console.error("KYC Review Error:", error);
    const status = error.message.includes("Unauthorized") ? 401 :
      error.message.includes("Forbidden") ? 403 :
        error.message.includes("not found") ? 404 :
          error.message.includes("already") ? 400 : 500;

    return NextResponse.json(
      { success: false, error: safePublicError(error, "Failed to process KYC review") },
      { status: status }
    );
  }
}
