import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_AUDIT_ORGS,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { createRollbackManager } from "@/lib/rollbackService";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request) {
  try {
    const auth = await resolveSession();

    if (auth.role !== "org_admin" && auth.role !== "auditer") {
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

    const search = searchParams.get("search") || "";

    const orgId = searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Missing orgId" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    if (auth.role === "org_admin") {
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
    } else {
      const auditorAssignments = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_AUDITTEAM_MEMBERS,
        [
          Query.equal("auditOrgId", orgId),
          Query.equal("email", auth.email),
        ],
      );

      if (auditorAssignments.total === 0) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }

    const queries = [
      Query.equal("auditOrgId", orgId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
      Query.offset(offset),
    ];

    // Only auditors can see aud_E members
    if (auth.role === "auditer") {
      queries.push(Query.equal("role", "aud_E"));
    }

    if (search?.trim()) {
      queries.push(Query.search("name", search.trim()));
    }

    const teamResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      queries,
    );

    return NextResponse.json({
      success: true,
      teamMembers: teamResponse.documents.map((member) => ({
        ...stripInternalFields(member),
      })),
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
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch team members",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request) {
  const rollback = createRollbackManager();
  try {
    const auth = await resolveSession();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const payload = await request.json();
    const auditOrgId = String(payload?.auditOrgId || "").trim();
    const name = String(payload?.name || "").trim();
    const email = String(payload?.email || "").trim();
    const password = String(payload?.password || "").trim();
    const role = String(payload?.role || "").trim();
    const empId = String(payload?.empId || "").trim();
    const isActive = Boolean(payload?.isActive);

    if (!auditOrgId || !name || !email || !password || !role || !empId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (
      name.length > 200 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || password.length > 256 || empId.length > 100 ||
      !["auditer", "aud_E", "aud_T"].includes(role)
    ) {
      return NextResponse.json({ success: false, error: "Invalid team member data" }, { status: 400 });
    }

    const { databases, users } = createAdminClient();

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrgId,
    );

    if (!auditOrg || auditOrg.admin_email !== auth.email) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const createdUser = await users.create(
      ID.unique(),
      email,
      undefined,
      password,
      name,
    );

    await users.updateLabels(createdUser.$id, ["teamMember"]);
    rollback.add(() => users.delete(createdUser.$id));

    const memberId = ID.unique();
    const teamMember = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      memberId,
      {
        auditOrgId: auditOrg.$id,
        name,
        email,
        role,
        isActive: isActive,
        empId,
      },
    );
    rollback.add(() =>
      databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_AUDITTEAM_MEMBERS,
        teamMember.$id,
      ),
    );

    return NextResponse.json({
      success: true,
      document: stripInternalFields(teamMember),
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    if (rollback && rollback.size() > 0) {
      await rollback.execute();
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create team member",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await resolveSession();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const payload = await request.json();
    const auditOrgId = String(payload?.auditOrgId || "").trim();
    const memberId = String(payload?.id || payload?.memberId || "").trim();
    const name = String(payload?.name || "").trim();
    const email = String(payload?.email || "").trim();
    const role = String(payload?.role || "").trim();
    const empId = String(payload?.empId || payload?.employeeId || "").trim();
    const isActive = Boolean(payload?.isActive);

    if (!auditOrgId || !memberId || !name || !email || !role || !empId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (
      name.length > 200 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      empId.length > 100 || !["auditer", "aud_E", "aud_T"].includes(role)
    ) {
      return NextResponse.json({ success: false, error: "Invalid team member data" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditOrgId,
    );

    if (!auditOrg || auditOrg.admin_email !== auth.email) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const existingMember = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      memberId,
    );

    if (existingMember.auditOrgId !== auditOrg.$id) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 },
      );
    }

    const updatedMember = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      memberId,
      {
        auditOrgId: auditOrg.$id,
        name,
        email,
        role,
        isActive,
        empId,
      },
    );

    return NextResponse.json({
      success: true,
      document: stripInternalFields(updatedMember),
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update team member",
      },
      {
        status: 500,
      },
    );
  }
}
