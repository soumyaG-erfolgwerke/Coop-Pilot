import { getInviteHistoryByCoopId } from "@/services/onboardingServices/coopadmin/OnboardHelpers";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  const { coopId } = await params;
  try {
    const history = await getInviteHistoryByCoopId(coopId);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin invite history:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite history" },
      { status: 500 },
    );
  }
};
