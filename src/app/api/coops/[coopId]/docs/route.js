import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration, requireCoopMembership } from "@/lib/auth/membership-access";
import { requireCoopAuditAccess } from "@/lib/auth/audit-access";

const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";

// GET /api/coops/[coopId]/docs - Get all document links for a cooperative
export async function GET(request, { params }) {
  try {
    const { coopId } = await params;

    if (!coopId) {
      return NextResponse.json({ error: "Cooperative ID is required" }, { status: 400 });
    }
    const session = await resolveSession();
    if (["org_admin", "auditer", "aud_E", "aud_T"].includes(session.role)) await requireCoopAuditAccess(coopId);
    else await requireCoopMembership(session, coopId);

    const { databases } = createAdminClient();

    const coopDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId
    );

    const documentArray = coopDoc?.documentArray || [];

    return NextResponse.json({ documents: documentArray });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to get documents:`, error);
    return NextResponse.json(
      { error: "Failed to get documents" },
      { status: 500 }
    );
  }
}

// PATCH /api/coops/[coopId]/docs - Update document links for a cooperative
export async function PATCH(request, { params }) {
  try {
    const { coopId } = await params;
    const { documentIds } = await request.json();

    if (!coopId || !documentIds) {
      return NextResponse.json(
        { error: "Cooperative ID and documentIds are required" },
        { status: 400 }
      );
    }
    const session = await resolveSession();
    await requireCoopAdministration(session, coopId);
    if (!Array.isArray(documentIds) || documentIds.length > 500 || documentIds.some((id) => typeof id !== "string" || id.length > 200)) {
      return NextResponse.json({ error: "Invalid documentIds" }, { status: 400 });
    }

    const { databases } = createAdminClient();

    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      { documentArray: documentIds }
    );

    return NextResponse.json(updatedDocument);
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error(`Failed to update documents:`, error);
    return NextResponse.json(
      { error: "Failed to update documents" },
      { status: 500 }
    );
  }
}
