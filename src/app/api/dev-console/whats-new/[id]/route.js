import { NextResponse } from "next/server";
import { requireDevSession } from "@/lib/dev-console/auth";
import { updateAnnouncement } from "@/lib/whats-new";

export async function PATCH(request, { params }) {
  try {
    await requireDevSession();
    const { id } = await params;
    const announcement = await updateAnnouncement(id, await request.json());
    return NextResponse.json({ announcement });
  } catch (error) {
    const unauthorized = error?.message === "DEV_UNAUTHORIZED";
    const notFound = error?.message === "ANNOUNCEMENT_NOT_FOUND";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : notFound ? "Announcement not found" : error?.message || "Unable to update announcement" },
      { status: unauthorized ? 401 : notFound ? 404 : 400 },
    );
  }
}
