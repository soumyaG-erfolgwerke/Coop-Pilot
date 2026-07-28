import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_NOTIFICATION,
} from "@/lib/appwrite-server";

// POST - Create a notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { createdBy, createdFor, message } = body;

    if (!createdBy || !createdFor || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const data = {
      createdBy,
      createdFor,
      message,
      isRead: false,
      timestamp: new Date().toISOString(),
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_NOTIFICATION,
      ID.unique(),
      data,
      [],
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email parameter" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const isReadParam = searchParams.get("isRead");

    // default behavior: unread only
    const isRead =
      isReadParam === null ? false : isReadParam.toLowerCase() === "true";

    const filters = [
      Query.equal("createdFor", email),
      Query.orderDesc("timestamp"),
    ];

    let limit;
    let offset;

    // Only paginate when explicitly requesting ALL (isRead=true)
    const isAllMode = isReadParam?.toLowerCase() === "true";

    if (isAllMode) {
      limit = parseInt(searchParams.get("limit") || "20", 10) || 20;
      offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

      filters.push(Query.limit(limit));
      filters.push(Query.offset(offset));
    } else {
      filters.push(Query.equal("isRead", isRead));
      // unread mode → fixed small batch (no heavy pagination needed)
      filters.push(Query.limit(50));
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_NOTIFICATION,
      filters,
    );

    return NextResponse.json({
      success: true,
      data: result.documents,
      meta: {
        mode: isAllMode ? "all" : "unread",
        limit: isAllMode ? limit : 50,
        offset: isAllMode ? offset : 0,
      },
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
