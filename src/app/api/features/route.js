import { NextResponse } from "next/server";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";
import { getConsoleState } from "@/lib/dev-console/store";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const coopId = new URL(request.url).searchParams.get("coopId")?.trim();
    if (!coopId) {
      return NextResponse.json({ error: "coopId is required" }, { status: 400 });
    }

    await ensureCoopAdminAccess(coopId);
    const state = await getConsoleState();
    const isDemoTenant = coopId === process.env.DEV_DEMO_COOP_ID;
    const features = Object.fromEntries(
      state.features.map((feature) => [
        feature.key,
        isDemoTenant ? feature.demoEnabled : feature.customerEnabled,
      ]),
    );

    return NextResponse.json(
      { features },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const forbidden = error?.message === "FORBIDDEN";
    return NextResponse.json(
      { error: forbidden ? "Forbidden" : "Unable to load features" },
      { status: forbidden ? 403 : 401 },
    );
  }
}
