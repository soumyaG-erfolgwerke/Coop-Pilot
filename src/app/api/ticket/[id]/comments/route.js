import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_TICKETS } from "@/lib/appwrite-server";

// GET /api/ticket/[id]/comments?order=asc|desc - Get ticket comments
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const order = searchParams.get("order") || "asc";

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
    console.error(`Error fetching comments for ticket:`, error);
    return NextResponse.json({ success: false, comments: [] }, { status: 500 });
  }
}

// POST /api/ticket/[id]/comments - Add comment to ticket
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { creator, text, timestamp = new Date().toISOString(), newStatus } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const STATUSES = ["Issued", "InProgress", "InReview", "Completed", "Cancelled"];
    if (newStatus && !STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${newStatus}` },
        { status: 400 }
      );
    }

    // Enforce Appwrite's 5000-char per string limit
    const MAX = 5000;
    const payloadStr = JSON.stringify({ creator, text, timestamp });
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

    const current = Array.isArray(doc.comments) ? doc.comments : [];
    const nextComments = [...current, payloadStr];

    const payload = newStatus
      ? { comments: nextComments, status: newStatus }
      : { comments: nextComments };

    const ticket = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_TICKETS,
      id,
      payload
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error(`Error adding comment to ticket:`, error);
    return NextResponse.json({ success: false, ticket: null }, { status: 500 });
  }
}
