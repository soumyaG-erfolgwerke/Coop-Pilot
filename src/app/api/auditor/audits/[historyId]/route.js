import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_TEAM_X_COOP,
  COLLECTION_ID_AUDIT_HISTORY,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

export async function GET(request, { params }) {
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

    const { historyId } = await params;
    if (!historyId) {
      return NextResponse.json(
        { success: false, error: "Missing historyId" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const auditHistoryResponse = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      historyId,
      [Query.select([
        '*',
        'auditFormId.auditType'
      ])]
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

    // fetch all assigned members for this coop and except the current auditor, find the lead auditor and include their details in the response

    const teamMemberIds = assignedMembersResponse.documents
      .map((m) => m.teamMemberId)
      .filter((id) => id !== auditorMember.$id);

    let allMembersResponse = { documents: [] };
    if (teamMemberIds.length > 0) {
      allMembersResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_AUDITTEAM_MEMBERS,
        [Query.equal("$id", teamMemberIds), Query.limit(teamMemberIds.length)],
      );
    }

    // map all the members having role "aud_E" in an array saying subauditors & auditHistoryResponse.auditorId === member.$id will be lead auditor
    let leadAuditor = null;
    const subAuditors = [];

    allMembersResponse.documents.forEach((member) => {
      if (
        member.role === "auditer" &&
        member.$id === auditHistoryResponse.auditorId
      ) {
        leadAuditor = member;
      } else if (member.role === "aud_E") {
        subAuditors.push(member);
      }
    });

    if (auditorMember.role === "auditer" && auditorMember.$id === auditHistoryResponse.auditorId) {
      leadAuditor = auditorMember;
    } else if (auditorMember.role === "aud_E") {
      subAuditors.push(auditorMember);
    }

    const auditDetails = {
      ...stripInternalFields(auditHistoryResponse),
      auditFormId: auditHistoryResponse.auditFormId?.$id,
      auditType: auditHistoryResponse.auditFormId?.auditType,
      comments: (auditHistoryResponse.comments || []).map((c) => {
        try {
          return JSON.parse(c);
        } catch (error) {
          console.error("Failed to parse comment:", error);
          return null;
        }
      }),
      leadAuditor: leadAuditor
        ? {
          id: leadAuditor.$id,
          name: leadAuditor.name,
          email: leadAuditor.email,
        }
        : null,

      subAuditors: subAuditors.map((sa) => ({
        id: sa.$id,
        name: sa.name,
        email: sa.email,
      })),
    };

    return NextResponse.json({ success: true, auditDetails });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch audit details",
      },
      {
        status: 500,
      },
    );
  }
}
