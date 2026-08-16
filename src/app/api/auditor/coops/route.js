import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { safePublicError } from "@/lib/api/safe-public-error";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_TEAM_X_COOP,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "auditer" && auth.role !== "aud_E" && auth.role !== "aud_T") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Missing orgId" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email), Query.equal("auditOrgId", orgId)],
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
    const auditorAssignments = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      [
        Query.equal("auditOrgId", orgId),
        Query.equal("teamMemberId", auditorMember.$id),
      ],
    );

    if (auditorAssignments.total === 0) {
      return NextResponse.json({ success: true, cooperatives: [] });
    }

    const cooperativeIds = auditorAssignments.documents.map(
      (assignment) => assignment.coopId,
    );

    const cooperativesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [Query.equal("$id", cooperativeIds), Query.limit(cooperativeIds.length)],
    );

    const cooperatives = cooperativesResponse.documents.map((coop) =>
      stripInternalFields(coop),
    );

    return NextResponse.json({ success: true, cooperatives });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to fetch cooperatives"),
      },
      {
        status: 500,
      },
    );
  }
}
