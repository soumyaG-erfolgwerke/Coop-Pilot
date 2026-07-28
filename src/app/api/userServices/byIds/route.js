import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";

// POST /api/userServices/byIds - Get users by list of IDs
export async function POST(request) {
  try {
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { success: false, error: "userIds array is required" },
        { status: 400 }
      );
    }

    const { databases } = await createAdminClient();

    const usersResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userIds)]
    );

    const users = usersResult.documents.map((user) => ({
      id: user.userId,
      name: `${user.FirstName} ${user.LastName}`,
      email: user.contactEmail,
      role: user.role,
      status: user.status,
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error in getUserByListOfIdsService:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch users by IDs" },
      { status: 500 }
    );
  }
}
