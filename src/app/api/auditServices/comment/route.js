import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_AUDITCOMMENTS } from "@/lib/appwrite-server";

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
    const { coopid, commentText, submittedBy, submissionType } = await request.json();

    if (!coopid || !commentText || !submittedBy || !submissionType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

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
        submittedBy,
      }
    );

    return NextResponse.json({ success: true, comment: newDoc });
  } catch (error) {
    console.error("Error adding new comment:", error);
    return NextResponse.json(
      { success: false, error: "Could not add comment" },
      { status: 500 }
    );
  }
}
