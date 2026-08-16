import {
  COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { z } from "zod";
import { requireAuditOrgAccess, requireAuditStaff } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const ROLES = new Set(["org_admin", "auditer", "aud_E"]);

const NextErrorJson = (message, status = 500) =>
  NextResponse.json({ success: false, error: message }, { status: status });

const getAllOrgFoundingAudits = async (databases, auditOrgId) => {
  const result = await databases.listDocuments({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
    queries: [
      Query.equal("auditOrgId", auditOrgId),
      Query.notEqual("globalStatus", "DELETED"),
      Query.select([
        "$id",
        "$createdAt",
        "$updatedAt",
        "coopName",
        "proposedCity",
        "sector",
        "auditName",
        "auditOrgId",
        "createdBy",
        "submittedBy",
        "submittedAt",
        "globalStatus",
        "gutachtenUrl",
        "gutachtenResult",
      ]),
    ],
  });

  // console.log("[getAllOrgFoundingAudits]", auditOrgId, result);
  return result;
};

const createNewFoundingAudit = async (
  databases,
  auditOrgId,
  createdBy,
  auditName,
) => {
  const DOC_ID = ID.unique();
  const result = await databases.createDocument({
    databaseId: DATABASE_ID,
    collectionId: COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
    documentId: DOC_ID,
    data: { auditOrgId, createdBy, auditName },
  });

  // console.log("[createNewFoundingAudit]", auditOrgId, createdBy, auditName);
  return result;
};

/**
 * GET(Fetch) all founding audit instances for given Audit organization.
 * Should be fired when Founding Audit Tab is mounted on org admin dashboard.
 * Expects example URL: /api/orgadmin/founding-audit?orgId=6a22a9ae00335d644013
 */
export const GET = async (req) => {
  try {
    await requireAuditStaff();
    const orgId = new URL(req.url).searchParams.get("orgId");
    if (!orgId) {
      return NextErrorJson("Audit Organization ID is required", 400);
    }
    await requireAuditOrgAccess(orgId);

    const { databases } = createAdminClient();

    const result = await getAllOrgFoundingAudits(databases, orgId);

    return NextResponse.json({ status: 200, data: result });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to fetch founding audits");
  }
};

/**
 * POST(Create) a new founding audit instance.
 * Should be fired when "Create New" button is clicked on Founding Audit dashboard.
 * Expects URL: /api/orgadmin/founding-audit/
 * Expects json body: { orgId: "6a22a9ae00335d644013", createdBy: "6a22a9ae00335d644013" }
 */
const reqSchema = z.object({
  orgId: z.string("Invalid orgId format."),
  createdBy: z.string("Invalid createdBy format."),
  auditName: z.string("Invalid auditName."),
});

export const POST = async (req) => {
  try {
  const session = await requireAuditStaff();
  const parseReq = reqSchema.safeParse(await req.json());

  if (!parseReq.success) {
    const errorMessages = parseReq.error.errors[0].message;
    return NextErrorJson(`[CREATE-AUDIT]: ${errorMessages}`, 400);
  }
  const { orgId, auditName } = parseReq.data;

    await requireAuditOrgAccess(orgId);
    const { databases } = createAdminClient();
    const result = await createNewFoundingAudit(
      databases,
      orgId,
      session.userId,
      auditName,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextErrorJson("Failed to create founding audit");
  }
};
