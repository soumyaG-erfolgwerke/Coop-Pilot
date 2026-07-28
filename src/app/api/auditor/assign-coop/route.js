import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_TEAM_X_COOP,
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";
import { createRollbackManager } from "@/lib/rollbackService";

export async function POST(request) {
  const rollback = createRollbackManager();
  try {
    const { coopId, members } = await request.json();
    if (!coopId || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "coopId and members are required",
        },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();

    if (auth.role !== "auditer") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();
    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    if (!coop) {
      return NextResponse.json(
        {
          success: false,
          error: "Coop not found",
        },
        { status: 404 },
      );
    }

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      coop.auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        {
          success: false,
          error: "Audit organization not found",
        },
        { status: 404 },
      );
    }

    const assigned = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email), Query.equal("auditOrgId", coop.auditOrgId)],
    );

    if (!assigned.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this audit organization",
        },
        { status: 403 },
      );
    }

    const auditorMember = assigned.documents[0];
    if (!auditorMember || !auditorMember.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not active",
        },
        { status: 403 },
      );
    }

    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      [
        Query.equal("coopId", coopId),
        Query.equal("auditOrgId", coop.auditOrgId),
        Query.equal("teamMemberId", auditorMember.$id),
      ],
    );

    if (!auditorResponse || auditorResponse.documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this cooperative",
        },
        { status: 403 },
      );
    }

    const incomingAuditors = members.filter((m) => m.role === "auditer");

    if (incomingAuditors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You are the auditor and only org_admin can assign auditors",
        },
        { status: 400 },
      );
    } 

    // Validate all members in parallel
    const validatedAssignments = await Promise.all(
      members.map(async ({ memberId, role }) => {
        const teamMember = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_AUDITTEAM_MEMBERS,
          memberId,
        );

        if (!teamMember) {
          throw new Error(`Team member ${memberId} not found`);
        }

        if (teamMember.role !== role) {
          throw new Error(`Role mismatch for member ${memberId}`);
        }

        if (!teamMember.isActive) {
          throw new Error(`Member ${memberId} is inactive`);
        }

        const existingAssignment = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_TEAM_X_COOP,
          [
            Query.equal("coopId", coopId),
            Query.equal("teamMemberId", memberId),
          ],
        );

        if (existingAssignment.documents.length > 0) {
          throw new Error(`Member ${memberId} is already assigned`);
        }

        return {
          $id: ID.unique(),
          coopId,
          teamMemberId: memberId,
          auditOrgId: coop.auditOrgId,
          role,
        };
      }),
    );

    // Bulk insert
    await databases.createDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      validatedAssignments,
    );

    rollback.add(async () => {
      const assignmentIds = validatedAssignments.map((a) => a.$id);
      await databases.deleteDocuments(DATABASE_ID, COLLECTION_ID_TEAM_X_COOP, [
        Query.equal("$id", assignmentIds),
        Query.limit(assignmentIds.length),
      ]);
    });

    const newAuditorIds = validatedAssignments.map(
      (assignment) => assignment.teamMemberId,
    );

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coop.$id,
      {
        auditers: [...new Set([...(coop.auditers ?? []), ...newAuditorIds])],
      },
    );

    // Create Audit Log note
    try {
      const { createAuditLog } = await import("@/lib/helpers/_loggerHelper");
      const assignedNames = validatedAssignments.map(a => `${a.role}: ${a.teamMemberId}`).join(", ");
      await createAuditLog({
        auditOrgId: coop.auditOrgId,
        logNote: `Assigned team members to cooperative "${coop.name}" (${coop.$id}): ${assignedNames}`,
        role: "auditer",
      });
    } catch (logErr) {
      console.error("Failed to write auditor assignment audit log:", logErr);
    }

    rollback.add(async () => {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coop.$id,
        {
          auditers: coop.auditers ?? [],
        },
      );
    });

    return NextResponse.json({
      success: true,
      message: `${validatedAssignments.length} members assigned successfully`,
      count: validatedAssignments.length,
    });
  } catch (error) {
    console.error(error);
    await rollback.execute();
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to assign members",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing coopId query parameter",
        },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();

    if (auth.role !== "auditer" && auth.role !== "aud_E" && auth.role !== "aud_T") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    if (!coop) {
      return NextResponse.json(
        {
          success: false,
          error: "Coop not found",
        },
        { status: 404 },
      );
    }

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      coop.auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    const assigned = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [
        Query.equal("email", auth.email),
        Query.equal("auditOrgId", auditOrg.$id),
      ],
    );

    if (!assigned.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this audit organization",
        },
        { status: 403 },
      );
    }

    const auditorMember = assigned.documents[0];
    if (!auditorMember || !auditorMember.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not active",
        },
        { status: 403 },
      );
    }

    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      [
        Query.equal("coopId", coopId),
        Query.equal("auditOrgId", coop.auditOrgId),
        Query.equal("teamMemberId", auditorMember.$id),
      ],
    );

    if (auditorResponse.total === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this cooperative",
        },
        { status: 403 },
      );
    }

    const teamXCoopResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      [
        Query.equal("coopId", coopId),
        Query.equal("auditOrgId", coop.auditOrgId),
        Query.limit(100),
      ],
    );

    const memberIds = teamXCoopResponse.documents.map(
      (doc) => doc.teamMemberId,
    );

    // No assigned members
    if (memberIds.length === 0) {
      return NextResponse.json({
        success: true,
        assignedMembers: [],
      });
    }

    const teamMembersResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("$id", memberIds), Query.limit(memberIds.length)],
    );

    const membersMap = {};

    teamMembersResponse.documents.forEach((member) => {
      membersMap[member.$id] = stripInternalFields(member);
    });

    const assignedMembers = teamXCoopResponse.documents.map((assignment) => ({
      ...stripInternalFields(assignment),
      member: membersMap[assignment.teamMemberId] || null,
    }));

    return NextResponse.json({
      success: true,
      assignedMembers,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch assigned members for coop",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request) {
  
    const rollback = createRollbackManager();
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");
    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "Missing assignmentId query parameter" },
        { status: 400 },
      );
    }

    const auth = await getAuthenticatedProfile();
    if (auth.role !== "auditer") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();
    const assignment = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      assignmentId,
    );

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 },
      );
    }

    if (assignment.role !== "aud_E") {
      return NextResponse.json(
        { success: false, error: "You can only remove Sub-auditors" },
        { status: 403 },
      );
    }

    const coop = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      assignment.coopId,
    );

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      coop.auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        { success: false, error: "Audit organization not found" },
        { status: 404 },
      );
    }

    const assignedMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email), Query.equal("auditOrgId", coop.auditOrgId)],
    );

    if (!assignedMembers.documents.length) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to this audit organization",
        },
        { status: 403 },
      );
    }

    const assignedMember = assignedMembers.documents[0];

    const auditorResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      [
        Query.equal("coopId", assignment.coopId),
        Query.equal("auditOrgId", coop.auditOrgId),
        Query.equal("teamMemberId", assignedMember.$id),
      ],
    );

    if (auditorResponse.total === 0) {
      return NextResponse.json(
        { success: false, error: "You are not assigned to this cooperative" },
        { status: 403 },
      );
    }

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTION_ID_TEAM_X_COOP,
      assignmentId,
    );

    rollback.add(async () => {
      await databases.createDocument(DATABASE_ID, COLLECTION_ID_TEAM_X_COOP, assignmentId, {
        coopId: assignment.coopId,
        teamMemberId: assignment.teamMemberId,
        auditOrgId: assignment.auditOrgId,
        role: assignment.role,
      });
    });

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coop.$id,
      {
        auditers: (coop.auditers || []).filter(
          (id) => id !== assignment.teamMemberId,
        ),
      },
    );

    // Create Audit Log note
    try {
      const { createAuditLog } = await import("@/lib/helpers/_loggerHelper");
      await createAuditLog({
        auditOrgId: coop.auditOrgId,
        logNote: `Removed team member ${assignment.teamMemberId} (${assignment.role}) from cooperative "${coop.name}" (${coop.$id})`,
        role: "auditer",
      });
    } catch (logErr) {
      console.error("Failed to write auditor removal audit log:", logErr);
    }

    rollback.add(async () => {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coop.$id,
        {
          auditers: [...(coop.auditers || []), assignment.teamMemberId],
        },
      );
    });
    return NextResponse.json({
      success: true,
      message: "Member removed from coop successfully",
    });
  } catch (error) {
    console.error(error);
    await rollback.execute();
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to remove member from coop",
      },
      {
        status: 500,
      },
    );
  }
}
