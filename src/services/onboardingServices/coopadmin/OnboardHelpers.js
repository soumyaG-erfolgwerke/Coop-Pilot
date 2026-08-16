import {
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_ONBOARDINGLOGS,
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { getAuthenticatedProfile, getCoopById } from "@/lib/helpers/_helpers";
import { sendInviteEmail } from "@/utils/inviteMailer";
import { ID, Query } from "node-appwrite";
import { createOnboardingInviteToken } from "@/lib/auth/onboarding-invite";

const { databases } = createAdminClient();

export const checkAdminProfileByEmail = async (email) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("contactEmail", email), Query.limit(1)],
    );
    // console.log("admin profile:", res);
    const data = res.documents[0];
    return data ? true : false;
  } catch (error) {
    console.error("Error checking admin profile:", error);
    throw error;
  }
};

export const deSerializeInviteData = async (formData) => {
  const hasAdminProfile = await checkAdminProfileByEmail(formData.email);
  const auth = await getAuthenticatedProfile();
  if (!auth.email) {
    throw new Error("Authenticated user email not found");
  }
  return {
    coopId: formData.coopId,
    type: "SOLO",
    for: "coopadmin",
    inviteEmail: formData.email,
    inviteFullName: formData.fullName,
    hasProfile: hasAdminProfile,
    onboarded: false,
    onboardedBy: auth.email,
  };
};

export const sendAdminInvitation = async (inviteData) => {
  try {
    const res = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_ONBOARDINGLOGS,
      ID.unique(),
      inviteData,
    );

    // const res = {
    //   id: ID.unique(),
    //   coopId: inviteData.coopId,
    //   type: inviteData.type,
    //   for: inviteData.for,
    //   inviteEmail: inviteData.inviteEmail,
    //   inviteFullName: inviteData.inviteFullName,
    //   hasProfile: inviteData.hasProfile,
    //   onboarded: inviteData.onboarded,
    //   onboardedBy: inviteData.onboardedBy,
    // };

    const coopData = await getCoopById(inviteData.coopId);
    const token = createOnboardingInviteToken({
      inviteId: res.$id,
      email: inviteData.inviteEmail,
      coopId: inviteData.coopId,
    });
    const baseUrl = (process.env.DEPLOYMENT_URL || "https://monujesh-cooppilot.coopos.cloud").replace(/\/$/, "");
    const inviteLink = `${baseUrl}/assistance-onboard?email=${encodeURIComponent(inviteData.inviteEmail)}&token=${encodeURIComponent(token)}`;

    if (res) {
      try {
        const emailRes = await sendInviteEmail(
          inviteData.inviteEmail,
          coopData.name,
          inviteLink,
          "Easy Coop",
          inviteData.inviteFullName,
          coopData.RegNumber,
        );
        // console.log("Email res", emailRes);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        const deleteInvite = await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID_ONBOARDINGLOGS,
          res.$id,
        );
        // console.log("Delete invite", deleteInvite);
      }
    }

    return res;
  } catch (error) {
    console.error("Error sending invitation:", error);
    throw error;
  }
};

export const checkAlreadyOnboarded = async (email, coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ONBOARDINGLOGS,
      [
        Query.equal("inviteEmail", email),
        Query.equal("coopId", coopId),
        Query.equal("onboarded", false),
      ],
    );
    // console.log("Onboarding check result:", res);
    return res.total > 0;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw error;
  }
};

export const getCoopsByAdminEmail = async (email) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ONBOARDINGLOGS,
      [
        Query.equal("inviteEmail", email),
        Query.equal("for", "coopadmin"),
        Query.equal("type", "SOLO"),
        Query.equal("onboarded", false),
      ],
    );
    const coopIds = res.documents.map((doc) => doc.coopId);
    const inviteFullName = res.documents[0]?.inviteFullName || "";
    // console.log("Coops for admin email:", coopIds);
    return { coopIds, inviteFullName };
  } catch (error) {
    console.error("Error fetching coops by admin email:", error);
    throw error;
  }
};

export const getAllCoopsDataById = async (coopId) => {
  try {
    const coopsData = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );
    return coopsData;
  } catch (error) {
    console.error("Error fetching coop data by ID:", error);
    throw error;
  }
};

export const getInviteHistoryByCoopId = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ONBOARDINGLOGS,
      [Query.equal("coopId", coopId), Query.equal("for", "coopadmin")],
    );
    return res.documents;
  } catch (error) {
    console.error("Error fetching invite history:", error);
    throw error;
  }
};
