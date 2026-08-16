import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_KYC_DOCUMENTS } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";
import { COLLECTION_ID_KYC_APPLICATIONS } from "@/lib/appwrite-server";

export async function GET(request, { params }) {
  try {
    const session = await resolveSession();
    const { docId } = await params;
    if (!docId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_KYC_DOCUMENTS,
      docId
    );

    if (doc.userId !== session.userId) {
      if (session.role !== "coopadmin" || !doc.kycApplicationId) {
        throw new AuthorizationError();
      }
      const application = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_KYC_APPLICATIONS,
        doc.kycApplicationId,
      );
      await requireCoopAdministration(session, application.coopId);
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching KYC document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch KYC document" },
      { status: error?.code === 404 ? 404 : 500 }
    );
  }
}
