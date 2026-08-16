import { getCoopById } from "@/lib/helpers/_helpers";
import { NextResponse } from "next/server";
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";

export const GET = async (request, { params }) => {
  try {
    const session = await resolveSession({ requireProfile: false });
    const { id } = await params;
    // console.log("Received coop ID:", id);
    const coopsData = await getCoopById(id);
    const isPlatformAdmin = ["superuser", "superadmin"].some((role) => session.labels.includes(role));
    const isInvitedAdmin = Array.isArray(coopsData?.admins) && coopsData.admins.includes(session.email);
    if (!isPlatformAdmin && !isInvitedAdmin) {
      throw new AuthorizationError();
    }
    // console.log("coopsData", coopsData);
    return NextResponse.json(
      {
        total: coopsData ? 1 : 0,
        coop: coopsData,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error fetching coop data by IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch coop data" },
      { status: 500 },
    );
  }
};
