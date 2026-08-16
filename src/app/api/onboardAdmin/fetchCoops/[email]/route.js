import { getCoopById } from "@/lib/helpers/_helpers";
import {
  getCoopsByAdminEmail,
} from "@/services/onboardingServices/coopadmin/OnboardHelpers";
import { NextResponse } from "next/server";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";
import { verifyOnboardingInviteToken } from "@/lib/auth/onboarding-invite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_ONBOARDINGLOGS } from "@/lib/appwrite-server";

export const GET = async (request, { params }) => {
  const { email } = await params;
  try {
    const requestedEmail = decodeURIComponent(email).trim().toLowerCase();
    const token = new URL(request.url).searchParams.get("token");
    const invite = verifyOnboardingInviteToken(token);
    let authorized = false;
    let session = null;
    if (invite?.email === requestedEmail) {
      const { databases } = createAdminClient();
      const record = await databases.getDocument(DATABASE_ID, COLLECTION_ID_ONBOARDINGLOGS, invite.inviteId);
      authorized = record.inviteEmail?.toLowerCase() === requestedEmail &&
        record.coopId === invite.coopId && record.onboarded !== true &&
        record.for === "coopadmin" && record.type === "SOLO";
    }
    if (!authorized) {
      session = await resolveSession({ requireProfile: false });
      authorized = session.email?.toLowerCase() === requestedEmail;
    }
    if (!authorized) throw new AuthorizationError();
    const inviteData = await getCoopsByAdminEmail(requestedEmail);
    const coopIds = invite && !session?.userId
      ? inviteData.coopIds.filter((id) => id === invite.coopId)
      : inviteData.coopIds;
    const { inviteFullName } = inviteData;
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
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
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
