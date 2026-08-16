import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { safePublicError } from "@/lib/api/safe-public-error";
import {
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_TEAM_X_COOP,
  COLLECTION_ID_AUDIT_HISTORY,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();

    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    let page = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;

    let limit = parseInt(searchParams.get("limit") || "10", 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    limit = Math.min(limit, 100);

    const offset = (page - 1) * limit;

    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Missing orgId" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      orgId,
    );

    if (!auditOrg || auditOrg.admin_email !== auth.email) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const teamResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [
        Query.equal("auditOrgId", orgId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ],
    );

    // Get all coops under this audit org
    const coopsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [Query.equal("auditOrgId", orgId), Query.limit(500)],
    );

    const coops = coopsResponse.documents;
    const coopIds = coops.map((coop) => coop.$id);

    let teamAssignments = { documents: [] };
    let audits = { documents: [] };

    if (coopIds.length > 0) {
      // Get all team member assignments for these coops
      teamAssignments = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_TEAM_X_COOP,
        [
          Query.equal("coopId", coopIds),
          Query.limit(1000),
        ],
      );

      // Get all current audit ids
      const currentAuditIds = [
        ...new Set(
          coops
            .map((coop) => coop.currentAuditId)
            .filter(Boolean),
        ),
      ];

      if (currentAuditIds.length > 0) {
        audits = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_AUDIT_HISTORY,
          [
            Query.equal("$id", currentAuditIds),
            Query.limit(currentAuditIds.length),
          ],
        );
      }
    }

    // Status groups
    const activeStatuses = [
      "START",
      "NOT_STARTED",
      "IN_PROGRESS",
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASKED_TO_RESUBMIT",
    ];

    const closedStatuses = [
      "APPROVED",
      "REJECTED",
      "CLOSED",
    ];

    const now = new Date();

    const teamMembersWithStats = teamResponse.documents.map((member) => {
      const memberAssignments = teamAssignments.documents.filter(
        (assignment) => assignment.teamMemberId === member.$id,
      );

      const memberCoopIds = memberAssignments.map(
        (assignment) => assignment.coopId,
      );

      const memberAudits = audits.documents.filter((audit) =>
        memberCoopIds.includes(audit.coopId),
      );

      const activeAuditsCount = memberAudits.filter((audit) =>
        activeStatuses.includes(audit.status),
      ).length;

      const overdueAuditsCount = memberAudits.filter(
        (audit) =>
          !closedStatuses.includes(audit.status) &&
          audit.deadline &&
          new Date(audit.deadline) < now,
      ).length;

      const submittedAwaitingReviewCount = memberAudits.filter(
        (audit) =>
          audit.status === "SUBMITTED" ||
          audit.status === "UNDER_REVIEW",
      ).length;
      

      return {
        ...stripInternalFields(member),
        stats: {
          totalAuditsAssigned: memberAudits.length,
          activeAuditsCount,
          overdueAuditsCount,
          submittedAwaitingReviewCount,
        },
      };
    });

    return NextResponse.json({
      success: true,
      teamMembers: teamMembersWithStats,
      pagination: {
        total: teamResponse.total,
        page,
        limit,
        totalPages: Math.ceil(teamResponse.total / limit),
        hasNextPage: page * limit < teamResponse.total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Failed to fetch team members"),
      },
      {
        status: 500,
      },
    );
  }
}
