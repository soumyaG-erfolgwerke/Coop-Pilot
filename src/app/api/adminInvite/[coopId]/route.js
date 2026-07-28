import { getCoopById } from "@/lib/helpers/_helpers";
import {
  checkAlreadyOnboarded,
  deSerializeInviteData,
  sendAdminInvitation,
} from "@/services/onboardingServices/coopadmin/OnboardHelpers";
import { NextResponse } from "next/server";

export const POST = async (request, { params }) => {
  const { coopId } = await params;

  try {
    const formData = await request.json();

    // Validation
    if (!formData?.email) {
      return NextResponse.json(
        { message: "Email is required", code: 400, ok: false },
        { status: 400 },
      );
    }

    const coop = await getCoopById(coopId);

    if (!coop) {
      return NextResponse.json(
        { message: "Cooperative not found", code: 404, ok: false },
        { status: 404 },
      );
    }

    if (coop?.admins?.includes(formData.email)) {
      return NextResponse.json(
        {
          message: "User is already an admin of this cooperative",
          ok: false,
          code: 409,
        },
        { status: 409 },
      );
    }

    const isAlreadyOnboarded = await checkAlreadyOnboarded(
      formData.email,
      coopId,
    );

    if (isAlreadyOnboarded) {
      return NextResponse.json(
        { message: "User has already been invited", ok: false, code: 409 },
        { status: 409 },
      );
    }

    const inviteData = await deSerializeInviteData(formData);
    const res = await sendAdminInvitation(inviteData);

    return NextResponse.json(
      {
        message: "Admin invitation sent successfully",
        code: 200,
        ok: true,
        data: res,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending admin invite:", error);
    return NextResponse.json(
      { message: "Failed to send admin invitation", code: 500, ok: false },
      { status: 500 },
    );
  }
};
