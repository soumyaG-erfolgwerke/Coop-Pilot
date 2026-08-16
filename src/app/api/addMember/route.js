import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
  AVV_BUCKET_id,
} from "@/lib/appwrite-server";
import { getSecureFileUrl } from "@/lib/secureFileUrl";
import { ID } from "node-appwrite";
import { createRollbackManager } from "@/lib/rollbackService";
import { safePublicError } from "@/lib/api/safe-public-error";
import { assertMalwareFree } from "@/lib/files/malware-scan";
import { InputFile } from "node-appwrite/file";
import {
  requireRole,
  resolveSession,
  sessionErrorResponse,
} from "@/lib/auth/session";

/**
 * POST /api/addMember
 * Creates a new user, their profile, and handles the initial KYC upload in one transaction.
 */
export async function POST(request) {
  const rollback = createRollbackManager();
  const { users, databases } = createAdminClient();

  try {
    requireRole(await resolveSession(), ["superuser"]);
    const formData = await request.formData();

    // 1. Extract and Validate Data
    const email = formData.get("email");
    const password = formData.get("password");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");

    if (!email || !password || !firstName || !lastName || !formData.get("birthYear") || !formData.get("birthMonth") || !formData.get("birthDay")) {
      return NextResponse.json(
        { success: false, error: { message: "Missing required registration fields" } },
        { status: 400 }
      );
    }

    // 2. Step 1: Create User Account
    const createdUser = await users.create(
      ID.unique(),
      email,
      undefined, // phone
      password,
      `${firstName} ${lastName}`,
    );

    // Register User Rollback
    rollback.add(() => users.delete(createdUser.$id));

    // Upload AVV if available
    let avvLink = null;
    const avvFile = formData.get("avvFile");
    let avvBuffer = null;
    if (avvFile && typeof avvFile !== "string") {
      avvBuffer = Buffer.from(await avvFile.arrayBuffer());
      await assertMalwareFree(avvBuffer);
    }
    
    // Fallback URL pattern if `storage.getFileView` string generation is preferred:
    // `ENDPOINT/storage/buckets/BUCKET_ID/files/FILE_ID/view?project=PROJECT_ID`
    if (avvFile && avvBuffer) {
      const { storage } = createAdminClient();
      const uploadedFile = await storage.createFile(
        AVV_BUCKET_id,
        ID.unique(),
        InputFile.fromBuffer(avvBuffer, avvFile.name)
      );
      avvLink = getSecureFileUrl(AVV_BUCKET_id, uploadedFile.$id);
      rollback.add(() => storage.deleteFile(AVV_BUCKET_id, uploadedFile.$id));
    }

    // 3. Step 2: Create Profile
    const profileData = {
      userId: createdUser.$id,
      salutation: formData.get("salutation"),
      FirstName: firstName,
      LastName: lastName,
      title: formData.get("title") || null,
      street: formData.get("street"),
      houseNo: formData.get("houseNumber"),
      add: formData.get("noAddition") || null,
      postalCode: formData.get("postalCode"),
      location: formData.get("location"),
      accountHolder: formData.get("accountHolder"),
      ibanNo: formData.get("iban"),
      bic: formData.get("bic"),
      taxId: formData.get("taxId") || null,
      bday: new Date(
        parseInt(formData.get("birthYear")),
        parseInt(formData.get("birthMonth")) - 1,
        parseInt(formData.get("birthDay"))
      ).toISOString(),
      contactEmail: email,
      telephoneNo: formData.get("telephone") || null,
      howHeard: formData.get("howDidYouHear"),
      exp: formData.get("investedBefore") === "Yes",
      role: "member",
      status: "active",
      avv: avvLink,
      // kycStatus: "PENDING",
    };

    const profile = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      ID.unique(),
      profileData
    );

    // Register Profile Rollback
    rollback.add(() => databases.deleteDocument(DATABASE_ID, COLLECTION_ID_PROFILE, profile.$id));


    return NextResponse.json({
      success: true,
      userId: createdUser.$id,
      profileId: profile.$id,
    });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return sessionErrorResponse(error);
    }
    console.error("Critical Registration Failure (Triggering Rollback):", error);

    // [User Request Fix] Improved rollback trigger: 
    // Use the 409 conflict code instead of fragile string matching.
    // If it's a 409, a record already exists, so we shouldn't delete anything.
    // For any other error (500, etc.), we rollback to keep the DB clean.
    if (rollback && rollback.size() > 0 && error.code !== 409) {
        await rollback.execute();
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: safePublicError(error, "Registration failed. Please check your details and try again."),
          code: error.code || 500,
          type: error.type || "INTERNAL_ERROR"
        }
      },
      { status: error.code === 409 ? 409 : 500 },
    );
  }
}
