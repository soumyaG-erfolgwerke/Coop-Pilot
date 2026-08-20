import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_COOPERATIVES } from "@/lib/appwrite-server";

export async function GET(request) {
  try {
    const { databases } = createAdminClient();
    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      "demo_bea_cooperative",
      {
        auditStatus: null,
        auditFormId: null,
        auditJson: null,
      }
    );
    return NextResponse.json({ success: true, message: "Reset successful", doc: updatedDocument });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
