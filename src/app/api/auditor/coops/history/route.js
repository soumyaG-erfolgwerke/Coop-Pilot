import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_TEAM_X_COOP,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (
      auth.role !== "auditer" &&
      auth.role !== "aud_E" &&
      auth.role !== "aud_T"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const coopId = searchParams.get("coopId");
    if (!orgId || !coopId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
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
        Query.equal("coopId", coopId),
        Query.equal("auditOrgId", orgId),
        Query.equal("teamMemberId", auditorMember.$id),
      ],
    );

    if (auditorAssignments.total === 0) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );
    if (!coop || coop.auditOrgId !== orgId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cooperative not found or not attached to this audit organization",
        },
        { status: 404 },
      );
    }

    const historyResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      [
        Query.equal("coopId", coop.$id),
        Query.orderDesc("$createdAt"),
        Query.select(["*", "auditFormId.auditType"]),
      ],
    );

    const history = (historyResponse.documents || []).map((doc) => {
      const cleaned = stripInternalFields(doc) || doc;
      cleaned.auditType = cleaned.auditFormId?.auditType || "Unknown";
      cleaned.auditFormId = cleaned.auditFormId?.$id || null;
      let parsedAudit = {};
      try {
        parsedAudit = JSON.parse(cleaned.auditJson || "{}");
      } catch (e) {
        console.error("Failed to parse auditJson:", e);
      }

      return {
        ...cleaned,
        auditJson: parsedAudit,
      };
    });

    return NextResponse.json({
      success: true,
      cooperative: stripInternalFields(coop),
      history,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch cooperatives",
      },
      {
        status: 500,
      },
    );
  }
}
