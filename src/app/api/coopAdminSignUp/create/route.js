import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { cookies } from "next/headers";
import { 
  createAdminClient,
  DATABASE_ID, 
  COLLECTION_ID_PROFILE, 
  COLLECTION_ID_COOP_PLATFORM_REGISTRY,
  COLLECTION_ID_COOP_REGISTRY 
} from "@/lib/appwrite-server";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";

// POST /api/coopAdminSignUp/create - Create new coop admin
export async function POST(request) {
  try {
    const formData = await request.json();
    let isAdd = false;

    const captchaToken = formData.get("captchaToken");  

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

    const { databases, users } = createAdminClient();

    const profileDocumentId = ID.unique();

    // Step 1: Create the user account using admin users API
    const createdUser = await users.create(
      ID.unique(),
      formData.email,
      `${formData.phoneCountryCode}${formData.phoneNumber}`,
      formData.password,
      `${formData.fullLegalFirstMiddleName} ${formData.fullLegalLastName}`
    );

    // Step 2: Check if coop is already on platform
    const coopOnPlatform = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOP_PLATFORM_REGISTRY,
      [Query.equal("RegNumber", formData.registryNumber)]
    );

    if (coopOnPlatform.documents.length > 0) {
      isAdd = true;
    }

    const platformCoopRegistryData = {
      name: formData.businessName,
      country: formData.country,
      state: formData.state,
      RegNumber: formData.registryNumber,
      sector: formData.businessSector,
      about: formData.businessDescription || "N/A",
      street: "Placeholder Street",
      houseNo: "123",
      postalCode: "000000",
      adminName: `${formData.fullLegalFirstMiddleName} ${formData.fullLegalLastName}`,
      admin: formData.email,
      isPending: true,
      isAdd: isAdd,
      location: "Placeholder City",
      size: parseInt(formData.size, 10) || 1,
      CourtName: formData.courtName || "Berlin High Court",
    };

    // Step 3: Create the coop platform registry document
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_COOP_PLATFORM_REGISTRY,
      ID.unique(),
      platformCoopRegistryData
    );

    // Step 4: Prepare profile data
    const profileData = {
      userId: createdUser.$id,
      FirstName: formData.fullLegalFirstMiddleName,
      LastName: formData.fullLegalLastName,
      street: formData.street || "Placeholder Street",
      houseNo: formData.houseNo || "123",
      add: null,
      postalCode: formData.postalCode || "000000",
      location: formData.location || "Placeholder City",
      accountHolder: "Coop Admin Account Holder",
      ibanNo: "de1234567890",
      taxId: null,
      bday: formData.dateOfBirth || new Date(1990, 0, 1).toISOString(),
      contactEmail: formData.email,
      telephoneNo: `${formData.phoneCountryCode}${formData.phoneNumber}` || null,
      howHeard: "FAF",
      exp: true,
      role: "coopadmin",
      status: "active",
      isVerified: false,
    };

    // Step 5: Create the profile document
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      profileDocumentId,
      profileData
    );

    // Step 6: Update coopRegistry regAdmin[] with the registered admin's director name
    if (formData.directorName && formData.registryNumber) {
      const registryDocs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_COOP_REGISTRY,
        [Query.equal("RegNumber", formData.registryNumber)]
      );

      if (registryDocs.documents.length > 0) {
        const registryDoc = registryDocs.documents[0];
        const existingAdmins = registryDoc.regAdmin || [];
        if (!existingAdmins.includes(formData.directorName)) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_COOP_REGISTRY,
            registryDoc.$id,
            { regAdmin: [...existingAdmins, formData.directorName] }
          );
        }
      }
    }

    // Step 7: Create a session via raw HTTP (bypasses server SDK which strips secrets)
    const loginResponse = await fetch(
      `${process.env.APPWRITE_ENDPOINT}/account/sessions/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      }
    );

    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.error("Session creation error:", loginError);
      throw new Error("Failed to create session after signup");
    }

    const session = await loginResponse.json();

    // Extract the real session cookie from Set-Cookie header
    // Appwrite returns the secret in Set-Cookie, NOT in the JSON body
    const cookieName = `a_session_${process.env.APPWRITE_PROJECT_ID}`;
    let sessionCookieValue = "";
    const setCookieHeaders = loginResponse.headers.getSetCookie?.() || [];
    for (const c of setCookieHeaders) {
      if (c.startsWith(cookieName + "=") && !c.startsWith(cookieName + "_legacy=")) {
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
          sessionCookieValue = parsed[cookieName] || "";
        } catch {}
      }
    }

    if (!sessionCookieValue) {
      console.error("Could not extract session cookie from login response");
      throw new Error("Failed to establish session");
    }

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", JSON.stringify({
      cookieValue: sessionCookieValue,
      userId: session.userId,
      role: "coopadmin"
    }), {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error || "Could not create admin" },
      { status: 500 }
    );
  }
}
