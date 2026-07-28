import { NextResponse } from "next/server";
import { ensureCoopAdminAccess, getSettingsHistory } from "@/lib/helpers/_helpers";

export async function GET(request, { params }) {
  try {
    const { coopId } = await params;
    if (!coopId) {
      return NextResponse.json({ success: false, error: "coopId is required" }, { status: 400 });
    }

    await ensureCoopAdminAccess(coopId);
    const history = await getSettingsHistory(coopId);

    return NextResponse.json({ success: true, history });
  } catch (error) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings history" },
      { status: 500 }
    );
  }
}
