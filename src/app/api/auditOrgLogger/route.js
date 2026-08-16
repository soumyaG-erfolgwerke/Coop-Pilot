import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORG_LOGS,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { requireAuditOrgAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";
import { boundedId, boundedText, validateStrictObject } from "@/lib/validation/strict-object";

// GET /api/auditOrgLogger - Get all log notes for an audit org based on role access
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const auditOrgId = searchParams.get("auditOrgId");

    if (!auditOrgId) {
      return NextResponse.json(
        { success: false, error: "auditOrgId is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();
    const session = await requireAuditOrgAccess(auditOrgId);
    const role = session.role;

    const queries = [
      Query.equal("auditOrgId", auditOrgId),
      Query.orderDesc("$createdAt"),
    ];

    // Access control based on user role:
    // org_admin -> gets all logs (org_admin, auditer, aud_E)
    // auditer -> gets auditer and aud_E logs
    // aud_E -> gets aud_E logs only
    if (role === "org_admin") {
      queries.push(Query.equal("for", ["org_admin", "auditer", "aud_E"]));
    } else if (role === "auditer") {
      queries.push(Query.equal("for", ["auditer", "aud_E"]));
    } else if (role === "aud_E") {
      queries.push(Query.equal("for", ["aud_E"]));
    } else if (role) {
      queries.push(Query.equal("for", role));
    } else {
      // If no valid role is identified, return an empty list as a fail-safe
      return NextResponse.json({ success: true, documents: [], total: 0 });
    }

    // pagination
    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 10));

    const offset = (page - 1) * limit;

    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));

    const list = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORG_LOGS,
      queries,
    );

    const logs = list.documents.map((doc) => stripInternalFields(doc));

    // console.log("Fetched audit org logs:", logs);
    return NextResponse.json({ success: true, documents: logs, total: list.total });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching audit org logs:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch audit org logs" },
      { status: 500 },
    );
  }
}

// POST /api/auditOrgLogger - Add a new log note for an audit org
// * If backend function is needed to call in backend & not through frontend use 
// * createAuditLog({ auditOrgId, logNote, role }) function from @/lib/helpers/_loggerHelper.js
export async function POST(request) {
  try {
    const body = await request.json();
    const shape = validateStrictObject(body, ["auditOrgId", "logNote"], { maxBytes: 4096 });
    if (!shape.ok) return NextResponse.json({ success: false, error: shape.error }, { status: 400 });
    const auditOrgId = boundedId(body.auditOrgId);
    const logNote = boundedText(body.logNote, { min: 1, max: 2000, required: true });

    if (!auditOrgId || !logNote) {
      return NextResponse.json(
        { success: false, error: "auditOrgId and logNote are required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();
    const session = await requireAuditOrgAccess(auditOrgId);
    const role = session.role;
    const doc = {
      auditOrgId,
      logNote,
      for: role,
    };

    const created = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORG_LOGS,
      ID.unique(),
      doc,
    );

    return NextResponse.json({ success: true, document: created });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error adding audit org log note:", error);
    return NextResponse.json(
      { success: false, error: "Could not add audit org log note" },
      { status: 500 },
    );
  }
}
