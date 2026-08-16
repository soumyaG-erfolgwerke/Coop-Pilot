import {
  COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
  COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { G4ItemSchema } from "@/lib/founding-audit/schema";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { requireAuditOrgAccess, requireAuditStaff } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const ROLES = new Set(["org_admin", "auditer", "aud_E"]);

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status: status });

const requireFoundingAuditAccess = async (databases, auditId) => {
  const audit = await databases.getDocument(DATABASE_ID, COLLECTION_ID_FOUNDING_AUDIT_INSTANCES, auditId);
  await requireAuditOrgAccess(audit.auditOrgId);
  return audit;
};

const getMemberDocById = async (databases, auditId) => {
  const result = await databases.listDocuments({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
    queries: [
      Query.equal("auditId", auditId),
      Query.equal("memberType", "FOUNDING_MEMBER"),
      Query.limit(100),
    ],
  });
  // console.log("[getMemberDocById]", auditId, result);
  return result;
};

const createMemberDoc = async (databases, auditId, memberType) => {
  const result = await databases.createDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
    documentId: ID.unique(),
    data: { auditId, memberType },
  });
  // console.log("[createMemberDoc]", auditId, memberType);
  return result;
};

const updateMemberDoc = async (databases, memberId, rowData) => {
  const result = await databases.updateDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
    documentId: memberId,
    data: rowData,
  });
  // console.log("[updateMemberDoc]", memberId, rowData);
  return result;
};

const deleteMemberDoc = async (databases, memberId) => {
  const result = await databases.deleteDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
    documentId: memberId,
  });
  // console.log("[deleteMemberDoc]", memberId);
  return result;
};

/**
 * GET(Fetch) all member documents linked to a specific founding audit instance.
 * Should be fired when an individual audit instance is opened and its G4 phase data needs to be loaded.
 * Expects example URL: /api/orgadmin/founding-audit/6a2653c2002b270e4149/members
 */
export const GET = async (req, { params }) => {
  try {
    await requireAuditStaff();
    const { id: auditId } = await params;
    if (!auditId) {
      return NextErrorJson("Audit ID path parameter is required.", 400);
    }

    const { databases } = createAdminClient();
    await requireFoundingAuditAccess(databases, auditId);
    const result = await getMemberDocById(databases, auditId);
    const resultDocs = result.documents.map(stripInternalFields);

    return NextResponse.json({ success: true, data: resultDocs });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to fetch founding audit members");
  }
};

/**
 * POST(Create) a brand new member row entry in FoundingAuditMembers.
 * Triggered on adding a new member in G4.
 * Expects URL: /api/orgadmin/founding-audit/{auditId}/members with JSON body payload containing the member data fields.
 */
export const POST = async (req, { params }) => {
  try {
    await requireAuditStaff();
    const { id: auditId } = await params;
    if (!auditId) {
      return NextErrorJson("Audit ID path parameter is required.", 400);
    }

    const body = await req.json();
    const memberType = body.memberType;

    if (!memberType) {
      return NextErrorJson("Field 'memberType' is required.", 400);
    }

    const { databases } = createAdminClient();
    await requireFoundingAuditAccess(databases, auditId);
    const result = await createMemberDoc(databases, auditId, memberType);
    const resultDoc = stripInternalFields(result);

    return NextResponse.json(
      { success: true, data: resultDoc },
      { status: 201 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to create founding audit member");
  }
};

/**
 * PUT(Update) an existing member row document.
 * Fires when modifying an existing member's information in G4.
 */
export const PUT = async (req, { params }) => {
  try {
    await requireAuditStaff();
    const { id: auditId } = await params;
    if (!auditId) {
      return NextErrorJson("Audit ID path parameter is required.", 400);
    }

    const body = await req.json();
    const { memberId, ...fieldPayload } = body;

    if (!memberId) {
      return NextErrorJson(
        "Target variable attribute 'memberId' is required in the payload body.",
        400,
      );
    }

    const parseReq = G4ItemSchema.safeParse(fieldPayload);
    if (!parseReq.success) {
      const errorDetails = parseReq.error.issues
        .map((issue) => issue.message)
        .join("\n");
      return NextErrorJson(`Validation error: ${errorDetails}`, 422);
    }

    const rowData = parseReq.data;

    if (rowData.memberType === "FOUNDING_MEMBER") {
      rowData.capitalCommittedEur =
        (rowData.shares || 0) * (rowData.shareValueEur || 0);
    } else {
      rowData.shares = null;
      rowData.shareValueEur = null;
      rowData.capitalCommittedEur = null;
    }

    const { databases } = createAdminClient();

    await requireFoundingAuditAccess(databases, auditId);
    const existingMember = await databases.getDocument(DATABASE_ID, COLLECTION_ID_FOUNDING_AUDIT_MEMBERS, memberId);
    if (existingMember.auditId !== auditId) return NextErrorJson("Member record not found.", 404);

    const result = await updateMemberDoc(databases, memberId, rowData);
    const resultDoc = stripInternalFields(result);

    return NextResponse.json(
      {
        success: true,
        message: "Member record modified successfully.",
        data: resultDoc,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to update founding audit member");
  }
};

/**
 * DELETE: Drops a member row document record out of the collection completely.
 * Fires when a member is removed from the G4 matrix layout.
 */
export const DELETE = async (req, { params }) => {
  try {
    await requireAuditStaff();
    const { id: auditId } = await params;
    if (!auditId) {
      return NextErrorJson("Audit ID path parameter is required.", 400);
    }

    const memberId = new URL(req.url).searchParams.get("memberId");
    if (!memberId) {
      return NextErrorJson(
        "Query parameter identifier 'memberId' is required.",
        400,
      );
    }

    const { databases } = createAdminClient();
    await requireFoundingAuditAccess(databases, auditId);
    const existingMember = await databases.getDocument(DATABASE_ID, COLLECTION_ID_FOUNDING_AUDIT_MEMBERS, memberId);
    if (existingMember.auditId !== auditId) return NextErrorJson("Member record not found.", 404);
    await deleteMemberDoc(databases, memberId);

    return NextResponse.json(
      { success: true, message: "Member record permanently removed." },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to delete founding audit member");
  }
};
