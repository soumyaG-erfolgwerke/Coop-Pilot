import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { cookies } from "next/headers";
import { getViewUrl } from "@/lib/fileUrlService";
import { InputFile } from "node-appwrite/file";
import { createRollbackManager } from "@/lib/rollbackService";
import {
  AUDIT_BUCKET_ID,
  COLLECTION_ID_COOP_DOCS,
  COLLECTION_ID_COOP_REGISTRY,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_DOCUMENTS,
} from "@/lib/appwrite-server";

import {
  publicIdToAuditOrgId,
  changeInviteToAccepted,
} from "@/services/auditOrgServices/miscellaneous";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";
import { getCaptchaProvider } from "@/lib/captcha/provider";
import { assertMalwareFree } from "@/lib/files/malware-scan";
import { isValidCoopSignupData } from "@/lib/validation/coop-signup";
import { safePublicError } from "@/lib/api/safe-public-error";

// POST /api/coopAdminSignUpV2/create - Create new coop admin
export async function POST(request) {
  const rollback = createRollbackManager();

  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: "A multipart form payload is required" },
        { status: 400 },
      );
    }

    const captchaToken = formData.get("captchaToken");

    if (!captchaToken && process.env.NODE_ENV === "production" && getCaptchaProvider() !== "disabled") {
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

    const rawMeta = formData.get("meta");
    const satzungFile = formData.get("satzungFile");
    const avvFile = formData.get("avvFile");

    // 1. Validate required inputs
    if (!rawMeta || typeof rawMeta !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing metadata payload" },
        { status: 400 },
      );
    }
    if (!satzungFile || typeof satzungFile === "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid Satzung file" },
        { status: 400 },
      );
    }

    let meta;
    try {
      meta = JSON.parse(rawMeta);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid metadata payload" },
        { status: 400 },
      );
    }

    const satzungArrayBuffer = await satzungFile.arrayBuffer();
    const satzungBuffer = Buffer.from(satzungArrayBuffer);
    await assertMalwareFree(satzungBuffer);

    let avvBuffer = null;
    if (avvFile && typeof avvFile !== "string") {
      avvBuffer = Buffer.from(await avvFile.arrayBuffer());
      await assertMalwareFree(avvBuffer);
    }
    if (!isValidCoopSignupData(meta)) {
      return NextResponse.json({ success: false, error: "Invalid signup data" }, { status: 422 });
    }

    let auditOrgId = null;
    let Notes = null;
    let isInvited = false;

    // 2. Determine Audit Org Status
    if (meta.auditOrg?.type === "linked" && meta.auditOrg?.data?.publicId) {
      auditOrgId = meta.auditOrg.data.$id;
      isInvited = true;
    } else {
      Notes =
        meta.auditOrg?.data?.$id === "OTHER"
          ? meta.auditOrg?.data?.name
          : meta.auditOrg?.data?.$id === "NONE"
            ? "No Audit Partner"
            : meta.auditOrg?.data?.$id || null;
    }

    const { databases, users, storage } = createAdminClient();

    // 3. Prevent duplicate cooperatives
    const existingCoop = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      [Query.equal("RegNumber", meta.registryNumber)],
    );

    if (existingCoop.documents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This cooperative is already registered on the platform.",
        },
        { status: 409 },
      );
    }

    const profileDocumentId = ID.unique();
    const adminFullName =
      `${meta.fullLegalFirstMiddleName} ${meta.fullLegalLastName}`.trim();

    // Safely format phone number for Appwrite (requires E.164 format or undefined)
    const formattedPhone =
      meta.phoneCountryCode && meta.phoneNumber
        ? `${meta.phoneCountryCode}${meta.phoneNumber}`
        : undefined;

    // 4. Create Appwrite User
    const createdUser = await users.create(
      ID.unique(),
      meta.email,
      formattedPhone,
      meta.password,
      adminFullName,
    );

    rollback.add(async () => {
      await users.delete(createdUser.$id);
    });

    const placeholderColors = [
      "2ECC71",
      "3498DB",
      "E74C3C",
      "9B59B6",
      "F1C40F",
      "1ABC9C",
      "E67E22",
    ];

    const businessName = meta?.businessName || "Cooperative";
    const colorIndex = businessName.length % placeholderColors.length;
    const selectedColor = placeholderColors[colorIndex];

    // 5. Prepare and Create Cooperative Document
    const coopData = {
      name: meta.businessName,
      country: meta.country,
      state: meta.state,
      RegNumber: meta.registryNumber,
      sector: meta.businessSector,
      about: meta.businessDescription || "N/A",
      street: meta.street,
      houseNo: meta.houseNo,
      postalCode: meta.postalCode,
      adminName: adminFullName,
      admins: [meta.email],
      location: meta.location,
      size: String(meta.size || "1"),
      CourtName: meta.courtName || "",
      sharePrice: Number.parseFloat(meta.sharePrice),
      status: "active",
      auditJson: "{}",
      max_shares: Number.parseInt(meta.maxShares, 10),
      auto_approval_membership: false,
      member_number_format: meta.memberNumberFormat,
      auditOrgId,
      Notes,
      incorporatedAt: meta.incorporatedAt,
      logo: `https://placehold.co/40x40/${selectedColor}/FFFFFF?text=${encodeURIComponent(businessName.charAt(0).toUpperCase())}`,
    };

    const coop = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      ID.unique(),
      coopData,
    );

    rollback.add(async () => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        coop.$id,
      );
    });

    const uploadedAt = new Date();
    const year = uploadedAt.getUTCFullYear();
    const month = String(uploadedAt.getUTCMonth() + 1).padStart(2, "0");
    const version = `${year}-${month}`;

    // 6.1 Upload Satzung File & Record in DB
    const uploadedSatzung = await storage.createFile(
      AUDIT_BUCKET_ID,
      ID.unique(),
      InputFile.fromBuffer(satzungBuffer, satzungFile.name),
    );

    rollback.add(async () => {
      await storage.deleteFile(AUDIT_BUCKET_ID, uploadedSatzung.$id);
    });

    //6.2 Create Document Record for Satzung
    const satzungDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      ID.unique(),
      {
        coopId: coop.$id,
        fileId: uploadedSatzung.$id,
        fileName: satzungFile.name,
        mimeType: satzungFile.type,
        fileSize: Number(satzungFile.size),
        category: "SATZUNG",
        subCategory: null,
        visibleToMembers: true,
        downloadAllowed: true,
        isCurrent: true,
        uploadedAt: new Date().toISOString(),
        effectiveFrom: new Date().toISOString(),
        sharedWithMembers: true,
        version: version,
        referenceId: ID.unique(),
        referenceYear: year,
        uploadedBy: createdUser.$id,
      },
    );

    rollback.add(async () => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_DOCUMENTS,
        satzungDoc.$id,
      );
    });

    // 7. Upload AVV File (if provided) and handle URL safely
    let avvFileUrl = null;
    if (avvFile && avvBuffer) {
      const uploadedAvv = await storage.createFile(
        AUDIT_BUCKET_ID,
        ID.unique(),
        InputFile.fromBuffer(avvBuffer, avvFile.name),
      );

      rollback.add(async () => {
        await storage.deleteFile(AUDIT_BUCKET_ID, uploadedAvv.$id);
      });

      avvFileUrl = getViewUrl(uploadedAvv.$id);
    }

    // 8. Prepare and Create Profile Document
    const profileData = {
      userId: createdUser.$id,
      FirstName: meta.fullLegalFirstMiddleName,
      LastName: meta.fullLegalLastName,
      street: meta.address?.street || meta.street,
      houseNo: meta.address?.houseNo || meta.houseNo,
      add: null,
      postalCode: meta.address?.postalCode || meta.postalCode,
      location: meta.address?.city || meta.location,
      accountHolder: "Coop Admin Account Holder",
      ibanNo: meta.iban,
      bic: meta.bic,
      taxId: null,
      bday: meta.dateOfBirth || new Date(1990, 0, 1).toISOString(),
      contactEmail: meta.email,
      telephoneNo: formattedPhone || null,
      howHeard: "FAF",
      exp: true,
      role: "coopadmin",
      status: "active",
      isVerified: false,
      avv: avvFileUrl, // Safely assigned null if no file was uploaded
    };

    const profileDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      profileDocumentId,
      profileData,
    );

    rollback.add(async () => {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID_PROFILE,
        profileDoc.$id,
      );
    });

    // 9. Update Cooperative Registry Admins
    if (meta.directorName && meta.registryNumber) {
      const registryDocs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_COOP_REGISTRY,
        [Query.equal("RegNumber", meta.registryNumber)],
      );

      if (registryDocs.documents.length > 0) {
        const registryDoc = registryDocs.documents[0];
        const existingAdmins = registryDoc.regAdmin || [];

        if (!existingAdmins.includes(meta.directorName)) {
          const updatedAdmins = [...existingAdmins, meta.directorName];
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_COOP_REGISTRY,
            registryDoc.$id,
            { regAdmin: updatedAdmins },
          );

          rollback.add(async () => {
            await databases.updateDocument(
              DATABASE_ID,
              COLLECTION_ID_COOP_REGISTRY,
              registryDoc.$id,
              { regAdmin: existingAdmins },
            );
          });
        }
      }
    }

    if (isInvited) {
      try {
        const isAccepted = await changeInviteToAccepted(
          meta.email,
          meta.registryNumber,
        );
      } catch (error) {
        console.error("Error changing invite to accepted:", error);
      }
    }

    // 10. Generate Appwrite Session (Raw HTTP to extract secret cookie)
    const loginResponse = await fetch(
      `${process.env.APPWRITE_ENDPOINT}/account/sessions/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({
          email: meta.email,
          password: meta.password,
        }),
      },
    );

    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.error("Session creation error:", loginError);
      throw new Error(
        loginError.message || "Failed to create session after signup",
      );
    }

    const session = await loginResponse.json();

    // Extract session cookie safely
    const cookieName = `a_session_${process.env.APPWRITE_PROJECT_ID}`;
    let sessionCookieValue = "";
    const setCookieHeaders = loginResponse.headers.getSetCookie?.() || [];

    for (const c of setCookieHeaders) {
      if (
        c.startsWith(`${cookieName}=`) &&
        !c.startsWith(`${cookieName}_legacy=`)
      ) {
        sessionCookieValue = c.split("=").slice(1).join("=").split(";")[0];
        break;
      }
    }

    // Fallback for cookie extraction
    if (!sessionCookieValue) {
      const fallback = loginResponse.headers.get("x-fallback-cookies");
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback);
          sessionCookieValue = parsed[cookieName] || "";
        } catch (e) {
          console.error("Failed to parse fallback cookies", e);
        }
      }
    }

    if (!sessionCookieValue) {
      throw new Error("Failed to establish session: Cookie missing");
    }

    // 11. Set Next.js HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set(
      "appwrite-session",
      JSON.stringify({
        cookieValue: sessionCookieValue,
        userId: session.userId,
        role: "coopadmin",
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    await rollback.execute();
    console.error("Admin Creation Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: safePublicError(error, "Unable to complete signup"),
      },
      { status: 500 },
    );
  }
}
