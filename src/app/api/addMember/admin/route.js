import { NextResponse } from "next/server";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE } from "@/lib/appwrite-server";
import { ID, Query } from "node-appwrite";

// Role mapping for different admin types
const ROLE_MAP = {
  coopadmin: "coopadmin",
  superuser: "superuser",
  orgAdmin: "org_admin",
  auditer: "auditer",
  auditerE: "aud_E",
  // auditerT: "aud_T",
};

// POST /api/addMember/admin - Create admin/superadmin/auditer users with placeholder profiles
export async function POST(request) {
  let createdUser = null;
  let profileDocumentId = ID.unique();

  try {
    const formData = await request.json();
    const { users, databases } = createAdminClient();

    // Validate role
    const role = ROLE_MAP[formData.role];
    if (!role) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid role specified" } },
        { status: 400 }
      );
    }

    // Step 1: Create the user account using Users API (server-side)
    createdUser = await users.create(
      ID.unique(),
      formData.email,
      undefined, // phone
      formData.password,
      `${formData.firstName} ${formData.lastName}`
    );

    // Step 2: Prepare placeholder profile data
    const profileData = {
      userId: createdUser.$id,
      salutation: formData.salutation || "",
      FirstName: formData.firstName,
      LastName: formData.lastName,
      title: formData.title || null,
      street: "Placeholder Street",
      houseNo: "123",
      add: null,
      postalCode: "000000",
      location: "Placeholder City",
      accountHolder: "Admin Account Holder",
      ibanNo: "de1234567890",
      taxId: null,
      bday: new Date(1990, 0, 1).toISOString(),
      contactEmail: formData.email,
      telephoneNo: null,
      howHeard: "FAF",
      exp: true,
      role: role,
      status: "active",
    };

    // Step 3: Create the profile document
    const profile = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      profileDocumentId,
      profileData
    );

    return NextResponse.json({
      success: true,
      userId: createdUser.$id,
      documentId: profile.$id,
    });
  } catch (error) {
    console.error("Admin Creation Error:", error);
    let errorMessage = "An unexpected error occurred during admin creation.";
    const errorCode = error.code || "UNKNOWN";
    const errorType = error.type || "UNKNOWN_TYPE";

    // Handle document conflict - verify if profile was actually created
    if (
      createdUser &&
      error.code === 409 &&
      (error.type === "document_already_exists" ||
        (error.message && error.message.toLowerCase().includes("document")))
    ) {
      try {
        const { databases } = createAdminClient();
        const existingProfiles = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_PROFILE,
          [Query.equal("userId", createdUser.$id)]
        );

        if (existingProfiles.documents.length > 0) {
          return NextResponse.json({
            success: true,
            userId: createdUser.$id,
            documentId: existingProfiles.documents[0].$id,
            info: "Admin profile found despite 409 conflict.",
          });
        }
        errorMessage = "Admin profile conflict, profile not found on verification.";
      } catch (verificationError) {
        errorMessage = `Admin profile conflict. Verification error: ${verificationError.message}`;
      }
    } else if (
      error.code === 409 &&
      (error.type === "user_already_exists" ||
        (error.message && error.message.toLowerCase().includes("user")))
    ) {
      errorMessage = "An admin account with this email already exists.";
    } else if (error.code === 401) {
      errorMessage = !createdUser
        ? "Authorization error during admin account creation."
        : "Authorization error during admin profile creation.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: errorMessage, code: errorCode, type: errorType },
      },
      { status: error.code === 409 ? 409 : 500 }
    );
  }
}
