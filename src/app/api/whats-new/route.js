import { NextResponse } from "next/server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { isFeatureEnabled } from "@/lib/dev-console/features";
import WhatsNewAnnouncement from "@/lib/models/WhatsNewAnnouncement.model";
import WhatsNewReadState from "@/lib/models/WhatsNewReadState.model";
import { sessionIsDemo } from "@/lib/whats-new";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await resolveSession();
    const enabled = await isFeatureEnabled("whats_new_bell", { isDemoTenant: sessionIsDemo(session) });
    if (!enabled) {
      return NextResponse.json({ enabled: false, announcements: [], unreadCount: 0 });
    }

    await connectToDatabase();
    const [announcements, readState] = await Promise.all([
      WhatsNewAnnouncement.find({
        status: "Published",
        publishedAt: { $ne: null },
        targetRoles: { $in: ["all", session.role] },
      }).sort({ publishedAt: -1 }).limit(50).lean(),
      WhatsNewReadState.findOne({ userId: session.userId }).lean(),
    ]);
    const lastReadAt = readState?.lastReadAt ? new Date(readState.lastReadAt).getTime() : 0;
    const unreadCount = announcements.filter((item) => new Date(item.publishedAt).getTime() > lastReadAt).length;

    return NextResponse.json(
      { enabled: true, announcements, unreadCount, lastReadAt: readState?.lastReadAt || null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    return NextResponse.json(
      { error: "Unable to load announcements" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
