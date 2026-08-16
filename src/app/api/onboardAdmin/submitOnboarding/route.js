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
import { resolveSession, sessionErrorResponse, AuthorizationError } from "@/lib/auth/session";
import { verifyOnboardingInviteToken } from "@/lib/auth/onboarding-invite";
import { createRollbackManager } from "@/lib/rollbackService";

export const POST = async (request) => {
  const rollback = createRollbackManager();
  try {
    const { formData, coopId, inviteToken } = await request.json();
    const { databases, users } = createAdminClient();
    if (!formData || typeof coopId !== "string" || !coopId || coopId.length > 100) {
      return NextResponse.json({ error: "Invalid onboarding request" }, { status: 400 });
    }
    const email = typeof formData.email === "string" ? formData.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid onboarding request" }, { status: 400 });
    }

    let session = null;
    try { session = await resolveSession({ requireProfile: false }); } catch {}
    const sessionMatches = session?.email?.toLowerCase() === email;
    const signedInvite = verifyOnboardingInviteToken(inviteToken);
    const tokenMatches = signedInvite?.email === email && signedInvite?.coopId === coopId;
    if (!sessionMatches && !tokenMatches) throw new AuthorizationError();

    const inviteResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ONBOARDINGLOGS,
      [
        Query.equal("inviteEmail", email), Query.equal("coopId", coopId),
        Query.equal("for", "coopadmin"), Query.equal("type", "SOLO"),
        Query.equal("onboarded", false), Query.limit(10),
      ],
    );
    const inviteRecord = tokenMatches
      ? inviteResult.documents.find((item) => item.$id === signedInvite.inviteId)
      : inviteResult.documents[0];
    if (!inviteRecord) throw new AuthorizationError();

    const profiles = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("contactEmail", email), Query.limit(1)],
    );
    const existingProfile = profiles.documents[0] || null;

    if (!existingProfile) {
      const captchaToken = formData.captchaToken;
      if (process.env.NODE_ENV === "production" && (!captchaToken || !(await verifyCaptcha(captchaToken)))) {
        return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
      }
      if (
        typeof formData.password !== "string" || formData.password.length < 12 || formData.password.length > 128 ||
        typeof formData.fullLegalFirstMiddleName !== "string" || !formData.fullLegalFirstMiddleName.trim() ||
        typeof formData.fullLegalLastName !== "string" || !formData.fullLegalLastName.trim()
      ) {
        return NextResponse.json({ error: "Invalid account details" }, { status: 400 });
      }
      // Branch A: New Coopadmin
      // 1. Create Auth User
      let userId;
      if (sessionMatches) {
        userId = session.userId;
      } else try {
        const user = await users.create(
          ID.unique(),
          email,
          formData.phoneCountryCode + formData.phoneNumber,
          formData.password,
          formData.fullLegalFirstMiddleName + " " + formData.fullLegalLastName,
        );
        userId = user.$id;
        rollback.add(() => users.delete(userId));
      } catch (err) {
        if (err.code === 409) return NextResponse.json(
          { error: "This account already exists. Sign in before accepting the invitation." },
          { status: 409 },
        );
        throw err;
      }

      // 2. Create Profile
      const profile = await databases.createDocument(
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
          isVerified: true,
          howHeard: "N/A",
          exp: true,
        },
      );
      rollback.add(() => databases.deleteDocument(DATABASE_ID, COLLECTION_ID_PROFILE, profile.$id));
    } else if (
      existingProfile.role !== "coopadmin" ||
      existingProfile.status !== "active" ||
      existingProfile.isVerified !== true
    ) {
      const priorState = {
        role: existingProfile.role || "member",
        status: existingProfile.status || "active",
        isVerified: existingProfile.isVerified === true,
      };
      await databases.updateDocument(
        DATABASE_ID, COLLECTION_ID_PROFILE, existingProfile.$id,
        { role: "coopadmin", status: "active", isVerified: true },
      );
      rollback.add(() => databases.updateDocument(
        DATABASE_ID, COLLECTION_ID_PROFILE, existingProfile.$id, priorState,
      ));
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
          rollback.add(() => databases.updateDocument(
            DATABASE_ID, COLLECTION_ID_COOPERATIVES, coopId, { admins: currentAdmins },
          ));
        }
      } catch (e) { throw e; }
    }

    // Update onboarding logs
    if (coopId) {
      try {
        await databases.updateDocument(
          DATABASE_ID, COLLECTION_ID_ONBOARDINGLOGS, inviteRecord.$id, { onboarded: true },
        );
      } catch (e) { throw e; }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    await rollback.execute();
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    console.error("Error submitting onboarding:", error);
    return NextResponse.json(
      { error: "Onboarding could not be completed" },
      { status: 500 },
    );
  }
};
