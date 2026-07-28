import { createAdminClient } from "@/lib/appwrite-server";
import { assertCoopAdmin } from "@/lib/reports/auth/permissions";
import { getSession, resolveUser } from "@/lib/reports/auth/session";
import { getReportsListForCoop } from "@/lib/reports/capitalSummary/data/storage";
import { resBadRequest, resUnauthorized } from "@/lib/reports/utils/errors";
import { NextResponse } from "next/server";
import { z } from "zod";

const reqSchema = z.object({
  coopId: z.string().min(1, "Coop Id is required"),
});

export const GET = async (req) => {
  // ---- 1. AuthN Boundary Guard ----
  const session = await getSession();
  if (!session?.userId) return resUnauthorized();

  const user = await resolveUser(session);
  if (!user?.email) return resUnauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("coopId");

  try {
    const validation = reqSchema.safeParse({ coopId: id });
    if (!validation.success) {
      return resBadRequest(validation.error.errors[0].message);
    }

    const { coopId } = validation.data;
    const { databases } = createAdminClient();

    // ---- 2. AuthZ Boundary Guard ----
    await assertCoopAdmin({ databases, coopId, userEmail: user.email });

    // ---- 3. Fetch Full History Array ----
    const reportList = await getReportsListForCoop({ databases, coopId });

    return NextResponse.json({
      success: true,
      history: reportList.documents ?? [],
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};