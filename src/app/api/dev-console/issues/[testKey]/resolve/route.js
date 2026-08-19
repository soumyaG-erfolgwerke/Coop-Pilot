import { NextResponse } from "next/server";
import { requireDevSession } from "@/lib/dev-console/auth";
import { findMonitorTest } from "@/lib/dev-console/registry";
import { startMonitoring } from "@/lib/dev-console/runtime";

export async function POST(_request, { params }) {
  try {
    await requireDevSession();
    const { testKey } = await params;
    if (!findMonitorTest(testKey)) throw new Error("UNKNOWN_TEST");
    return NextResponse.json(startMonitoring({ testKey, resolveOnPass: true, trigger: "issue-verification" }), { status: 202 });
  } catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || (error.message === "MONITOR_ALREADY_RUNNING" ? 409 : 400) }); }
}
