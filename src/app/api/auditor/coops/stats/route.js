// auditors will be able to get info of all coop's current audit deadline of his own org and only able to update deadline of coops that are assigned to him
import { NextResponse } from "next/server";
import { Query } from "appwrite";
import {
  DATABASE_ID,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_COOPERATIVES,
  createAdminClient,
  COLLECTION_ID_TEAM_X_COOP,
  COLLECTION_ID_AUDIT_DISCREPANCY,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const auth = await getAuthenticatedProfile();

    if (!auth || (auth.role !== "auditer" && auth.role !== "aud_E")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const auditOrgId = searchParams.get("auditOrgId");

    if (!auditOrgId) {
      return NextResponse.json(
        { success: false, error: "auditOrgId is required" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email)],
    );

    if (!auditorResponse.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to any audit organization",
        },
        { status: 403 },
      );
    }

    const auditorMember = auditorResponse.documents[0];

    const assignedCoops = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      [
        Query.equal("auditOrgId", auditOrgId),
        Query.equal("teamMemberId", auditorMember.$id),
        Query.limit(500),
      ],
    );

    const coopIds = assignedCoops.documents.map((doc) => doc.coopId);

    if (coopIds.length === 0) {
      return NextResponse.json({
        success: true,
        activeAuditsCount: 0,
        overdueAuditsCount: 0,
        totalDiscrepancyCount: 0,
        affectedCoopsForDiscrepancies: 0,
      });
    }

    const coopResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [
        Query.equal("auditOrgId", auditOrgId),
        Query.limit(500),
        Query.equal("$id", coopIds),
      ],
    );

    // for all coops get the current audit deadline and return with coop info from auditHistory collection
    const currentAuditIds = coopResponse.documents
      .map((coop) => coop.currentAuditId)
      .filter(Boolean);

    if (currentAuditIds.length === 0) {
      return NextResponse.json({
        success: true,
        activeAuditsCount: 0,
        overdueAuditsCount: 0,
        totalDiscrepancyCount: 0,
        affectedCoopsForDiscrepancies: 0,
      });
    }

    const deadlinesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      [
        Query.equal("$id", currentAuditIds),
        Query.limit(currentAuditIds.length),
      ],
    );

    // assemble the response
    const activeStatuses = [
      "START", // INITIATED
      "NOT_STARTED", // INITIATED
      "IN_PROGRESS",
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASKED_TO_RESUBMIT", // CORRECTIONS_REQUESTED / RESUBMITTED
    ];

    const closedStatuses = ["APPROVED", "REJECTED", "CLOSED"];

    const activeAuditsCount = deadlinesResponse.documents.filter((d) =>
      activeStatuses.includes(d.status),
    ).length;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdueAuditsCount = deadlinesResponse.documents.filter((d) => {
      if (!d.deadline) return false;
      const deadlineDate = new Date(d.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      return !closedStatuses.includes(d.status) && deadlineDate < now;
    }).length;

    const discrepanciesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_DISCREPANCY,
      [
        Query.equal("auditOrgId", auditOrgId),
        Query.equal("coopId", coopIds), // array of coop IDs
        Query.notEqual("status", "resolved"),
      ],
    );

    const coopsWithDiscrepancies = new Set(
      discrepanciesResponse.documents.map((d) => d.coopId),
    ).size;

    return NextResponse.json({
      success: true,
      coopsCount: coopIds.length,
      activeAuditsCount,
      overdueAuditsCount,
      totalDiscrepancyCount: discrepanciesResponse.documents.length,
      affectedCoopsForDiscrepancies: coopsWithDiscrepancies,
    });
  } catch (error) {
    console.error("Error fetching coop deadlines:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
