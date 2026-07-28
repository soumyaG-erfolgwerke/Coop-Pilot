import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { cookies } from "next/headers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_AUDIT_ORGS,
  AVV_BUCKET_id,
  ENDPOINT,
  PROJECT_ID,
} from "@/lib/appwrite-server";
import { createRollbackManager } from "@/lib/rollbackService";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";

export async function POST(request) {
  const rollback = createRollbackManager();
  const { users, databases, storage } = createAdminClient();

  try {
    const formData = await request.formData();

    const email = formData.get("email");
    const password = formData.get("password");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const organisationName = formData.get("organisationName");
    const captchaToken = formData.get("captchaToken");  

    // Validate request data
    if (!email || !password || !firstName || !lastName || !organisationName) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Missing required registration fields" },
        },
        { status: 400 },
      );
    }

    if (!captchaToken && process.env.NEXT_PUBLIC_NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Captcha token is required" },
        { status: 400 },
      );
    }

    if (process.env.NEXT_PUBLIC_NODE_ENV === "production") {
      const ok = await verifyCaptcha(captchaToken);
      console.log("Captcha verification result:", ok);
      if (!ok) {
        return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
      }
    }

    // Step 1: Create User Account
    const createdUser = await users.create(
      ID.unique(),
      email,
      formData.get("phoneNumber")
        ? `${formData.get("phoneCountryCode") || ""}${formData.get("phoneNumber")}`
        : undefined,
      password,
      `${firstName} ${lastName}`,
    );

    await users.updateLabels(createdUser.$id, ["orgAdmin"]);
    // Register User Rollback
    rollback.add(() => users.delete(createdUser.$id));

    // Step 2: Prepare profile data
    const profileData = {
      userId: createdUser.$id,
      FirstName: firstName,
      LastName: lastName,
      title: formData.get("title") || null,
      street: formData.get("street") || null,
      houseNo: "123",
      add: null,
      postalCode: formData.get("postcode") || null,
      location: formData.get("city") || null,
      accountHolder: formData.get("ibanAccountHolder") || null,
      ibanNo: formData.get("iban") || null,
      taxId: null,
      bday: "1990-01-01T00:00:00.000Z", // Default birth date
      contactEmail: email,
      telephoneNo: formData.get("phoneNumber")
        ? `${formData.get("phoneCountryCode") || ""}${formData.get("phoneNumber")}`
        : null,
      howHeard: "FAF",
      exp: true,
      role: "org_admin",
      status: "active",
      isVerified: false,
    };

    let avvLink = null;
    const avvFile = formData.get("avvFile");
    if (avvFile && typeof avvFile !== "string") {
      const uploadedFile = await storage.createFile(
        AVV_BUCKET_id,
        ID.unique(),
        avvFile,
      );
      avvLink = `${ENDPOINT}/storage/buckets/${AVV_BUCKET_id}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;
      rollback.add(() => storage.deleteFile(AVV_BUCKET_id, uploadedFile.$id));
    }

    profileData.avv = avvLink;
    // Create the profile document
    const profile = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      ID.unique(),
      profileData,
    );

    // Register Profile Rollback
    rollback.add(() =>
      databases.deleteDocument(DATABASE_ID, COLLECTION_ID_PROFILE, profile.$id),
    );

    // Step 3: Prepare audit_orgs data
    const auditOrgData = {
      publicId: ID.unique(),
      OrgName: organisationName,
      City: formData.get("city") || null,
      state: formData.get("state") || null,
      street: formData.get("street") || null,
      abbreviation: formData.get("abbreviation") || null,
      postCode: formData.get("postcode") || null,
      zul_number: formData.get("zulassungNumber") || null,
      sector: formData.get("sectorFocus") || null,
      website: formData.get("website") || null,
      iban: formData.get("iban") || null,
      bic: formData.get("bic") || null,
      acc_name: formData.get("ibanAccountHolder") || null,
      logo_url: formData.get("logoUrl") || null,
      stamp_url: formData.get("stampUrl") || null,
      admin_email: email,
    };

    // Create the audit organization document
    const auditOrg = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      ID.unique(),
      auditOrgData,
    );

    // Register Audit Org Rollback
    rollback.add(() =>
      databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_AUDIT_ORGS,
        auditOrg.$id,
      ),
    );

    // Step 4: Establish session (similar to coopAdminSignUp)
    const loginResponse = await fetch(
      `${process.env.APPWRITE_ENDPOINT}/account/sessions/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      },
    );

    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.error("Session creation error:", loginError);
      throw new Error("Failed to create session after signup");
    }

    const session = await loginResponse.json();

    // Extract the real session cookie from Set-Cookie header
    const cookieName = `a_session_${process.env.APPWRITE_PROJECT_ID}`;
    let sessionCookieValue = "";
    const setCookieHeaders = loginResponse.headers.getSetCookie?.() || [];
    for (const c of setCookieHeaders) {
      if (
        c.startsWith(cookieName + "=") &&
        !c.startsWith(cookieName + "_legacy=")
      ) {
        sessionCookieValue = c.split("=").slice(1).join("=").split(";")[0];
        break;
      }
    }

    if (!sessionCookieValue) {
      const fallback = loginResponse.headers.get("x-fallback-cookies");
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback);
          sessionCookieValue = parsed[cookieName] || "";
        } catch {}
      }
    }

    if (!sessionCookieValue) {
      console.error("Could not extract session cookie from login response");
      throw new Error("Failed to establish session");
    }

    const cookieStore = await cookies();
    cookieStore.set(
      "appwrite-session",
      JSON.stringify({
        cookieValue: sessionCookieValue,
        userId: session.userId,
        role: "org_admin",
      }),
      {
        httpOnly: true,
        secure: process.env.NEXT_PUBLIC_NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Critical Registration Failure (Triggering Rollback):",
      error,
    );

    if (rollback && rollback.size() > 0 && error.code !== 409) {
      await rollback.execute();
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error.message ||
            "Registration failed. Please check your details and try again.",
          code: error.code || 500,
          type: error.type || "INTERNAL_ERROR",
        },
      },
      { status: error.code === 409 ? 409 : 500 },
    );
  }
}
