import {
  COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
  COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { buildMasterState } from "@/lib/founding-audit/compute";
import {
  G1ValidationSchema,
  G2ValidationSchema,
  G3ValidationSchema,
  G4ValidationSchema,
  G5ValidationSchema,
  G6ValidationSchema,
  G7ValidationSchema,
} from "@/lib/founding-audit/schema";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { z } from "zod";
import { requireAuditOrgAccess, requireAuditStaff } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const ROLES = new Set(["org_admin", "auditer", "aud_E"]);

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status: status });

export const getFoundingAuditById = async (databases, auditId) => {
  const result = await databases.getDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
    documentId: auditId,
  });

  // console.log("[getFoundingAuditById]", auditId, result);
  return result;
};

export const getFoundingAuditsMembers = async (databases, auditId) => {
  const result = await databases.listDocuments({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
    queries: [Query.equal("auditId", auditId), Query.limit(100)],
  });

  // console.log("[getFoundingAuditsMembers]", auditId, result);
  return result;
};

const updateFoundingAudit = async (databases, auditId, updateData) => {
  const result = await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
    documentId: auditId,
    data: updateData,
  });

  // console.log("[updateFoundingAudit]", auditId, updateData, result);
  return result;
};

const deleteFoundingAudit = async (databases, auditId) => {
  const result = await databases.deleteDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
    documentId: auditId,
  });

  // console.log("[deleteFoundingAudit]", auditId, result);
  return result;
};

/**
 * GET(Fetch) a single founding audit instance by ID, along with its members and phase data.
 * Should be fired when user clicks into a specific Founding Audit instance from the dashboard list.
 * Expects example URL: /api/orgadmin/founding-audit/6a2653c2002b270e4149/
 */
export const GET = async (req, { params }) => {
  try {
    await requireAuditStaff();
    const { id: auditId } = await params;
    if (!auditId) {
      return NextErrorJson("Audit ID is required", 400);
    }

    const { databases } = createAdminClient();

    let auditDoc;
    try {
      auditDoc = await getFoundingAuditById(databases, auditId);
    } catch (error) {
      return NextErrorJson("Founding audit not found", 404);
    }
    await requireAuditOrgAccess(auditDoc.auditOrgId);

    const membersList = await getFoundingAuditsMembers(databases, auditId);

    const formData = JSON.parse(auditDoc.phaseDataJson) ?? {};
    const masterState = await buildMasterState(auditDoc, membersList, formData);

    return NextResponse.json({ status: 200, data: masterState });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to fetch founding audit");
  }
};

/**
 * PUT(Update) phase data and status to Appwrite.
 * Should be fired when user clicks "Save Draft" or "Submit Phase" buttons on the phase forms.
 * Expects URL: /api/orgadmin/founding-audit/[auditId]
 * Expects json body: { phaseId: "G1-G7", isSubmit: true/false, data: {} G1-G7(any 1 phase) } //!Defined in mockData.js
 */
const paramsSchema = z.object({
  id: z.string().min(1, "Audit ID path parameter is required."),
});

const reqSchema = z.object({
  phaseId: z.enum(["G1", "G2", "G3", "G4", "G5", "G6", "G7"], {
    errorMap: () => ({ message: "Invalid or unsupported phase identifier." }),
  }),
  isSubmit: z.boolean(),
  data: z.record(z.any(), { message: "Phase data must be a valid object." }),
});

const PHASE_VALIDATION_STRATEGIES = {
  G1: G1ValidationSchema,
  G2: G2ValidationSchema,
  G3: G3ValidationSchema,
  G4: G4ValidationSchema,
  G5: G5ValidationSchema,
  G6: G6ValidationSchema,
  G7: G7ValidationSchema,
};

