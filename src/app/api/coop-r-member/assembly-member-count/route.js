import { NextResponse } from "next/server";
import { getAssemblyMemberCountInternal } from "@/lib/memberService";
import { resolveSession, sessionErrorResponse } from "@/lib/auth/session";
import { requireCoopAdministration } from "@/lib/auth/membership-access";
import { safePublicError } from "@/lib/api/safe-public-error";

export async function GET(request) {
    try {
        const session = await resolveSession();
        const { searchParams } = new URL(request.url);
        const coopId = searchParams.get("coopId");

        if (!coopId) {
            return NextResponse.json(
                { success: false, error: "coopId is required" },
                { status: 400 }
            );
        }
        await requireCoopAdministration(session, coopId);

        const count = await getAssemblyMemberCountInternal(coopId);

        return NextResponse.json({ success: true, count });
    } catch (error) {
        if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
        console.error("Failed to fetch verified member count:", error);
        return NextResponse.json(
            { success: false, error: safePublicError(error, "Failed to fetch verified member count") },
            { status: 500 }
        );
    }
}
