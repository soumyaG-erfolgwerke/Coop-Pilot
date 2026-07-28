import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_USERTEXTFORM } from "@/lib/appwrite-server";

// GET /api/coop-r-member/user-text-form - Retrieve sign and place for user declaration
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const coopId = searchParams.get("coopId");

    if (!userId || !coopId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId and coopId are required." },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_USERTEXTFORM,
      [
        Query.equal("userId", userId),
        Query.equal("coopId", coopId),
        Query.orderDesc("$createdAt")
      ]
    );

    if (result.documents.length === 0) {
      return NextResponse.json({ success: true, form: null });
    }

    return NextResponse.json({ success: true, form: result.documents[0] });
  } catch (error) {
    console.error("Error fetching userTextForm:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/coop-r-member/user-text-form - Save sign and place for user declaration
export async function POST(request) {
  try {
    const { userId, coopId, sign, place } = await request.json();

    if (!userId || !coopId || !sign) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, coopId, and sign are required." },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const newForm = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_USERTEXTFORM,
      ID.unique(),
      {
        userId,
        coopId,
        sign,
        place: place || null
      }
    );

    return NextResponse.json({ success: true, form: newForm });
  } catch (error) {
    console.error("Error creating userTextForm:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

