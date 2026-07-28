// auditors will be able to get info of all coop's current audit deadline of his own org and only able to update deadline of coops that are assigned to him
import { NextResponse } from "next/server";
import { Query } from "appwrite";
import {
  DATABASE_ID,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_COOPERATIVES,
  createAdminClient,
  COLLECTION_ID_TEAM_X_COOP,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "auditer") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email)],
    );

    if (!auditorResponse.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to any audit organization",
        },
        { status: 403 },
      );
    }

    const auditorMember = auditorResponse.documents[0];

    // pagination for coops
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    const coopResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [
        Query.equal("auditOrgId", auditorMember.auditOrgId),
        Query.limit(limit),
        Query.offset(offset),
      ],
    );

    // for all coops get the current audit deadline and return with coop info from auditHistory collection
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

    const leadAuditorIds = deadlinesResponse.documents.map(
      (deadline) => deadline.auditorId,
    );

    // get lead auditor info
    const leadAuditorsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("$id", leadAuditorIds)],
    );

    // assemble the response
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
        isAllowedToEdit: leadAuditor?.email === auth.email && coop.currentAuditId && (deadline.status === "SUBMITTED" || deadline.status === "UNDER_REVIEW"),
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
    console.error("Error fetching coop deadlines:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "auditer") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();
    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email)],
    );

    if (!auditorResponse.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to any audit organization",
        },
        { status: 403 },
      );
    }

    const auditorMember = auditorResponse.documents[0];
    
    const { deadline, auditId } = await request.json();
    if (!auditId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const auditHistory = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
    );

    if (!auditHistory) {
      return NextResponse.json(
        { success: false, error: "Audit history not found" },
        { status: 404 },
      );
    }

    if (auditHistory.auditorId !== auditorMember.$id) {
      const auditorAssignmentResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_TEAM_X_COOP,
        [
          Query.equal("coopId", auditHistory.coopId),
          Query.equal("userId", auditorMember.$id),
        ],
      );
      if (!auditorAssignmentResponse.documents.length) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not the lead auditor for this audit",
          },
          { status: 403 },
        );
      }
    }

    if (
      auditHistory.status !== "SUBMITTED" &&
      auditHistory.status !== "UNDER_REVIEW"
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

    if (!deadline) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
      { deadline },
    );

    // Create Audit Log note
    try {
      const { createAuditLog } = await import("@/lib/helpers/_loggerHelper");
      await createAuditLog({
        auditOrgId: auditorMember.auditOrgId,
        logNote: `Audit deadline for audit ID ${auditId} was updated to ${deadline}.`,
        role: "auditer",
      });
    } catch (logErr) {
      console.error("Failed to write auditor audit log:", logErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating audit deadline:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },

      { status: 500 },
    );
  }
}
