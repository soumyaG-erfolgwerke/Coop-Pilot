import { NextResponse } from "next/server";
import { requireDevSession } from "@/lib/dev-console/auth";
import { resetDemoBaseline } from "@/lib/dev-console/reset";
import { getMonitorRuntime } from "@/lib/dev-console/runtime";

export async function POST(request) {
  try {
    await requireDevSession();
    const body = await request.json().catch(() => ({}));
    if (body.confirmation !== "RESET") return NextResponse.json({ error: "Type RESET to confirm" }, { status: 400 });
    if (getMonitorRuntime().running) return NextResponse.json({ error: "Wait for monitoring to finish before resetting the demo" }, { status: 409 });
    return NextResponse.json(await resetDemoBaseline({ resetPasswords: true }));
  }
  catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || 500 }); }
}
