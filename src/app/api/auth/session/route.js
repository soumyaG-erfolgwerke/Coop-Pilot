import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { cookies } from "next/headers";
import {
  createAdminClient,
  appwriteFetchWithSession,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Parse session data (contains cookieValue and userId)
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (parseError) {
      // Invalid session data, clear cookie
      cookieStore.delete("appwrite-session");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Support both old cookie format {secret, userId} and new {cookieValue, userId}
    const cookieValue = sessionData.cookieValue || sessionData.secret || null;

    // Use Cookie-based fetch to get account info (phone, verification status)
    let accountInfo = {};

    let userLabels = [];
    try {
      if (cookieValue) {
        const res = await appwriteFetchWithSession(cookieValue, "/account");
        if (res.ok) {
          const accountData = await res.json();
          userLabels = accountData.labels || [];
          accountInfo = {
            email: accountData.email || null,
            phone: accountData.phone || null,
            emailVerification: accountData.emailVerification || false,
            phoneVerification: accountData.phoneVerification || false,
          };
        }
      }
    } catch (accountError) {
      console.error("Failed to fetch account info:", accountError.message);
    }

    const isTeamMember = userLabels.includes("teamMember");

    // Use admin client for database access
    const { databases } = createAdminClient();

    // User info from stored session
    const currentUser = {
      $id: sessionData.userId,
    };

    let userProfile = null;
    try {
      if (isTeamMember) {
        const profileResult = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_AUDITTEAM_MEMBERS,
          [Query.equal("email", accountInfo.email)],
        );

        if (profileResult.documents.length > 0) {
          if (profileResult.documents[0].isActive === false) {
            return NextResponse.json(
              {
                error:
                  "Your account is inactive. Please contact your administrator.",
              },
              { status: 403 },
            );
          }

          const prf = profileResult.documents[0];
          userProfile = {
            name: prf.name || "",
            email: prf.email || "",
            role: prf.role,
            auditOrgId: prf.auditOrgId,
            empId: prf.empId,
            isActive: prf.isActive,
            createdAt: prf.$createdAt,
            teamMemberId: prf.$id,
          };

        }
      } else {
        const profileResult = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_PROFILE,
          [Query.equal("userId", sessionData.userId)],
        );

        if (profileResult.documents.length > 0) {
          const prf = profileResult.documents[0];
          userProfile = {
            name: `${prf.FirstName} ${prf.LastName}`,
            email: prf.contactEmail,
            role: prf.role,
            status: prf.status,
            userId: prf.userId,
            isVerified: prf.isVerified,
            telephoneNo: prf.telephoneNo || null,
          };
        }
      }
    } catch (profileError) {
      console.error("Failed to fetch profile:", profileError.message);
    }

    // Return merged user data (account info + profile)
    const mergedUser = {
      ...currentUser,
      ...accountInfo,
      ...userProfile,
    };

    return NextResponse.json({ user: mergedUser });
  } catch (error) {
    console.error("Session check error:", error);
    // Session is invalid, clear the cookie
    const cookieStore = await cookies();
    cookieStore.delete("appwrite-session");

    return NextResponse.json({ user: null }, { status: 401 });
  }
}
