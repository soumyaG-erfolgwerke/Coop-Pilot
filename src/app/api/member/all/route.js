import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
} from "@/lib/appwrite-server";

export async function GET() {
  try {
    const { databases } = createAdminClient();

    const profiles = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [
        Query.equal("role", "member"),
        Query.limit(500),
        Query.orderAsc("FirstName"),
      ],
    );

    const members = profiles.documents.map((profile) => ({
      userId: profile.userId,
      memberName: `${profile.FirstName || ""} ${profile.LastName || ""}`.trim(),
      memberEmail: profile.contactEmail || profile.email || "",
    }));

    return NextResponse.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("GET_ALL_MEMBERS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        members: [],
        error: error.message || "Failed to fetch members",
      },
      {
        status: 500,
      },
    );
  }
}
