import { NextResponse } from "next/server";
import { checkAdminProfileByEmail } from "@/services/onboardingServices/coopadmin/OnboardHelpers";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";
import { verifyOnboardingInviteToken } from "@/lib/auth/onboarding-invite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_ONBOARDINGLOGS } from "@/lib/appwrite-server";

export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const invite = verifyOnboardingInviteToken(searchParams.get("token"));
    let authorized = false;
    if (invite?.email === normalizedEmail) {
      const { databases } = createAdminClient();
      const record = await databases.getDocument(DATABASE_ID, COLLECTION_ID_ONBOARDINGLOGS, invite.inviteId);
      authorized = record.inviteEmail?.toLowerCase() === normalizedEmail &&
        record.coopId === invite.coopId && record.onboarded !== true;
    }
    if (!authorized) {
      const session = await resolveSession({ requireProfile: false });
      authorized = session.email?.toLowerCase() === normalizedEmail;
    }
    if (!authorized) throw new AuthorizationError();
    const hasProfile = await checkAdminProfileByEmail(email);
    return NextResponse.json({ exists: hasProfile }, { status: 200 });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { error: "Failed to check profile" },
      { status: 500 },
    );
  }
};
