import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_NOTIFICATION,
} from "@/lib/appwrite-server";

// PATCH - Mark notification as read
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing notification ID" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const response = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_NOTIFICATION,
      id,
      { isRead: true }
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
