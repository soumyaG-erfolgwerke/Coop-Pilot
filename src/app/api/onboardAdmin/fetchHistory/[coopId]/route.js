import { getInviteHistoryByCoopId } from "@/services/onboardingServices/coopadmin/OnboardHelpers";
import { NextResponse } from "next/server";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";

export const GET = async (request, { params }) => {
  const { coopId } = await params;
  try {
    const session = await resolveSession();
    await requireCoopAdministration(session, coopId);
    const history = await getInviteHistoryByCoopId(coopId);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching admin invite history:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite history" },
      { status: 500 },
    );
  }
};
