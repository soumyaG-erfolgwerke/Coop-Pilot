import { NextResponse } from "next/server";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
  AVV_BUCKET_id,
  ENDPOINT,
  PROJECT_ID
} from "@/lib/appwrite-server";
import { ID } from "node-appwrite";
import { createRollbackManager } from "@/lib/rollbackService";

/**
 * POST /api/addMember
 * Creates a new user, their profile, and handles the initial KYC upload in one transaction.
 */
export async function POST(request) {
  const rollback = createRollbackManager();
  const { users, databases } = createAdminClient();

  try {
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
    
    // Fallback URL pattern if `storage.getFileView` string generation is preferred:
    // `ENDPOINT/storage/buckets/BUCKET_ID/files/FILE_ID/view?project=PROJECT_ID`
    if (avvFile) {
      const { storage } = createAdminClient();
      const uploadedFile = await storage.createFile(
        AVV_BUCKET_id,
        ID.unique(),
        avvFile
      );
      avvLink = `${ENDPOINT}/storage/buckets/${AVV_BUCKET_id}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;
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
          message: error.message || "Registration failed. Please check your details and try again.",
          code: error.code || 500,
          type: error.type || "INTERNAL_ERROR"
        }
      },
      { status: error.code === 409 ? 409 : 500 },
    );
  }
}
