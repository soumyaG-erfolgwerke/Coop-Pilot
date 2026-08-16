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
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";
import { logger } from "@/lib/logger";

export async function POST(request) {
  try {
    const { hostname } = request.nextUrl;
    const { email, password, captchaToken } = await request.json();

    if (
      typeof email !== "string" || !email || email.length > 254 ||
      typeof password !== "string" || !password || password.length > 128
    ) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!captchaToken && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Captcha token is required" },
        { status: 400 },
      );
    }

    if (process.env.NODE_ENV === "production") {
      const ok = await verifyCaptcha(captchaToken);
      console.log("Captcha verification result:", ok);
      if (!ok) {
        return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
      }
    }
    // Create session via raw HTTP call (not the SDK)
    // The node-appwrite server SDK sends x-sdk-platform: server header
    // which causes Appwrite to strip session.secret from responses
    const loginResponse = await fetch(
      `${process.env.APPWRITE_ENDPOINT}/account/sessions/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({ email, password }),
      },
    );

    if (!loginResponse.ok) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const session = await loginResponse.json();

    // Extract the real session cookie from Set-Cookie header
    // Appwrite returns the secret in Set-Cookie, NOT in the JSON body
    const appwriteCookieName = `a_session_${process.env.APPWRITE_PROJECT_ID}`;
    let sessionCookieValue = "";
    const setCookieHeaders = loginResponse.headers.getSetCookie?.() || [];
    for (const c of setCookieHeaders) {
      if (
        c.startsWith(appwriteCookieName + "=") &&
        !c.startsWith(appwriteCookieName + "_legacy=")
      ) {
        sessionCookieValue = c.split("=").slice(1).join("=").split(";")[0];
        break;
      }
    }

    // Fallback: try X-Fallback-Cookies header
    if (!sessionCookieValue) {
      const fallback = loginResponse.headers.get("x-fallback-cookies");
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback);
          sessionCookieValue = parsed[appwriteCookieName] || "";
        } catch { }
      }
    }

    if (!sessionCookieValue) {
      throw new Error("Failed to establish session - no cookie returned");
    }

    // Use admin client for database access
    const { databases, users } = createAdminClient();

    // User info from login
    const currentUser = {
      $id: session.userId,
      email: email,
    };

    const user = await users.get(session.userId);
    const userLabels = user.labels || [];

    const isOrgAdmin = userLabels.includes("orgAdmin");
    const isTeamMember = userLabels.includes("teamMember");

    // Fetch profile data from database
    let userProfile = null;
    let fetchedRole = "";
    try {
      let profileResult;
      if (isTeamMember) {
        profileResult = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_AUDITTEAM_MEMBERS,
          [Query.equal("email", currentUser.email)],
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
        }
      } else {
        profileResult = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_PROFILE,
          [Query.equal("userId", currentUser.$id)],
        );
      }

      if (profileResult.documents.length > 0 && !isTeamMember) {
        const prf = profileResult.documents[0];
        fetchedRole = prf.role || "";
        userProfile = {
          name: `${prf.FirstName} ${prf.LastName}`,
          email: prf.contactEmail,
          role: prf.role,
          status: prf.status,
          userId: prf.userId,
          isVerified: prf.isVerified,
          telephoneNo: prf.telephoneNo || null,
        };
      } else if (profileResult.documents.length > 0 && isTeamMember) {
        const prf = profileResult.documents[0];
        fetchedRole = prf.role || "";
        userProfile = {
          teamMemberId: prf.$id,
          name: prf.name,
          email: prf.email,
          role: prf.role,
          auditOrgId: prf.auditOrgId,
          empId: prf.empId,
          isActive: prf.isActive,
          createdAt: prf.$createdAt,
        };
      }
    } catch (profileError) {
      console.error("Failed to fetch profile:", profileError.message);
    }

    const restrictedRoles = ["auditer", "aud_E", "aud_T", "org_admin"];
    if (process.env.NODE_ENV === "production") {
      if (restrictedRoles.includes(fetchedRole)) {
        if (!isOrgAdmin && !isTeamMember) {
          return NextResponse.json(
            {
              error: "Invalid Access due to role restrictions. Please contact your administrator.",
            },
            { status: 401 }
          );
        }
      }
    }

    // Set session cookie (HTTP-only for security)
    const cookieStore = await cookies();

    // Store only the opaque provider session secret. Identity and role are
    // resolved server-side from Appwrite on every protected request.
    const sessionData = JSON.stringify({
      cookieValue: sessionCookieValue,
    });

    cookieStore.set("appwrite-session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Fetch account info (phone, verification status) using session cookie
    let accountInfo = {};
    try {
      if (sessionCookieValue) {
        const res = await appwriteFetchWithSession(
          sessionCookieValue,
          "/account",
        );
        if (res.ok) {
          const accountData = await res.json();
          accountInfo = {
            phone: accountData.phone || null,
            emailVerification: accountData.emailVerification || false,
            phoneVerification: accountData.phoneVerification || false,
          };
        }
      }
    } catch (accountError) {
      console.error("Failed to fetch account info:", accountError.message);
    }

    // Return merged user data (account info + profile)
    const mergedUser = {
      ...currentUser,
      ...accountInfo,
      ...userProfile,
    };

    // Log successful login to the Winston MongoDB audit_logs collection
    try {
      logger.audit({
        eventType: "USER_LOGIN_SUCCESS",
        category: "AUTH",
        message: "User logged in successfully",
        actorId: session.userId,
        metadata: {
          role: fetchedRole,
        },
      });
    } catch (logErr) {
      console.error("Failed to write login audit log:", logErr.message);
    }

    return NextResponse.json({ user: mergedUser });
  } catch (error) {
    console.error("Login error:", error);

    // Log failed login to the Winston MongoDB system_logs collection
    try {
      logger.warn({
        eventType: "USER_LOGIN_FAILURE",
        category: "AUTH",
        message: "Failed login attempt",
      });
    } catch (logErr) {
      console.error("Failed to write login failure log:", logErr.message);
    }

    return NextResponse.json(
      { error: "Invalid email, password, or account access" },
      { status: 401 },
    );
  }
}
