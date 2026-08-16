import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
} from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";

const PROFILE_LIMITS = {
  salutation: 30,
  title: 50,
  FirstName: 100,
  LastName: 100,
  street: 150,
  houseNo: 30,
  add: 250,
  postalCode: 20,
  location: 120,
};

// GET /api/userServices/update/profile - Get current user's profile for editing
export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }
    if (userId !== session.userId) throw new AuthorizationError();

    const { databases } = createAdminClient();

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId)]
    );

    if (profilesResult.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const doc = profilesResult.documents[0];

    let bdayFormatted = "";
    if (doc.bday) {
      try {
        bdayFormatted = new Date(doc.bday).toISOString().split("T")[0];
      } catch {
        bdayFormatted = doc.bday;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        docId: doc.$id,
        salutation: doc.salutation ?? "",
        title: doc.title ?? "",
        FirstName: doc.FirstName ?? "",
        LastName: doc.LastName ?? "",
        street: doc.street ?? "",
        houseNo: doc.houseNo ?? "",
        add: doc.add ?? "",
        postalCode: doc.postalCode ?? "",
        location: doc.location ?? "",
        bday: bdayFormatted,
      },
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/userServices/update/profile - Update user profile
export async function PATCH(request) {
  try {
    const session = await resolveSession();
    const body = await request.json();
    const { docId, ...profileData } = body;

    if (!docId) {
      return NextResponse.json(
        { success: false, error: "docId is required" },
        { status: 400 }
      );
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      "salutation",
      "title",
      "FirstName",
      "LastName",
      "street",
      "houseNo",
      "add",
      "postalCode",
      "location",
      "bday",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        if (field === "bday" && profileData[field]) {
          if (typeof profileData[field] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(profileData[field]) || Number.isNaN(Date.parse(`${profileData[field]}T00:00:00.000Z`))) {
            return NextResponse.json({ success: false, error: "Invalid birth date" }, { status: 422 });
          }
          updateData[field] = new Date(`${profileData[field]}T00:00:00.000Z`).toISOString();
        } else {
          const value = profileData[field];
          const limit = PROFILE_LIMITS[field];
          if (typeof value !== "string" || (limit && value.length > limit)) {
            return NextResponse.json({ success: false, error: `Invalid ${field}` }, { status: 422 });
          }
          updateData[field] = value.trim();
        }
      }
    }

    const { databases } = createAdminClient();

    const currentDoc = await databases.getDocument(DATABASE_ID, COLLECTION_ID_PROFILE, docId);
    if (currentDoc.userId !== session.userId) throw new AuthorizationError();
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields supplied" }, { status: 400 });
    }

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      docId,
      updateData
    );

    return NextResponse.json({ success: true, data: updatedDoc });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Could not update profile" },
      { status: 500 }
    );
  }
}
