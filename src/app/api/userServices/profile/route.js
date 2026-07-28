import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
} from "@/lib/appwrite-server";
import { getKycStatus } from "@/lib/getKycStatus";
import { maskValue } from "@/helpers/maskValue";


// GET /api/userServices/profile
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const { account, databases } = createAdminClient();

    // Fetch profile
    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", userId)],
    );

    if (profilesResult.documents.length === 0) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    const doc = profilesResult.documents[0];
    // console.log(doc)
    let kycStatus = "UNKNOWN";
    try {
      kycStatus = await getKycStatus(userId);
    } catch (err) {
      console.error(`Error fetching KYC status for user ${userId}:`, err);
    }

    const dateOfBirth = doc.bday
      ? new Date(doc.bday).toISOString().split("T")[0]
      : null;

    const entryDate = doc.$createdAt
      ? new Date(doc.$createdAt).toISOString().split("T")[0]
      : null;

    return NextResponse.json({
      success: true,
      data: {
        userId: doc.userId,
        salutation: doc.salutation ?? "",
        title: doc.title ?? "",
        FirstName: doc.FirstName ?? "",
        LastName: doc.LastName ?? "",
        street: doc.street ?? "",
        houseNo: doc.houseNo ?? "",
        add: doc.add ?? "",
        postalCode: doc.postalCode ?? "",
        location: doc.location ?? "",
        email: doc.contactEmail || "",
        telephoneNo: doc.telephoneNo || "",
        dateOfBirth,
        memberNumber: doc.userId || null,
        entryDate,
        status: doc.status || "active",

        //new added
        howHeard: doc.howHeard || "",
        wantToBe: doc.wantToBe || "",
        role: doc.role || "",
        accountHolder: maskValue(doc.accountHolder),
        ibanNo: maskValue(doc.ibanNo),
        taxId: maskValue(doc.taxId),
        kycStatus: kycStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
