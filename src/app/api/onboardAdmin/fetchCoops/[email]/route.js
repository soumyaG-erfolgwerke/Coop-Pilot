import { getCoopById } from "@/lib/helpers/_helpers";
import {
  getAllCoopsDataById,
  getCoopsByAdminEmail,
} from "@/services/onboardingServices/coopadmin/OnboardHelpers";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  const { email } = await params;
  try {
    const { coopIds, inviteFullName } = await getCoopsByAdminEmail(email);
    // console.log("coop ids:", coopIds);
    const coopsData = coopIds.map((id) => id); // Map to array of objects with id property
    const allCoopsData = await Promise.all(
      coopsData.map(async (coopId) => {
        return getCoopById(coopId);
      }),
    );
    // console.log("all coops data:", allCoopsData);
    return NextResponse.json(
      { total: coopIds.length, coops: allCoopsData, inviteFullName },
      { status: 200 },
    );
  } catch (error) {
    if (error?.code === 404) {
      return NextResponse.json({ total: 0, coops: [] }, { status: 200 });
    }
    console.error("Error fetching coops by admin email:", error);
    return NextResponse.json(
      { error: "Failed to fetch coops" },
      { status: 500 },
    );
  }
};
