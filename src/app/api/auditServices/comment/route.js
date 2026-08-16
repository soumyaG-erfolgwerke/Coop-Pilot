import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_AUDITCOMMENTS } from "@/lib/appwrite-server";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";
import { sessionErrorResponse } from "@/lib/auth/session";

// GET /api/auditServices/comment?coopid=xxx - Get comments for a cooperative
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopid = searchParams.get("coopid");

    if (!coopid) {
      return NextResponse.json(
        { success: false, error: "Cooperative ID is required" },
        { status: 400 }
      );
    }
    await requireCoopAuditAccess(coopid);

    const { databases } = createAdminClient();

    const docs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITCOMMENTS,
      [Query.equal("coopid", coopid), Query.orderAsc("timestamp")]
    );

    const comments = docs.documents.map((doc) => ({
      id: doc.$id,
      text: doc.commentArray,
      timestamp: doc.timestamp,
      submittedBy: doc.submittedBy,
      submissionType: doc.submissionType,
    }));

    return NextResponse.json({
      success: true,
      coopid,
      totalComments: comments.length,
      comments,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/auditServices/comment - Add a new comment
export async function POST(request) {
  try {
    const { coopid, commentText, submissionType } = await request.json();

    if (!coopid || typeof commentText !== "string" || !commentText.trim() || commentText.length > 5000 || !submissionType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    const session = await requireCoopAuditAccess(coopid);

    const { databases } = createAdminClient();
    const timestamp = new Date().toISOString();

    const newDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDITCOMMENTS,
      ID.unique(),
      {
        coopid,
        commentArray: commentText,
        timestamp,
        submissionType,
        submittedBy: session.email || session.userId,
      }
    );

    return NextResponse.json({ success: true, comment: newDoc });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error("Error adding new comment:", error);
    return NextResponse.json(
      { success: false, error: "Could not add comment" },
      { status: 500 }
    );
  }
}
