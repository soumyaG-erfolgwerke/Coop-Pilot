import {
  getFoundingAuditById,
  getFoundingAuditsMembers,
} from "@/app/api/orgadmin/founding-audit/[id]/route";
import { uploadFileBuffer } from "@/app/api/orgadmin/founding-audit/upload/route";
import {
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { buildGutachtenPdf } from "@/lib/founding-audit/buildGutachten";
import { generatePdfPayload } from "@/lib/founding-audit/compute";
import { G7ValidationSchema } from "@/lib/founding-audit/schema";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireAuditOrgAccess, requireAuditStaff } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const updateFoundingAudit = async (databases, auditId, updateData) => {
  const result = await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
    documentId: auditId,
    data: updateData,
  });
  return result;
};

const getAuditOrgDetails = async (databases, auditOrgId) => {
  const result = await databases.getDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_AUDIT_ORGS,
    documentId: auditOrgId,
    queries: [Query.select(["OrgName", "logo_url", "letterhead_url"])],
  });

  return {
    orgName: result.OrgName,
    logoUrl: result.logo_url,
    letterheadUrl: result.letterhead_url,
  };
};

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status: status });

export const POST = async (req, { params }) => {
  try {
    const session = await requireAuditStaff();
    const { id: auditId } = await params;
    if (!auditId) {
      return NextErrorJson("Audit ID path parameter is required.", 400);
    }

    const payload = await req.json();

    const parseReq = G7ValidationSchema.safeParse(payload);
    if (!parseReq.success) {
      const errorDetails = parseReq.error.issues
        .map((issue) => issue.message)
        .join("\n");
      return NextErrorJson(`Validation error: ${errorDetails}`, 422);
    }

    const { databases, storage } = createAdminClient();

    const auditDoc = await getFoundingAuditById(databases, auditId);
    await requireAuditOrgAccess(auditDoc.auditOrgId);
    const membersList = await getFoundingAuditsMembers(databases, auditId);
    const auditOrgDetails = await getAuditOrgDetails(
      databases,
      auditDoc.auditOrgId,
    );

    if (auditDoc.globalStatus === "SUBMITTED") {
      return NextErrorJson("Finalized audit record is unmodifiable.", 403);
    }

    const phaseData = JSON.parse(auditDoc.phaseDataJson || "{}");

    const pdfPayload = generatePdfPayload(
      auditDoc,
      auditOrgDetails,
      membersList,
      phaseData,
      payload,
    );

    const pdfBuffer = await buildGutachtenPdf(pdfPayload);

    const filename = `gutachten_${auditOrgDetails.orgName}_${auditDoc.coopName}_${new Date().toISOString().replace(/:/g, "-")}.pdf`;

    const pdfUrl = await uploadFileBuffer({
      storage: storage,
      buffer: pdfBuffer,
      filename: filename,
    });

    const updateData = {
      gutachtenUrl: pdfUrl.fileUrl,
      gutachtenResult: payload.gutachtenResult,
      globalStatus: "SUBMITTED",
      gutachtenConditions: payload.gutachtenConditions ?? "",
      submittedAt: new Date().toISOString(),
      submittedBy: session?.userId,
    };

    await updateFoundingAudit(databases, auditId, updateData);

    return NextResponse.json(
      {
        success: true,
        message: "PDF generated and saved successfully.",
        data: {
          fileUrl: pdfUrl.fileUrl,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson(
      `[GENERATE-GUTACHTEN] Internal Engine Error: ${error.message}`,
    );
  }
};
