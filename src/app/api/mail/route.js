import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_MAILS } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";

// GET /api/mail?userId=...&type=received|sent - Get mails for inbox/sent
export async function GET(request) {
  try {
    const session = await resolveSession();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "received";

    if (!userId || !["received", "sent"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }
    if (userId !== session.userId) throw new AuthorizationError();

    const { databases } = createAdminClient();

    // If 'received', search where recipientId == userId
    // If 'sent', search where senderId == userId
    const queryKey = type === "received" ? "recipientId" : "senderId";

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_MAILS,
      [
        Query.equal(queryKey, userId),
        Query.orderDesc("timestamp"), // Newest first
        Query.limit(100),
      ]
    );

    return NextResponse.json({ success: true, mails: response.documents });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Failed to fetch mails:", error);
    return NextResponse.json({ success: false, mails: [] }, { status: 500 });
  }
}
