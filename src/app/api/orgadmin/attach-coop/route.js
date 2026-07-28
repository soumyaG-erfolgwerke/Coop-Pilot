import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_AUDIT_ORGS,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile, stripInternalFields } from "@/lib/helpers/_helpers";

export async function POST(request) {
  try {
    const auth = await getAuthenticatedProfile();
    if (auth.role !== "org_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { coopId } = await request.json();
    if (!coopId) {
      return NextResponse.json({ success: false, error: "coopId required" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const auditOrgList = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", auth.email), Query.limit(1)],
    );

    const auditOrg = auditOrgList.documents[0] || null;
    if (!auditOrg) {
      return NextResponse.json({ success: false, error: "Audit organization not found" }, { status: 404 });
    }

    // Ensure coop exists
    const coop = await databases.getDocument(DATABASE_ID, COLLECTION_ID_COOPERATIVES, coopId);
    if (!coop) {
      return NextResponse.json({ success: false, error: "Cooperative not found" }, { status: 404 });
    }

    const currentAuditOrgId = coop.auditOrgId ?? null;
    if (currentAuditOrgId !== null && currentAuditOrgId !== undefined && currentAuditOrgId !== "") {
      return NextResponse.json(
        {
          success: false,
          error: "Cooperative is already attached to an audit organization",
        },
        { status: 409 },
      );
    }

    // Update cooperative to attach auditOrgId
    const payload = {
      auditOrgId: auditOrg.$id,
      auditOrgJoinedOn: new Date().toISOString(),
    };

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      payload
    );

    const serialized = stripInternalFields(updated) || updated;
    return NextResponse.json({ success: true, coop: serialized });
  } catch (error) {
    console.error("Failed to attach coop:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to attach cooperative" }, { status: 500 });
  }
}
