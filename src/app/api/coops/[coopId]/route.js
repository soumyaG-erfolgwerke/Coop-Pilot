import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";

// GET /api/coops/[coopId] - Get a specific cooperative
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    
    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const document = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    return NextResponse.json(document);
  } catch (error) {
    console.error(`Failed to get cooperative:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to get cooperative" },
      { status: 500 }
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

    const updateData = await request.json();
    const { databases } = createAdminClient();

    // Prepare the update data
    const documentDataToUpdate = {};
    
    if (updateData.name !== undefined) documentDataToUpdate.name = updateData.name;
    if (updateData.adminEmails !== undefined) documentDataToUpdate.admins = updateData.adminEmails;
    if (updateData.country !== undefined) documentDataToUpdate.country = updateData.country;
    if (updateData.state !== undefined) documentDataToUpdate.state = updateData.state;
    if (updateData.sector !== undefined) documentDataToUpdate.sector = updateData.sector;
    if (updateData.sharePrice !== undefined) documentDataToUpdate.sharePrice = parseFloat(updateData.sharePrice);
    if (updateData.court !== undefined) documentDataToUpdate.CourtName = updateData.court;
    if (updateData.regNumber !== undefined) documentDataToUpdate.RegNumber = updateData.regNumber;
    if (updateData.about !== undefined) documentDataToUpdate.about = updateData.about;
    if (updateData.logoUrl !== undefined) documentDataToUpdate.logo = updateData.logoUrl;
    if (updateData.bannerUrl !== undefined) documentDataToUpdate.bannerUrl = updateData.bannerUrl;
    // Sensitive fields like ibanNumber, bicNumber, isLive must not be
    // patchable via this generic route. They are managed via the
    // /api/cooperative/settings/[coopId] route which enforces validation and audit logging.
    if (updateData.max_shares !== undefined) {
      documentDataToUpdate.max_shares = Number.parseInt(updateData.max_shares, 10);
    }
    if (updateData.auto_approval_membership !== undefined || updateData.autoApprovalMembership !== undefined) {
      const membershipValue =
        updateData.auto_approval_membership !== undefined
          ? updateData.auto_approval_membership
          : updateData.autoApprovalMembership;
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
      documentDataToUpdate.auto_approval_shares = Number.parseInt(sharesValue, 10);
    }
    if (updateData.member_number_format !== undefined) {
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
    console.error(`Failed to update cooperative:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update cooperative" },
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

    const { databases } = createAdminClient();

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete cooperative:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete cooperative" },
      { status: 500 }
    );
  }
}
