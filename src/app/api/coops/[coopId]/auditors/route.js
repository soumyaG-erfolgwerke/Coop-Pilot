import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";

// GET /api/coops/[coopId]/auditors - Get auditor IDs for a cooperative
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    const session = await resolveSession();
    if (["org_admin", "auditer", "aud_E", "aud_T"].includes(session.role)) await requireCoopAuditAccess(coopId);
    else await requireCoopAdministration(session, coopId);

    const { databases } = createAdminClient();

    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    const ids = doc?.auditers ?? doc?.auditors ?? [];
    const auditorIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

    return NextResponse.json({ auditorIds });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to get auditor IDs:`, error);
    return NextResponse.json(
      { error: "Failed to get auditor IDs" },
      { status: 500 }
    );
  }
}

// PATCH /api/coops/[coopId]/auditors - Assign auditors to a cooperative
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    const { auditorIds } = await request.json();

    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    requireRole(await resolveSession(), ["superuser", "superadmin"]);

    if (!Array.isArray(auditorIds) || auditorIds.length > 100 || auditorIds.some((id) => typeof id !== "string" || id.length > 100)) {
      return NextResponse.json({ error: "auditorIds must be an array" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      { auditers: auditorIds }
    );

    return NextResponse.json(updatedDocument);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to assign auditors:`, error);
    return NextResponse.json(
      { error: "Failed to assign auditors" },
      { status: 500 }
    );
  }
}
