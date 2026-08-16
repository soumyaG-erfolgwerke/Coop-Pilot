import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_NOTIFICATION,
} from "@/lib/appwrite-server";
import { requireRole, resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { boundedText, validateStrictObject } from "@/lib/validation/strict-object";

// POST - Create a notification
export async function POST(request) {
  try {
    const session = requireRole(await resolveSession(), ["superuser", "coopadmin", "org_admin"]);
    const body = await request.json();
    const shape = validateStrictObject(body, ["createdFor", "message"], { maxBytes: 4096 });
    if (!shape.ok) return NextResponse.json({ success: false, error: shape.error }, { status: 400 });
    const createdFor = boundedText(body.createdFor, { min: 3, max: 254, required: true });
    const message = boundedText(body.message, { min: 1, max: 2000, required: true });

    if (!createdFor || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { databases } = createAdminClient();

    const data = {
      createdBy: session.email || session.userId,
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
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, error: "Could not create notification" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);

    const requestedEmail = searchParams.get("email");
    const email = ["superuser", "superadmin"].includes(session.role)
      ? requestedEmail || session.email
      : session.email;
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
      limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);
      offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

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
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error getting notifications:", error);
    return NextResponse.json(
      { success: false, error: "Could not load notifications" },
      { status: 500 },
    );
  }
}
