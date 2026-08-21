import { NextResponse } from "next/server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import WhatsNewReadState from "@/lib/models/WhatsNewReadState.model";

export async function POST() {
  try {
    const session = await resolveSession();
    await connectToDatabase();
    const lastReadAt = new Date();
    await WhatsNewReadState.updateOne(
      { userId: session.userId },
      { $set: { lastReadAt } },
      { upsert: true },
    );
    return NextResponse.json({ success: true, lastReadAt });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextResponse.json(
      { success: false, error: "Unable to update announcement state" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
