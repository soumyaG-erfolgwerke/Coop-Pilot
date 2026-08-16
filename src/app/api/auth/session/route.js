import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AuthorizationError,
  SESSION_COOKIE_NAME,
  resolveSession,
} from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await resolveSession();
    const profile = session.profile;

    const user = session.isTeamMember
      ? {
          $id: session.userId,
          email: session.email,
          phone: session.account.phone || null,
          emailVerification: session.account.emailVerification || false,
          phoneVerification: session.account.phoneVerification || false,
          name: profile.name || "",
          role: session.role,
          auditOrgId: session.auditOrgId,
          empId: profile.empId,
          isActive: profile.isActive,
          createdAt: profile.$createdAt,
          teamMemberId: session.teamMemberId,
        }
      : {
          $id: session.userId,
          userId: session.userId,
          email: session.email,
          phone: session.account.phone || null,
          emailVerification: session.account.emailVerification || false,
          phoneVerification: session.account.phoneVerification || false,
          name: `${profile.FirstName || ""} ${profile.LastName || ""}`.trim(),
          role: session.role,
          status: profile.status,
          isVerified: profile.isVerified,
          telephoneNo: profile.telephoneNo || null,
        };

    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const cookieStore = await cookies();
    if (!(error instanceof AuthorizationError)) {
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
    return NextResponse.json(
      { user: null, error: error?.status === 403 ? "Forbidden" : "Unauthorized" },
      {
        status: error?.status === 403 ? 403 : 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
