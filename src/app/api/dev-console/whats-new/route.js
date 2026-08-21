import { NextResponse } from "next/server";
import { requireDevSession } from "@/lib/dev-console/auth";
import { createAnnouncement, listAnnouncementsForDev } from "@/lib/whats-new";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDevSession();
    const announcements = await listAnnouncementsForDev();
    return NextResponse.json({ announcements }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message === "DEV_UNAUTHORIZED" ? "Unauthorized" : "Unable to load announcements" },
      { status: error?.status || 500 },
    );
  }
}

export async function POST(request) {
  try {
    await requireDevSession();
    const body = await request.json();
    const announcement = await createAnnouncement(body);
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    const unauthorized = error?.message === "DEV_UNAUTHORIZED";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : error?.message || "Unable to create announcement" },
      { status: unauthorized ? 401 : 400 },
    );
  }
}
