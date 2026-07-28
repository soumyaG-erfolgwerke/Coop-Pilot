// org_admin will be able to get info of all coop's current audit deadline of his own org and will be able to update deadline of all coops of his org

import { NextResponse } from "next/server";
import { Query } from "appwrite";
import {
  DATABASE_ID,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDIT_ORGS,
  createAdminClient,
  COLLECTION_ID_AUDIT_DISCREPANCY,
} from "@/lib/appwrite-server";

import {
  getAuthenticatedProfile,
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

    const { databases } = createAdminClient();

    const auditOrgResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", auth.email)],
    );

    if (!auditOrgResponse.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to any audit organization",
        },
        { status: 403 },
      );
    }

    const auditOrg = auditOrgResponse.documents[0];

    const coopResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [Query.equal("auditOrgId", auditOrg.$id), Query.limit(500)],
    );

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
      [Query.equal("$id", currentAuditIds), Query.limit(currentAuditIds.length)],
    );

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

    const coopIds = coopResponse.documents.map((doc) => doc.$id);

    const discrepanciesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_DISCREPANCY,
      [
        Query.equal("auditOrgId", auditOrg.$id),
        Query.equal("coopId", coopIds), // array of coop IDs
        Query.notEqual("status", "resolved"),
      ],
    );

    const coopsWithDiscrepancies = new Set(
      discrepanciesResponse.documents.map((d) => d.coopId),
    ).size;

    return NextResponse.json({
      success: true,
      coopsCount: coopResponse.total,
      activeAuditsCount,
      overdueAuditsCount,
      totalDiscrepancyCount: discrepanciesResponse.documents.length,
      affectedCoopsForDiscrepancies: coopsWithDiscrepancies,
    });
  } catch (error) {
    console.error("Error fetching coops with deadlines:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching coops with deadlines",
      },
      { status: 500 },
    );
  }
}
