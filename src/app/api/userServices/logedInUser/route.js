import { NextResponse } from "next/server";
import { account } from "@/lib/appwrite-server";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

export const GET = async () => {
  try {
    const user = await getAuthenticatedProfile();
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error in logedInUserService:", error);
    return NextResponse.json(
      { success: false, error: "Could not fetch user" },
      { status: 500 },
    );
  }
};
