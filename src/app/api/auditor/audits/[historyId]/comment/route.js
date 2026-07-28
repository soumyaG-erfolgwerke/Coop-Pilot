import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_TEAM_X_COOP,
  COLLECTION_ID_AUDIT_HISTORY,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
} from "@/lib/helpers/_helpers";

export async function PATCH(request, {params}) {
  try {
    const auth = await getAuthenticatedProfile();
    if (
      auth.role !== "auditer" &&
      auth.role !== "aud_E" &&
      auth.role !== "aud_T" &&
      auth.role !== "org_admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { historyId } = await params;
    if (!historyId) {
      return NextResponse.json(
        { success: false, error: "Missing historyId" },
        { status: 400 },
      );
    }

    const { comment } = await request.json();
    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditHistoryResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      historyId,
    );

    const coopId = auditHistoryResponse.coopId;
    const auditOrgId = auditHistoryResponse.auditOrgId;

    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email), Query.equal("auditOrgId", auditOrgId)],
    );

    if (!auditorResponse.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this audit organization",
        },
        { status: 403 },
      );
    }

    const auditorMember = auditorResponse.documents[0];

    const assignedMembersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      [Query.equal("coopId", coopId), Query.equal("auditOrgId", auditOrgId)],
    );

    if (
      assignedMembersResponse.total === 0 ||
      !assignedMembersResponse.documents
        .map((m) => m.teamMemberId)
        .includes(auditorMember.$id)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this audit organization",
        },
        { status: 403 },
      );
    }

    // Append the new comment to the existing comments array
    const existingComments = auditHistoryResponse.comments || [];
    const updatedComments = [
      ...existingComments,
      JSON.stringify({
        commenterMemberId: auditorMember.$id,
        commenterName: auditorMember.name,
        commenterEmail: auditorMember.email,
        comment,
        timestamp: new Date().toISOString(),
      }),
    ];

    // Update the audit history document with the new comments array
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      historyId,
      {
        comments: updatedComments,
      },
    );

    return NextResponse.json(
      { success: true, message: "Comment added successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add comment",
      },
      {
        status: 500,
      },
    );
  }
}
