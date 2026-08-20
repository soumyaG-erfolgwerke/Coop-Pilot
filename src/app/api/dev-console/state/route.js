import { NextResponse } from "next/server";
import { requireDevSession } from "@/lib/dev-console/auth";
import { getConsoleState, listIssues, updateMonitoringSettings } from "@/lib/dev-console/store";
import { getMonitorRuntime } from "@/lib/dev-console/runtime";

export async function GET() {
  try {
    await requireDevSession();
    const [state, issues] = await Promise.all([getConsoleState(), listIssues()]);
    return NextResponse.json({ ...state, issues, runtime: getMonitorRuntime() });
  } catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || 500 }); }
}

export async function PATCH(request) {
  try {
    await requireDevSession();
    const body = await request.json();
    return NextResponse.json(await updateMonitoringSettings({ enabled: body.enabled, time: body.time }));
  } catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
}
