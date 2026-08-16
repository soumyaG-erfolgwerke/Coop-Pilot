import { NextResponse } from "next/server";

// The previous HTTP logging bridge was recursive and accepted forged events.
// Edge request logging no longer uses this endpoint.
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Not found" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}
