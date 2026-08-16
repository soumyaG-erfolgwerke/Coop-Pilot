import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TICKETS } from "@/lib/appwrite-server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireTicketAccess } from "@/lib/auth/ticket-access";

// GET /api/ticket/[id]/comments?order=asc|desc - Get ticket comments
export async function GET(request, { params }) {
  try {
    const session = await resolveSession();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const order = searchParams.get("order") || "asc";
    if (!["asc", "desc"].includes(order)) {
      return NextResponse.json({ success: false, error: "Invalid sort order" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id
    );
    await requireTicketAccess(session, doc);

    const rawComments = Array.isArray(doc?.comments) ? doc.comments : [];

    // Parse JSON strings into objects, ignore bad entries
    const parsedComments = rawComments
      .map((c) => {
        if (typeof c === "string") {
          try {
            return JSON.parse(c);
          } catch {
            return null;
          }
        }
        return c; // Already an object
      })
      .filter(Boolean);

    // Sort by timestamp
    const toMillis = (t) => (typeof t === "number" ? t : Date.parse(t));
    parsedComments.sort((a, b) => {
      const ta = toMillis(a?.timestamp);
      const tb = toMillis(b?.timestamp);
      return order === "desc" ? tb - ta : ta - tb;
    });

    return NextResponse.json({ success: true, comments: parsedComments });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error(`Error fetching comments for ticket:`, error);
    return NextResponse.json({ success: false, comments: [] }, { status: 500 });
  }
}

// POST /api/ticket/[id]/comments - Add comment to ticket
export async function POST(request, { params }) {
  try {
    const session = await resolveSession();
    const { id } = await params;
    const { text } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ success: false, error: "Comment text is required" }, { status: 400 });
    }

    // Enforce Appwrite's 5000-char per string limit
    const MAX = 5000;
    const payloadStr = JSON.stringify({
      creator: session.email || session.userId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    });
    if (payloadStr.length > MAX) {
      return NextResponse.json(
        { success: false, error: `Comment too long (${payloadStr.length} > ${MAX}).` },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id
    );
    await requireTicketAccess(session, doc);

    const current = Array.isArray(doc.comments) ? doc.comments : [];
    const nextComments = [...current, payloadStr];

    const ticket = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id,
      { comments: nextComments }
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403 || error?.message === "FORBIDDEN") {
      return sessionErrorResponse(error?.message === "FORBIDDEN" ? { status: 403 } : error);
    }
    console.error(`Error adding comment to ticket:`, error);
    return NextResponse.json({ success: false, ticket: null }, { status: 500 });
  }
}
