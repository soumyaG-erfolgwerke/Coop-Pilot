import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient, DATABASE_ID, COLLECTION_ID_PROFILE, COLLECTION_ID_KYC_DOCUMENTS, COLLECTION_ID_KYC_APPLICATIONS } from "@/lib/appwrite-server";
import { getKycStatus } from "@/lib/getKycStatus";
/**
 * Masks a string by replacing the middle part with '***'
 * @param {string} val The value to mask
 * @returns {string} The masked value
 */
const maskValue = (val) => {
  if (!val) return "";
  const str = String(val);
  if (str.length <= 4) {
    return str.length > 1
      ? str[0] + "***" + str[str.length - 1]
      : str + "***";
  }
  return str.substring(0, 2) + "***" + str.substring(str.length - 2);
};

// GET /api/userDetails/[userId] - Get full user details for KYC
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    let coopId = searchParams.get("coopId");
    if (coopId === "null" || coopId === "undefined" || !coopId) {
      coopId = null;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    // Query profile from database
    const profileResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId)]
    );

    if (profileResult.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: `User with ID ${userId} not found` },
        { status: 404 }
      );
    }

    const prf = profileResult.documents[0];
    let kycStatus = "UNKNOWN";
    try {
      kycStatus = await getKycStatus(userId, false, coopId);
    } catch (err) {
      console.error(`Error fetching KYC status for user ${userId}:`, err);
    }

    // Fetch the latest KYC document
    let kycDocument = null;
    try {
      const docResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_KYC_DOCUMENTS,
        [
          Query.equal("userId", userId),
          Query.orderDesc("uploadedAt"),
          Query.limit(1)
        ]
      );
      if (docResult.documents.length > 0) {
        kycDocument = docResult.documents[0];
      }
    } catch (err) {
      console.error(`Error fetching KYC document for user ${userId}:`, err);
    }

    // Map and mask the data as requested
    const fullUserDetails = {
      // Full details
      userId: prf.userId,
      salutation: prf.salutation,
      FirstName: prf.FirstName,
      LastName: prf.LastName,
      title: prf.title || null,
      bday: prf.bday,
      street: prf.street,
      houseNo: prf.houseNo,
      postalCode: prf.postalCode,
      location: prf.location,
      add: prf.add || null,
      contactEmail: prf.contactEmail,
      telephoneNo: prf.telephoneNo || null,
      howHeard: prf.howHeard || null,
      wantToBe: prf.wantToBe || null,
      role: prf.role,
      isVerified: prf.isVerified,

      // KYC History (Merged Applications and Documents)
      kycHistory: await (async () => {
        try {
          const [appsRes, docsRes] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTION_ID_KYC_APPLICATIONS, [
              Query.equal("userId", userId),
              Query.orderDesc("$createdAt")
            ]),
            databases.listDocuments(DATABASE_ID, COLLECTION_ID_KYC_DOCUMENTS, [
              Query.equal("userId", userId),
              Query.orderDesc("$createdAt")
            ])
          ]);

          // Filter apps by coopId if provided, to ensure we display the correct coop-specific attempts.
          // Fall back to legacy apps (which have no coopId).
          let apps = appsRes.documents;
          if (coopId) {
            apps = apps.filter(app => 
              (app.coopId === coopId || (app.coopId && app.coopId.$id === coopId)) ||
              (!app.coopId || (app.coopId && typeof app.coopId === 'object' && !app.coopId.$id))
            );
          }

          return apps.map((app, index) => {
            // 1. Precise Match: Find the document that belongs to THIS application via kycApplicationId
            let doc = docsRes.documents.find(d => d.kycApplicationId === app.$id);

            // 2. Smart Legacy Fallback: If no explicit ID link exists (for older records), 
            //    try to match based on chronology (e.g., latest app gets latest doc)
            if (!doc && docsRes.documents.length > 0) {
              // If there's only one of each, it's a safe match
              if (appsRes.documents.length === 1 && docsRes.documents.length === 1) {
                doc = docsRes.documents[0];
              }
              // Otherwise, we match by index as a best-effort fallback for legacy data
              else if (docsRes.documents[index]) {
                doc = docsRes.documents[index];
              }
            }

            return {
              applicationId: app.$id,
              status: app.kycStatus,
              submissionAttempt: app.submissionAttempt,
              reason: app.reason,
              reviewedAt: app.reviewedAt,
              createdAt: app.$createdAt,
              document: doc ? {
                $id: doc.$id,
                fileName: doc.fileName,
                fileUrl: doc.fileUrl,
                mimeType: doc.mimeType,
                fileSize: doc.fileSize,
                documentType: doc.documentType || null
              } : null
            };
          });
        } catch (err) {
          console.error("History fetch error:", err);
          return [];
        }
      })(),

      // Limited/User-friendly status
      status: prf.status === "active" ? "Active" : prf.status,

      // Computed kycStatus (from separate kycApplications table)
      kycStatus: kycStatus,

      // Masked details
      accountHolder: maskValue(prf.accountHolder),
      ibanNo: maskValue(prf.ibanNo),
      taxId: maskValue(prf.taxId),

      // Document details
      kycDocument: kycDocument ? {
        $id: kycDocument.$id,
        fileName: kycDocument.fileName,
        fileUrl: kycDocument.fileUrl,
        mimeType: kycDocument.mimeType,
        fileSize: kycDocument.fileSize,
        uploadedAt: kycDocument.uploadedAt
      } : null
    };

    return NextResponse.json({
      success: true,
      user: fullUserDetails
    });

  } catch (error) {
    console.error(`Error fetching full user details for ${params.userId}:`, error);
    return NextResponse.json(
      { success: false, error: "Could not fetch user details" },
      { status: 500 }
    );
  }
}
