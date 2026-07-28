import {
  COLLECTION_ID_ASSEMBLIES,
  COLLECTION_ID_COOP_CONFIG,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_COOPXMEMBER,
  COLLECTION_ID_DOCUMENTS,
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { normalizeAssemblyStatus } from "@/lib/helpers/_auxilaryHelpers";
import { Query } from "node-appwrite";

const { databases } = createAdminClient();

export const checkSatzungExistsForCoop = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      [
        Query.equal("coopId", coopId),
        Query.equal("category", "SATZUNG"),
        Query.equal("isCurrent", true),
        Query.limit(100),
      ],
    );

    if (res.status === 200 || res.total > 0) {
      return true; // Satzung exists
    }

    return false; // No satzung found
  } catch (error) {
    if (error.code === 404) {
      return false; // No satzung found
    }

    console.error("Error fetching satzung document:", error);
    return false; // Return false if there's an error fetching the document
  }
};

export const checkActiveMemberForCoop = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [
        Query.equal("coopId", coopId),
        Query.equal("status", "Active"),
        Query.limit(1),
      ],
    );

    return res.total > 0;
  } catch (error) {
    if (error.code === 404) {
      return false;
    }

    console.error("Error fetching active member document:", error);
    return false;
  }
};

export const checkSharePriceForCoop = async (coopId) => {
  try {
    const res = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    return !!res.sharePrice;
  } catch (error) {
    if (error.code === 404) {
      return false;
    }

    console.error("Error fetching share price:", error);
    return false;
  }
};

export const checkFinancialYearForCoop = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOP_CONFIG,
      [Query.equal("cooperative_id", coopId), Query.limit(1)],
    );

    return (
      !!res.documents[0]?.fiscal_year_start &&
      !!res.documents[0]?.fiscal_year_end
    );
  } catch (error) {
    if (error.code === 404) {
      return false;
    }

    console.error("Error fetching financial year:", error);
    return false;
  }
};

export const checkOldApplicationForCoop = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [
        Query.equal("coopId", coopId),
        Query.equal("status", "Pending"),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
    );

    const application = res.documents[0];

    if (!application) {
      return true; // No pending application found, so this check is passed
    }

    if (
      Date.parse(application.$createdAt) <
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ) {
      return false; // Old application found that is older than 30 days, so this check fails
    }

    return true; // No old application found, so this check is passed
  } catch (error) {
    if (error.code === 404) {
      return false;
    }

    console.error("Error fetching old application:", error);
    return false;
  }
};

export const checkOneAdminConfiguredForCoop = async (coopId) => {
  try {
    const adminData = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
    );

    const admins = adminData?.admins || [];

    if (admins.length === 0) {
      return false; // No admin configured
    }

    const queries = [Query.equal("isVerified", true)];

    if (admins?.length) {
      queries.push(Query.equal("contactEmail", admins));
    }

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      queries,
    );

    return res.total > 0;
  } catch (error) {
    if (error.code === 404) {
      return false;
    }
    console.error("Error fetching admin config:", error);
    return false;
  }
};

export const updateComplianceChecking = async (coopId) => {
  try {
    const complianceChecks = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_COOPERATIVES,
      coopId,
      {
        complianceCheckedAt: new Date(),
      },
    );
    
    return complianceChecks.complianceCheckedAt || null;
  } catch (error) {
    console.error("Error updating compliance checking:", error);
    return {
      success: false,
      message: "Error updating compliance checking",
    };
  }
};

export const getAssemblyCountForCoop = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ASSEMBLIES,
      [Query.equal("coopId", coopId)],
    );

    // console.log("response:", res);
    const assemblies = res.documents.map((doc) => normalizeAssemblyStatus(doc));

    // console.log("assemblies:", assemblies);

    const upcomingAssemblyCount = assemblies.filter(
      (status) => status === "upcoming",
    ).length;

    return { upcomingAssemblyCount, totalAssemblyCount: res.total };
    // return res.total;
  } catch (error) {
    console.error("Error fetching assembly count:", error);
    return { upcomingAssemblyCount: 0, totalAssemblyCount: 0 };
  }
};

export const getDocsCountForCoop = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_DOCUMENTS,
      [Query.equal("coopId", coopId), Query.equal("visibleToMembers", true)],
    );
    return res.total;
  } catch (error) {
    console.error("Error fetching documents count:", error);
    return 0;
  }
};

export const getGovernanceCountForCoop = async (coopId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_COOPXMEMBER,
      [Query.equal("coopId", coopId)],
    );

    return { totalGovernanceCount: res.total };
  } catch (error) {
    console.error("Error fetching governance count:", error);
    return { totalGovernanceCount: 0 };
  }
};
