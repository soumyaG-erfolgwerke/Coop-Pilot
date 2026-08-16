// org_admin will be able to get info of all coop's current audit deadline of his own org and will be able to update deadline of all coops of his org

import { NextResponse } from "next/server";
import { Query } from "appwrite";
import {
  DATABASE_ID,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDIT_ORGS,
  createAdminClient,
} from "@/lib/appwrite-server";

import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const auditOrgResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", auth.email)],
    );

    if (!auditOrgResponse.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to any audit organization",
        },
        { status: 403 },
      );
    }

    const auditOrg = auditOrgResponse.documents[0];

    // pagination for coops
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 10));
    const offset = (page - 1) * limit;

    const coopResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [
        Query.equal("auditOrgId", auditOrg.$id),
        Query.limit(limit),
        Query.offset(offset),
      ],
    );

    const currentAuditIds = coopResponse.documents
      .map((coop) => coop.currentAuditId)
      .filter(Boolean);

    if (currentAuditIds.length === 0) {
      return NextResponse.json({
        success: true,
        coops: coopResponse.documents.map((coop) => ({
          id: coop.$id,
          name: coop.name,
          RegNumber: coop.RegNumber,
          auditOrgId: coop.auditOrgId,
          auditFormId: coop.auditFormId,
          logo: coop.logo,
          currentAuditId: null,
          currentAuditDeadline: null,
          currentAuditStatus: null,
          leadAuditorId: null,
          leadAuditorName: null,
          leadAuditorEmail: null,
          isAllowedToEdit: auditOrg.admin_email === auth.email && false, // no audit, so no one can edit
        })),
        total: coopResponse.total,
        page,
        limit,
      });
    }

    const deadlinesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      [Query.equal("$id", currentAuditIds)],
    );
    const leadAuditorIds = deadlinesResponse.documents
      .map((audit) => audit.auditorId)
      .filter(Boolean);

    const leadAuditorsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("$id", leadAuditorIds)],
    );

    const coopsWithDeadline = coopResponse.documents.map((coop) => {
      const deadline = deadlinesResponse.documents.find(
        (d) => d.$id === coop.currentAuditId,
      );
      const leadAuditor = leadAuditorsResponse.documents.find(
        (a) => a.$id === deadline?.auditorId,
      );
      return {
        id: coop.$id,
        name: coop.name,
        RegNumber: coop.RegNumber,
        auditOrgId: coop.auditOrgId,
        auditFormId: coop.auditFormId,
        logo: coop.logo,
        currentAuditId: coop.currentAuditId,
        currentAuditDeadline: deadline?.deadline,
        currentAuditStatus: deadline?.status,
        leadAuditorId: leadAuditor?.$id || null,
        leadAuditorName: leadAuditor ? leadAuditor.name : null,
        leadAuditorEmail: leadAuditor ? leadAuditor.email : null,
        isAllowedToEdit: auditOrg.admin_email === auth.email && coop.currentAuditId && (deadline.status === "SUBMITTED" || deadline.status === "UNDER_REVIEW"),
      };
    });

    return NextResponse.json({
      success: true,
      coops: coopsWithDeadline,
      total: coopResponse.total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching coops with deadlines:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching coops with deadlines",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();
    const { auditId, deadline } = await request.json();

    // Validate input
    if (!auditId || !deadline) {
      return NextResponse.json(
        { success: false, error: "auditId and deadline are required" },
        { status: 400 },
      );
    }
    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime()) || parsedDeadline <= new Date()) {
      return NextResponse.json({ success: false, error: "Deadline must be a valid future date" }, { status: 400 });
    }

    // Check if the audit belongs to a coop under this org admin's audit organization
    const auditHistoryResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
    );

    if (!auditHistoryResponse) {
      return NextResponse.json(
        { success: false, error: "Audit history not found" },
        { status: 404 },
      );
    }

    if (
      auditHistoryResponse.status !== "SUBMITTED" &&
      auditHistoryResponse.status !== "UNDER_REVIEW"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot update deadline for audits that are not in SUBMITTED or UNDER_REVIEW status",
        },
        { status: 400 },
      );
    }

    let auditOrgId;
    if (!auditHistoryResponse.auditOrgId && auditHistoryResponse.coopId) {
      const coopResponse = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        auditHistoryResponse.coopId,
      );

      auditOrgId = coopResponse.auditOrgId;
    } else if (auditHistoryResponse.auditOrgId) {
      auditOrgId = auditHistoryResponse.auditOrgId;
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid audit history. Does not have coopId & auditOrgId stored",
        },
        { status: 400 },
      );
    }

    const auditOrgResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrgId,
    );

    if (auditOrgResponse.admin_email !== auth.email) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update this deadline",
        },
        { status: 403 },
      );
    }

    // Update the deadline
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
      { deadline: parsedDeadline.toISOString() },
    );

    // Create Audit Log note
    try {
      const { createAuditLog } = await import("@/lib/helpers/_loggerHelper");
      await createAuditLog({
        auditOrgId,
        logNote: `Audit deadline for audit ID ${auditId} was updated to ${deadline}.`,
        role: auth.role,
      });
    } catch (logErr) {
      console.error("Failed to write audit org log:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: "Deadline updated successfully",
    });
  } catch (error) {
    console.error("Error updating deadline:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while updating the deadline",
      },
      { status: 500 },
    );
  }
}
