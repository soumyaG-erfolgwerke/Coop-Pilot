import { NextResponse } from "next/server";
import { requireDevSession } from "@/lib/dev-console/auth";
import { getMonitorRuntime, startMonitoring } from "@/lib/dev-console/runtime";

export async function GET() {
  try { await requireDevSession(); return NextResponse.json(getMonitorRuntime()); }
  catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || 500 }); }
}

export async function POST(request) {
  try {
    await requireDevSession();
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(startMonitoring({ featureKey: body.featureKey, trigger: body.featureKey ? "feature" : "manual" }), { status: 202 });
  } catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || (error.message === "MONITOR_ALREADY_RUNNING" ? 409 : 400) }); }
}
