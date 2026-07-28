import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_KYC_DOCUMENTS } from "@/lib/appwrite-server";

export async function GET(request, { params }) {
  try {
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

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error("Error fetching KYC document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch KYC document" },
      { status: 500 }
    );
  }
}
