import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration, requireCoopMembership } from "@/lib/auth/membership-access";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { boundedText, validateStrictObject } from "@/lib/validation/strict-object";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";

// GET /api/coops/[coopId] - Get a specific cooperative
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    
    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    const session = await resolveSession();
    if (["org_admin", "auditer", "aud_E", "aud_T"].includes(session.role)) {
      await requireCoopAuditAccess(coopId);
    } else {
      await requireCoopMembership(session, coopId);
    }

    const { databases } = createAdminClient();

    const document = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    return NextResponse.json(document);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to get cooperative:`, error);
    return NextResponse.json(
      { error: error?.code === 404 ? "Cooperative not found" : "Failed to get cooperative" },
      { status: error?.code === 404 ? 404 : 500 }
    );
  }
}

// PATCH /api/coops/[coopId] - Update a cooperative
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    
    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    const session = await resolveSession();
    await requireCoopAdministration(session, coopId);

    const updateData = await request.json();
    const shape = validateStrictObject(
      updateData,
      ["name", "adminEmails", "country", "state", "sector", "sharePrice", "court", "regNumber", "about", "logoUrl", "bannerUrl", "max_shares", "auto_approval_membership", "autoApprovalMembership", "auto_approval_shares", "autoApprovalShares", "member_number_format"],
      { maxBytes: 32 * 1024, requireAtLeastOne: true },
    );
    if (!shape.ok) return NextResponse.json({ error: shape.error }, { status: 400 });
    const { databases } = createAdminClient();

    // Prepare the update data
    const documentDataToUpdate = {};
    
    const textFields = [
      ["name", "name", 200], ["country", "country", 100], ["state", "state", 100],
      ["sector", "sector", 150], ["court", "CourtName", 200], ["regNumber", "RegNumber", 100],
      ["about", "about", 5000], ["logoUrl", "logo", 2048], ["bannerUrl", "bannerUrl", 2048],
    ];
    for (const [source, target, max] of textFields) {
      if (updateData[source] === undefined) continue;
      const value = boundedText(updateData[source], { max });
      if (value === null) return NextResponse.json({ error: `Invalid ${source}` }, { status: 422 });
      documentDataToUpdate[target] = value;
    }
    if (updateData.adminEmails !== undefined) {
      if (!Array.isArray(updateData.adminEmails) || updateData.adminEmails.length > 100 || updateData.adminEmails.some((email) => typeof email !== "string" || email.length < 3 || email.length > 254)) {
        return NextResponse.json({ error: "Invalid adminEmails" }, { status: 422 });
      }
      documentDataToUpdate.admins = [...new Set(updateData.adminEmails.map((email) => email.trim().toLowerCase()))];
    }
    if (updateData.sharePrice !== undefined) {
      const sharePrice = Number(updateData.sharePrice);
      if (!Number.isFinite(sharePrice) || sharePrice < 0 || sharePrice > 1_000_000_000) return NextResponse.json({ error: "Invalid sharePrice" }, { status: 422 });
      documentDataToUpdate.sharePrice = sharePrice;
    }
    // Sensitive fields like ibanNumber, bicNumber, isLive must not be
    // patchable via this generic route. They are managed via the
    // /api/cooperative/settings/[coopId] route which enforces validation and audit logging.
    if (updateData.max_shares !== undefined) {
      const maxShares = Number(updateData.max_shares);
      if (!Number.isInteger(maxShares) || maxShares < 1 || maxShares > 1_000_000) return NextResponse.json({ error: "Invalid max_shares" }, { status: 422 });
      documentDataToUpdate.max_shares = maxShares;
    }
    if (updateData.auto_approval_membership !== undefined || updateData.autoApprovalMembership !== undefined) {
      const membershipValue =
        updateData.auto_approval_membership !== undefined
          ? updateData.auto_approval_membership
          : updateData.autoApprovalMembership;
      if (![true, false, "true", "false", 1, 0, "1", "0"].includes(membershipValue)) {
        return NextResponse.json({ error: "Invalid auto approval membership" }, { status: 422 });
      }
      documentDataToUpdate.auto_approval_membership =
        membershipValue === true ||
        membershipValue === "true" ||
        membershipValue === 1 ||
        membershipValue === "1";
    }
    if (updateData.auto_approval_shares !== undefined || updateData.autoApprovalShares !== undefined) {
      const sharesValue =
        updateData.auto_approval_shares !== undefined
          ? updateData.auto_approval_shares
          : updateData.autoApprovalShares;
      const autoShares = Number(sharesValue);
      if (!Number.isInteger(autoShares) || autoShares < 0 || autoShares > 1_000_000) return NextResponse.json({ error: "Invalid auto approval shares" }, { status: 422 });
      documentDataToUpdate.auto_approval_shares = autoShares;
    }
    if (updateData.member_number_format !== undefined) {
      if (typeof updateData.member_number_format !== "string" || updateData.member_number_format.length > 30) {
        return NextResponse.json({ error: "Invalid member number format" }, { status: 422 });
      }
      documentDataToUpdate.member_number_format = String(updateData.member_number_format)
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
    }

    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      documentDataToUpdate
    );

    return NextResponse.json(updatedDocument);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to update cooperative:`, error);
    return NextResponse.json(
      { error: "Failed to update cooperative" },
      { status: 500 }
    );
  }
}

// DELETE /api/coops/[coopId] - Delete a cooperative
export async function DELETE(request, { params }) {
  try {
    const { coopId } = await params;
    
    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    requireRole(await resolveSession(), ["superuser", "superadmin"]);

    const { databases } = createAdminClient();

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to delete cooperative:`, error);
    return NextResponse.json(
      { error: "Failed to delete cooperative" },
      { status: 500 }
    );
  }
}
