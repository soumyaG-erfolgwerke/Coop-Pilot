import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_INVITE_COOPS,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { createRollbackManager } from "@/lib/rollbackService";
import { sendInviteEmail } from "@/utils/inviteMailer";

export async function POST(request) {
  const body = await request.json();
  const { directorEmail, coopName, RegNumber, auditOrgId, directorName } = body;

  if (
    !directorEmail ||
    !coopName ||
    !RegNumber ||
    !auditOrgId ||
    !directorName
  ) {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  const auth = await getAuthenticatedProfile();
  if (!auth || auth.role !== "org_admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  const { databases } = createAdminClient();
  // Validate auditOrgId belongs to the org_admin

  const existingInvite = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_INVITE_COOPS,
    [
      Query.equal("directorEmail", directorEmail),
      Query.equal("auditOrgId", auditOrgId),
      Query.equal("status", "pending"),
      Query.limit(1),
    ],
  );

  if (existingInvite.total > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "An active invitation already exists.",
      },
      { status: 409 },
    );
  }

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
  const auditOrgPublicId = auditOrg.publicId;

  const rollback = createRollbackManager();
  try {
    // Create an invite document in the invite_coops collection
    const inviteDocument = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_INVITE_COOPS,
      ID.unique(),
      {
        directorEmail,
        coopName,
        RegNumber,
        directorName,
        auditOrgId: auditOrg.$id,
        status: "pending",
      },
    );

    rollback.add(async () => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_INVITE_COOPS,
        inviteDocument.$id,
      );
    });

    const inviteLink = `${process.env.DEPLOYMENT_URL}/coopadmin-signup-v2?publicId=${auditOrgPublicId}`;

    // Send invite email
    await sendInviteEmail(
      directorEmail,
      coopName,
      inviteLink,
      auditOrg.OrgName,
      directorName,
      RegNumber,
    );

    return NextResponse.json({
      success: true,
      data: stripInternalFields(inviteDocument),
    });
  } catch (error) {
    console.error("Error inviting cooperative:", error);
    await rollback.execute();
    return NextResponse.json(
      {
        success: false,
        message: "Failed to invite cooperative.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const auditOrgId = request.nextUrl.searchParams.get("auditOrgId");

  let page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
  if (isNaN(limit) || limit < 1) limit = 10;
  limit = Math.min(limit, 100);

  const offset = (page - 1) * limit;

  if (!auditOrgId) {
    return NextResponse.json(
      { success: false, message: "Missing auditOrgId parameter." },
      { status: 400 },
    );
  }

  const auth = await getAuthenticatedProfile();

  if (!auth || auth.role !== "org_admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 },
    );
  }

  try {
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

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_INVITE_COOPS,
      [
        Query.equal("auditOrgId", auditOrg.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ],
    );

    const invites = response.documents.map(stripInternalFields);

    invites.forEach((invite) => {
      invite.auditOrgName = auditOrg.OrgName;
    });

    return NextResponse.json({
      success: true,
      invites,
      pagination: {
        page,
        limit,
        total: response.total,
        totalPages: Math.ceil(response.total / limit),
        hasNextPage: offset + limit < response.total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching recent invites:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch recent invites.",
      },
      { status: 500 },
    );
  }
}
