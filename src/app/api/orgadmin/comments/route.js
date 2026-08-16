import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ORG_COMMENTS,
  COLLECTION_ID_ORG_ISSUES,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { createRollbackManager } from "@/lib/rollbackService";
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

// GET /api/orgadmin/comments?issueId=xxx - Get comments for an issue along with pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get("issueId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    if (!issueId) {
      return NextResponse.json(
        { success: false, error: "Issue ID is required" },
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
    const issue = await databases.getDocument(DATABASE_ID, COLLECTION_ID_ORG_ISSUES, issueId);
    await requireAuditOrgAccess(issue.auditOrgId);
    const commentsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ORG_COMMENTS,
      [
        Query.equal("issueId", issueId),
        Query.orderAsc("$createdAt"),
        Query.limit(limit),
        Query.offset((page - 1) * limit),
      ],
    );

    const comments = commentsResponse.documents.map((comment) =>
      stripInternalFields(comment),
    );

    return NextResponse.json(
      {
        success: true,
        comments,
        total: commentsResponse.total,
        page,
        limit,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

// POST /api/orgadmin/comments - Create a new comment for an issue can only be created by org_admin or audit_team_members

export async function POST(request) {
  const rollback = createRollbackManager();
  try {
    const { issueId, message } = await request.json();
    if (!issueId || !message) {
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
    if (typeof message !== "string" || message.trim().length < 1 || message.length > 5000) {
      return NextResponse.json({ success: false, error: "Invalid comment" }, { status: 400 });
    }

    if (issueResponse.status === "resolved") {
      return NextResponse.json(
        { success: false, error: "Cannot comment on a resolved issue" },
        { status: 400 },
      );
    }

    const commentData = {
      issueId,
      message,
      authorEmail: auth.email,
      authorRole: auth.role,
    };

    const createdComment = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_ORG_COMMENTS,
      ID.unique(),
      commentData,
    );

    rollback.add(async () => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_ORG_COMMENTS,
        createdComment.$id,
      );
    });

    const commentsCount = issueResponse.commentCount || 0;

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ORG_ISSUES,
      issueId,
      { commentCount: commentsCount + 1 },
    );

    rollback.add(async () => {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_ORG_ISSUES,
        issueId,
        { commentCount: commentsCount },
      );
    });

    return NextResponse.json(
      {
        success: true,
        comment: stripInternalFields(createdComment),
        issue: stripInternalFields(issueResponse),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error creating comment:", error);
    await rollback.execute();
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 },
    );
  }
}
