import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_COOPERATIVES,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";

export async function GET(request) {
  try {
    const auth = await resolveSession();
    if (auth.role !== "org_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
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

    const coopsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [Query.equal("auditOrgId", auditOrg.$id), Query.limit(100)],
    );

    const coops = (coopsResponse.documents || []).map(
      (doc) => stripInternalFields(doc) || doc,
    );

    return NextResponse.json({
      success: true,
      auditOrg: stripInternalFields(auditOrg),
      cooperatives: coops,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cooperatives",
      },
      {
        status: 500,
      },
    );
  }
}
