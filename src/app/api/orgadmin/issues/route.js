import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_ORG_ISSUES,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { requireAuditOrgAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

const allowedRoles = [
  "org_admin",
  "auditer",
  "auditorE",
  "auditorT",
  "aud_E",
  "aud_T",
];

// GET /api/orgadmin/issues?auditOrgId=xxx - Get issues for an audit organization along with pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const auditOrgId = searchParams.get("auditOrgId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    if (!auditOrgId) {
      return NextResponse.json(
        { success: false, error: "Audit Organization ID is required" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (!auth || !allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    await requireAuditOrgAccess(auditOrgId);

    const { databases } = createAdminClient();
    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        { success: false, error: "Audit Organization not found" },
        { status: 404 },
      );
    }

    const offset = (page - 1) * limit;
    const issuesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ORG_ISSUES,
      [
        Query.equal("auditOrgId", auditOrg.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ],
    );

    const issues = issuesResponse.documents.map((issue) =>
      stripInternalFields(issue),
    );
    
    const totalIssues = issuesResponse.total;

    return NextResponse.json(
      { success: true, issues, totalIssues },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching issues" },
      { status: 500 },
    );
  }
}

// POST /api/orgadmin/issues - Create a new issue for an audit organization
export async function POST(request) {
  try {
    const { auditOrgId, title, description } = await request.json();
    if (!auditOrgId || !title || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (!auth || !allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    await requireAuditOrgAccess(auditOrgId);
    if (typeof title !== "string" || title.trim().length < 1 || title.length > 200 ||
        typeof description !== "string" || description.trim().length < 1 || description.length > 5000) {
      return NextResponse.json({ success: false, error: "Invalid issue content" }, { status: 400 });
    }

    const { databases } = createAdminClient();
    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        { success: false, error: "Audit Organization not found" },
        { status: 404 },
      );
    }

    const newIssue = {
      auditOrgId: auditOrg.$id,
      title,
      desc: description,
      status: "open",
      createdByEmail: auth.email,
      createdByRole: auth.role,
    };

    const createdIssue = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_ORG_ISSUES,
      ID.unique(),
      newIssue,
    );


    return NextResponse.json(
      { success: true, issue: stripInternalFields(createdIssue) },
      { status: 201 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while creating the issue" },
      { status: 500 },
    );
  }
}

// PATCH /api/orgadmin/issues/{issueId} - Update an existing issue to update status
export async function PATCH(request) {
  try {
    const { issueId, status } = await request.json();
    if (!issueId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!["open", "resolved"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (!auth || !allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();
    const issueResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_ORG_ISSUES,
      issueId,
    );

    if (!issueResponse) {
      return NextResponse.json(
        { success: false, error: "Issue not found" },
        { status: 404 },
      );
    }
    await requireAuditOrgAccess(issueResponse.auditOrgId);

    if (status === issueResponse.status) {
      return NextResponse.json(
        { success: false, error: `Issue is already ${status}` },
        { status: 400 },
      );
    }

    let resolvedAt = null;
    let resolvedByEmail = null;
    if (status === "resolved" && issueResponse.status !== "resolved") {
      resolvedAt = new Date().toISOString();
      resolvedByEmail = auth.email;
    }

    const updatedIssue = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ORG_ISSUES,
      issueId,
      { status, resolvedAt, resolvedByEmail },
    );

    return NextResponse.json(
      { success: true, issue: stripInternalFields(updatedIssue) },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while updating the issue" },
      { status: 500 },
    );
  }
}
