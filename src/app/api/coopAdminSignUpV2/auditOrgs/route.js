import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { COLLECTION_ID_AUDIT_ORGS, createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";

export async function GET() {
  try {
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.limit(100)],
    );

    const documents = response.documents.map((org) => ({
      $id: org.$id,
      OrgName: org.OrgName,
      name: org.name,
      publicId: org.publicId,
      headAuditor: org.headAuditor,
      City: org.City,
      state: org.state,
    }));

    return NextResponse.json({
      success: true,

      documents,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,

        error: "Failed to fetch audit organizations",
      },
      {
        status: 500,
      },
    );
  }
}
