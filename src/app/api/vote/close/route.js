import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ASSEMBLY_VOTES,
} from "@/lib/appwrite-server";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { pollId, coopId } = body || {};

    if (!pollId || !coopId) {
      return NextResponse.json(
        { success: false, error: "pollId and coopId are required" },
        { status: 400 },
      );
    }

    await ensureCoopAdminAccess(coopId);
    const { databases } = createAdminClient();

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLY_VOTES,
      pollId,
      { status: "closed" },
    );

    return NextResponse.json({ success: true, poll: updated });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to close poll" },
      { status: 500 },
    );
  }
}
