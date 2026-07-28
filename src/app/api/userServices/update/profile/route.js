import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { cookies } from "next/headers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
} from "@/lib/appwrite-server";

// GET /api/userServices/update/profile - Get current user's profile for editing
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

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
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/userServices/update/profile - Update user profile
export async function PATCH(request) {
  try {
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
          try {
            updateData[field] = new Date(profileData[field]).toISOString();
          } catch {
            updateData[field] = profileData[field];
          }
        } else {
          updateData[field] = profileData[field];
        }
      }
    }

    const { databases } = createAdminClient();

    const updatedDoc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      docId,
      updateData
    );

    return NextResponse.json({ success: true, data: updatedDoc });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
