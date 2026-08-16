import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_NOTIFICATION,
} from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { safePublicError } from "@/lib/api/safe-public-error";

// PATCH - Mark notification as read
export async function PATCH(request, { params }) {
  try {
    const session = await resolveSession();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing notification ID" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const notification = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_NOTIFICATION,
      id,
    );
    const mayManageAny = ["superuser", "superadmin"].includes(session.role);
    if (
      !mayManageAny &&
      (!session.email ||
        String(notification?.createdFor || "").toLowerCase() !==
          session.email.toLowerCase())
    ) {
      return sessionErrorResponse({ status: 403 });
    }

    const response = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_NOTIFICATION,
      id,
      { isRead: true }
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: safePublicError(error)},
      { status: 500 }
    );
  }
}
