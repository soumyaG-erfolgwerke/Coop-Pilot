import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";

// PATCH /api/coopAdminSignUp/profile/verify - Update verification in profile by userId
export async function PATCH(request) {
  try {
    const session = await resolveSession({ requireProfile: false });
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }
    if (userId !== session.userId || !session.account.emailVerification) throw new AuthorizationError();

    const { databases } = createAdminClient();

    // Find profile by userId
    const profiles = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId)]
    );

    if (profiles.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: "Profile not found for the given userId" },
        { status: 404 }
      );
    }

    const profileId = profiles.documents[0].$id;

    const updatedProfile = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      profileId,
      { isVerified: true }
    );

    return NextResponse.json({ success: true, verified: updatedProfile.isVerified === true });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error updating profile verification:", error);
    return NextResponse.json(
      { success: false, error: "Could not update profile verification" },
      { status: 500 }
    );
  }
}
