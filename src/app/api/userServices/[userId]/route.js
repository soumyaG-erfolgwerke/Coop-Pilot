import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { getKycStatus } from "@/lib/getKycStatus";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { boundedText, validateStrictObject } from "@/lib/validation/strict-object";

// GET /api/userServices/[userId] - Get user by ID
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const session = await resolveSession();

    const { databases } = await createAdminClient();

    const isSelf = session.userId === userId;
    const isPlatformAdmin = ["superadmin", "superuser"].includes(
      (session.role || "").toLowerCase(),
    );

    if (!isSelf && !isPlatformAdmin) {
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
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
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
    const session = await resolveSession();
    if (session.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    const body = await request.json();
    const shape = validateStrictObject(body, ["phone", "address"], { maxBytes: 4096, requireAtLeastOne: true });
    if (!shape.ok) return NextResponse.json({ success: false, error: shape.error }, { status: 400 });
    const phone = boundedText(body.phone, { max: 40 });
    const address = boundedText(body.address, { max: 500 });
    if (phone === null || address === null) {
      return NextResponse.json({ success: false, error: "Invalid profile fields" }, { status: 422 });
    }
    if (phone === undefined && address === undefined) {
      return NextResponse.json(
        { success: false, error: "No supported profile fields supplied" },
        { status: 422 },
      );
    }
    const { databases } = await createAdminClient();

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", session.userId), Query.limit(1)],
    );
    const profile = profilesResult.documents[0];
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const update = {};
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;

    const updatedDocument = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      profile.$id,
      update,
    );

    return NextResponse.json({ success: true, user: updatedDocument });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    console.error("Failed to update user profile:", error);
    return NextResponse.json(
      { success: false, error: "Could not update user profile" },
      { status: 500 }
    );
  }
}
