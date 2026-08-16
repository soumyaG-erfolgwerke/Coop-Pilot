import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_CURRENT_AUDIT_FORM,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { requireAuditEditor } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

// PATCH /api/auditServices/[coopId]/status/start - Update audit status
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    const session = await requireAuditEditor(coopId);
    const body = await request.json();
    const { formType, orgId } = body;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();
    const coop = await databases.getDocument(DATABASE_ID, COLLECTION_ID_COOPERATIVES, coopId);
    const assignedOrgId = coop.auditOrgId?.$id || coop.auditOrgId;
    if (!assignedOrgId || (orgId && orgId !== assignedOrgId)) {
      return NextResponse.json({ success: false, error: "Invalid audit organization" }, { status: 400 });
    }
    if (typeof formType !== "string" || formType.length < 1 || formType.length > 100) {
      return NextResponse.json({ success: false, error: "Invalid audit form type" }, { status: 400 });
    }

    const auditTemplate = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_CURRENT_AUDIT_FORM,
      [
        Query.equal("orgId", assignedOrgId),
        Query.equal("auditType", formType),
        Query.orderDesc("$createdAt"),
        Query.select(["*", "auditForms", "auditForms.*"]),
        Query.limit(1),
      ],
    );

    if (!auditTemplate.documents || auditTemplate.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active audit template found for this organization and type" },
        { status: 404 },
      );
    }

    const auditTemplateId = auditTemplate.documents[0].auditForms?.$id;
    const auditTemplateData = auditTemplate.documents[0].auditForms?.template;

    let parsedTemplate = {};
    try {
      parsedTemplate = typeof auditTemplateData === "string"
        ? JSON.parse(auditTemplateData)
        : JSON.parse(JSON.stringify(auditTemplateData || {}));
    } catch (e) {
      parsedTemplate = {};
    }
    parsedTemplate.auditType = formType;

    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      {
        auditStatus: "START",
        auditFormId: auditTemplateId,
        auditJson: JSON.stringify(parsedTemplate),
      },
    );

    // Create Audit Log note for starting audit
    try {
      const role = session.role;
      if (role && ["org_admin", "auditer", "aud_E"].includes(role) && assignedOrgId) {
        const { createAuditLog } = await import("@/lib/helpers/_loggerHelper");
        await createAuditLog({
          auditOrgId: assignedOrgId,
          logNote: `Audit process started for cooperative "${updatedDocument.name}" (${coopId}) with form type "${formType}".`,
          role,
        });
      }
    } catch (logErr) {
      console.error("Failed to write start audit status log:", logErr);
    }

    return NextResponse.json({ success: true, document: updatedDocument });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to update audit status:`, error);
    return NextResponse.json(
      { success: false, error: "Could not update audit status" },
      { status: 500 },
    );
  }
}
