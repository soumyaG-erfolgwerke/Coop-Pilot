import { NextResponse } from "next/server";
import { checkAdminProfileByEmail } from "@/services/onboardingServices/coopadmin/OnboardHelpers";

export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const hasProfile = await checkAdminProfileByEmail(email);
    return NextResponse.json({ exists: hasProfile }, { status: 200 });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { error: "Failed to check profile" },
      { status: 500 },
    );
  }
};
