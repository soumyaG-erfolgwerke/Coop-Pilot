import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { getKycStatus } from "@/lib/getKycStatus";
import { cookies } from "next/headers";

// GET /api/userServices/[userId] - Get user by ID
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      const response = NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
      response.cookies.set("appwrite-session", "", {
        expires: new Date(0),
        path: "/",
      });
      return response;
    }

    const loggedInUserId = sessionData.userId;
    const loggedInRole = sessionData.role || "";

    const { databases } = await createAdminClient();

    const isSelf = loggedInUserId === userId;
    const isAdminOrAuditor = ["superadmin", "coopadmin", "auditor", "auditer", "member"].includes(loggedInRole.toLowerCase());

    if (!isSelf && !isAdminOrAuditor) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId)]
    );

    let kycStatus = "UNKNOWN";
    try {
      kycStatus = await getKycStatus(userId);
    } catch (err) {
      console.error(`Error fetching KYC status for user ${userId}:`, err);
    }

    if (profilesResult.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: `User with ID ${userId} not found` },
        { status: 404 }
      );
    }

    const prf = profilesResult.documents[0];

    return NextResponse.json({
      success: true,
      user: {
        name: `${prf.FirstName} ${prf.LastName}`,
        email: prf.contactEmail,
        role: prf.role,
        status: prf.status,
        userId: prf.userId,
        isVerified: prf.isVerified,
        kycStatus: kycStatus,
      },
    });
  } catch (error) {
    console.error(`Error fetching user:`, error);
    return NextResponse.json(
      { success: false, error: "Could not fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/userServices/[userId] - Update user profile
export async function PATCH(request, { params }) {
  try {
    const { userId } = await params;
    const { name, phone, address } = await request.json();
    const { databases } = await createAdminClient();

    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      userId,
      { phone, address }
    );

    return NextResponse.json({ success: true, user: updatedDocument });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return NextResponse.json(
      { success: false, error: "Could not update user profile" },
      { status: 500 }
    );
  }
}
