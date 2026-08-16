import { NextResponse } from "next/server";
import {
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_COOP_REPORTS,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { ID } from "node-appwrite";
import { requireAuditEditor, requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(request, { params }) {
  try {
    const { auditId } = await params;

    const { databases } = createAdminClient();

    const document = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
    );
    await requireCoopAuditAccess(document.coopId);

    const auditorId = document.auditorId;
    let auditorRes = null;
    if (auditorId) {
      try {
        auditorRes = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDITTEAM_MEMBERS,
          auditorId,
        );
      } catch (err) {
        console.error(
          `Failed to fetch auditor document for ID ${auditorId}:`,
          err,
        );
      }
    }

    const auditHistory = {
      ...document,
      auditorName: auditorRes?.name || null,
      auditorEmail: auditorRes?.email || null,
    };
    return NextResponse.json({
      success: true,
      document: auditHistory,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Audit not found",
      },
      { status: 404 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { auditId } = await params;
    const body = await request.json();
    const {
      rawReportData,
      auditReportUrl,
      macros,
      submit = false,
      coopId,
      coopName,
      fiscalYear,
      userEmail,
    } = body;

    const { databases } = createAdminClient();

    // Fetch existing document to prevent updates once the PDF report has been generated
    const existingDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId
    );
    const session = await requireAuditEditor(existingDoc.coopId);
    if (coopId && coopId !== existingDoc.coopId) {
      return sessionErrorResponse({ status: 403 });
    }

    if (existingDoc && existingDoc.auditReportUrl && existingDoc.auditReportUrl.trim() !== "") {
      return NextResponse.json(
        {
          success: false,
          error: "This report has already been generated and published. Editing is disabled.",
        },
        { status: 400 }
      );
    }

    const updateFields = {};
    if (rawReportData !== undefined) {
      updateFields.rawReportData = rawReportData;
    }
    if (auditReportUrl !== undefined) {
      updateFields.auditReportUrl = auditReportUrl;
    }
    if (macros !== undefined) {
      updateFields.macros = typeof macros === "object" ? JSON.stringify(macros) : macros;
    }

    const document = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
      updateFields
    );

    if (submit) {
      if (!coopId || !auditReportUrl) {
        return NextResponse.json(
          {
            success: false,
            error: "coopId and auditReportUrl are required to submit/publish the report.",
          },
          { status: 400 }
        );
      }

      try {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID_COOP_REPORTS,
          ID.unique(),
          {
            coopId: existingDoc.coopId,
            reportName: `Audit Report - ${coopName || "Cooperative"}`,
            reportType: "AUDIT_REPORT",
            fiscalYear: Number(fiscalYear) || new Date().getFullYear(),
            generatedBy: session.email,
            pdfUrl: auditReportUrl,
          }
        );
      } catch (reportError) {
        console.error("Failed to log audit report in COLLECTION_ID_COOP_REPORTS:", reportError);
        // We do not throw the error to prevent failing the primary auditHistory update
      }
    }

    return NextResponse.json({
      success: true,
      document: stripInternalFields(document),
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Failed to patch audit history report data:", error);
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to update report data"),
      },
      { status: 500 }
    );
  }
}

