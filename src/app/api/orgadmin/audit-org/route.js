import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

export async function GET() {
  try {
    const auth = await resolveSession();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", auth.email), Query.limit(1)],
    );

    return NextResponse.json({
      success: true,
      auditOrg: stripInternalFields(response.documents[0]),
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit organization",
      },
      {
        status: 500,
      },
    );
  }
}
