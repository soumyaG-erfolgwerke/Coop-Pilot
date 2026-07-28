import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import {
  DATABASE_ID,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_ONBOARDINGLOGS,
  createAdminClient,
} from "@/lib/appwrite-server";
import { verifyCaptcha } from "@/lib/helpers/captchaHelper";

export const POST = async (request) => {
  try {
    const { formData, isExistingCoopAdmin, coopId } = await request.json();
    const { databases, users } = createAdminClient();

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

    const email = formData.email;

    if (!isExistingCoopAdmin) {
      // Branch A: New Coopadmin
      // 1. Create Auth User
      let userId;
      try {
        const user = await users.create(
          ID.unique(),
          email,
          formData.phoneCountryCode + formData.phoneNumber,
          formData.password,
          formData.fullLegalFirstMiddleName + " " + formData.fullLegalLastName,
        );
        userId = user.$id;
      } catch (err) {
        // If user already exists in auth but no profile
        if (err.code === 409) {
          const userList = await users.list([Query.equal("email", email)]);
          if (userList.users.length > 0) {
            userId = userList.users[0].$id;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // 2. Create Profile
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_PROFILE,
        ID.unique(),
        {
          userId: userId,
          contactEmail: email,
          FirstName: formData.fullLegalFirstMiddleName || "",
          LastName: formData.fullLegalLastName || "",
          telephoneNo: formData.phoneCountryCode + formData.phoneNumber,
          bday: formData.dateOfBirth
            ? new Date(formData.dateOfBirth).toISOString()
            : "",
          street: formData.address?.street || "",
          houseNo: formData.address?.houseNo || "",
          postalCode: formData.address?.postalCode || "",
          location: formData.address?.city || "",
          accountHolder: formData.bankName || "",
          ibanNo: formData.iban || "",
          bic: formData.bic || "",
          role: "coopadmin",
          status: "active",
          howHeard: "N/A",
          exp: true,
        },
      );
    }

    // Branch A & B: Update Cooperative and Onboarding Logs

    // Update cooperative admins
    if (coopId) {
      try {
        const coopDoc = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_COOPERATIVES,
          coopId,
        );

        const currentAdmins = coopDoc.admins || [];
        if (!currentAdmins.includes(email)) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_COOPERATIVES,
            coopId,
            {
              admins: [...currentAdmins, email],
            },
          );
        }
      } catch (e) {
        console.error("Failed to update cooperative admins:", e);
      }
    }

    // Update onboarding logs
    if (coopId) {
      try {
        const logsList = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_ONBOARDINGLOGS,
          [
            Query.equal("inviteEmail", email),
            Query.equal("coopId", coopId),
            Query.equal("for", "coopadmin"),
            Query.equal("type", "SOLO"),
          ],
        );

        if (logsList.documents.length > 0) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_ID_ONBOARDINGLOGS,
            logsList.documents[0].$id,
            {
              onboarded: true,
            },
          );
        }
      } catch (e) {
        console.error("Failed to update onboarding log:", e);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error submitting onboarding:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
};