export const PUT = async (req, { params }) => {
  try {
    await requireAuditStaff();

    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      const errorMessages = parsedParams.error.errors[0].message;
      return NextErrorJson(`[PUT-AUDIT] ${errorMessages}`, 400);
    }
    const { id: auditId } = parsedParams.data;

    const parsedBody = reqSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      const errorDetails = parsedBody.error.issues
        .map((issue) => issue.message)
        .join("\n");
      return NextErrorJson(`[PUT-AUDIT] ${errorDetails}`, 400);
    }
    const { phaseId, isSubmit, data } = parsedBody.data;

    const { databases } = createAdminClient();

    // 1. Fetch current document state from Appwrite
    let auditDoc;
    try {
      auditDoc = await getFoundingAuditById(databases, auditId);
    } catch (error) {
      return NextErrorJson("Founding audit not found", 404);
    }
    await requireAuditOrgAccess(auditDoc.auditOrgId);

    if (auditDoc.globalStatus === "SUBMITTED") {
      return NextErrorJson("Finalized audit record is unmodifiable.", 403);
    }

    // 2. Decode the current nested JSON storage structures safely
    const currentStatus = JSON.parse(auditDoc.phaseStatusJson) ?? {};
    const currentDataPayload = JSON.parse(auditDoc.phaseDataJson) ?? {};

    // 3. Process the validation and state status transitions
    if (isSubmit) {
      const activeValidatorSchema = PHASE_VALIDATION_STRATEGIES[phaseId];

      const fieldCheck = activeValidatorSchema.safeParse(data);
      if (!fieldCheck.success) {
        const errorMessages = fieldCheck.error.issues
          .map((issue) => issue.message)
          .join("\n");
        return NextErrorJson(`[PUT-AUDIT] ${errorMessages}`, 400);
      }

      currentStatus[phaseId] = "SUBMITTED";
    } else {
      currentStatus[phaseId] = "DRAFT";
    }

    // 4. Merge incoming data slice safely into the core phase dictionary key
    currentDataPayload[`${phaseId}Data`] = data;

    const FINAL_DATA = {
      phaseStatusJson: JSON.stringify(currentStatus),
      phaseDataJson: JSON.stringify(currentDataPayload),
      currentPhase: phaseId,
    };

    //! CRITICAL: If mutating Phase G1, flatten core properties onto flat columns for query filters
    if (phaseId === "G1") {
      FINAL_DATA.coopName = data.coopName ?? auditDoc.coopName;
      FINAL_DATA.proposedCity = data.proposedCity ?? auditDoc.proposedCity;
      FINAL_DATA.sector = data.sector ?? auditDoc.sector;
    }

    // 6. Push a clean, unified document patch operation up to Appwrite
    auditDoc = await updateFoundingAudit(databases, auditId, FINAL_DATA);

    return NextResponse.json({
      status: 200,
      message: `Phase ${phaseId.toUpperCase()} synchronization executed successfully.`,
      isSubmitted: isSubmit,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to update founding audit");
  }
};

/**
 * PATCH(Update) a founding audit instance.
 * Fires when user clicks "Archive Audit" button in the audit details view.
 * Expects URL: /api/orgadmin/founding-audit/[auditId]
 */
export const PATCH = async (req, { params }) => {
  try {
    const { id: auditId } = await params;
    if (!auditId) {
      return NextErrorJson("Audit ID path parameter is required.", 400);
    }

    await requireAuditStaff();

    const body = await req.json();
    if (!body) {
      return NextErrorJson("Request body is required.", 400);
    }

    const { databases } = createAdminClient();
    const auditDoc = await getFoundingAuditById(databases, auditId);
    await requireAuditOrgAccess(auditDoc.auditOrgId);
    const allowed = {};
    if (body.globalStatus === "DELETED") allowed.globalStatus = "DELETED";
    if (Object.keys(allowed).length === 0) return NextErrorJson("Unsupported audit update.", 400);
    await updateFoundingAudit(databases, auditId, allowed);

    return NextResponse.json({
      status: 200,
      message: "Audit updated successfully.",
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to update founding audit state");
  }
};
