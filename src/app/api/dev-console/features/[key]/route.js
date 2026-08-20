import { NextResponse } from "next/server";
import { requireDevSession } from "@/lib/dev-console/auth";
import { setFeatureEnabled } from "@/lib/dev-console/store";

export async function PATCH(request, { params }) {
  try {
    await requireDevSession();
    const { key } = await params;
    const { enabled, audience } = await request.json();
    return NextResponse.json(await setFeatureEnabled(key, Boolean(enabled), audience));
  } catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || 400 }); }
}
