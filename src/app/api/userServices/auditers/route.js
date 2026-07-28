import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";

// GET /api/userServices/auditers - Get all auditers
// Query params: ?type=all|employee|trainee
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    
    const { databases } = await createAdminClient();
    let query = [];

    if (type === "employee") {
      query = [Query.equal("role", "aud_E")];
    } else if (type === "main") {
      query = [Query.equal("role", "auditer")];
    } else if (type === "all") {
      query = [Query.equal("role", ["aud_E", "auditer"])];
    }

    const auditersResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      query
    );

    const auditers = auditersResult.documents.map((user) => ({
      id: user.userId,
      name: `${user.FirstName} ${user.LastName}`,
      email: user.contactEmail,
      role: user.role,
      status: user.status,
    }));

    return NextResponse.json({ success: true, auditers });
  } catch (error) {
    console.error("Error in getAllAuditersService:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch auditors" },
      { status: 500 }
    );
  }
}
