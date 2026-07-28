import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import {
  getAuthenticatedProfile,
  stripInternalFields,
} from "@/lib/helpers/_helpers";

export async function GET() {
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

    const { databases } = createAdminClient();

    const auditorMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", auth.email)],
    );

    const auditorMember =
      auditorMembers.documents.length > 0
        ? auditorMembers.documents[0]
        : null;

    if (!auditorMember) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not assigned to any audit organization",
        },
        { status: 403 },
      );
    }

    const auditOrg = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      auditorMember.auditOrgId,
    );

    if (!auditOrg) {
      return NextResponse.json(
        { success: false, error: "Audit organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, auditOrg: stripInternalFields(auditOrg) },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch audit organization",
      },
      {
        status: 500,
      },
    );
  }
}
