import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_CURRENT_AUDIT_FORM,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

// PATCH /api/auditServices/[coopId]/status/start - Update audit status
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    const body = await request.json();
    const { formType, orgId } = body;

    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditTemplate = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_CURRENT_AUDIT_FORM,
      [
        Query.equal("orgId", orgId),
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
      const auth = await getAuthenticatedProfile();
      const role = auth?.role;
      if (role && ["org_admin", "auditer", "aud_E"].includes(role) && orgId) {
        const { createAuditLog } = await import("@/lib/helpers/_loggerHelper");
        await createAuditLog({
          auditOrgId: orgId,
          logNote: `Audit process started for cooperative "${updatedDocument.name}" (${coopId}) with form type "${formType}".`,
          role,
        });
      }
    } catch (logErr) {
      console.error("Failed to write start audit status log:", logErr);
    }

    return NextResponse.json({ success: true, document: updatedDocument });
  } catch (error) {
    console.error(`Failed to update audit status:`, error);
    return NextResponse.json(
      { success: false, error: "Could not update audit status" },
      { status: 500 },
    );
  }
}
