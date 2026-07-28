import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
} from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

// ensureAuditAccess: This function is used to check if a user has access to a cooperative for audit purposes.
export const ensureAuditAccess = async (auditId) => {
  try {
    const auth = await getAuthenticatedProfile();
    if (!auth) {
      return {
        isAllowed: false,
        error: "You are not logged in",
      };
    }

    if (auth.role === "superuser") {
      return {
        isAllowed: true,
        auth,
      };
    }

    const { databases } = createAdminClient();
    const audit = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_HISTORY,
      auditId,
    );

    if (!audit) {
      return {
        isAllowed: false,
        error: "Audit not found",
      };
    }

    if (auth.role === "org_admin") {
      const auditOrg = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID_AUDIT_ORGS,
        audit.auditOrgId,
      );
      if (auditOrg && auditOrg.admin_email === auth.email) {
        return {
          isAllowed: true,
          auth,
          audit,
        };
      }
    } else if (
      auth.role === "auditer" ||
      auth.role === "aud_E" ||
      auth.role === "aud_T"
    ) {
      const auditorResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_AUDITTEAM_MEMBERS,
        [
          Query.equal("email", auth.email),
          Query.equal("auditOrgId", audit.auditOrgId),
        ],
      );
      if (auditorResponse.documents.length > 0) {
        return {
          isAllowed: true,
          auth,
          audit,
        };
      }
    }

    return {
      isAllowed: false,
      error: "Forbidden",
    };
  } catch (error) {
    return {
      isAllowed: false,
      error: error.message || "Access verification failed",
    };
  }
};

export const ensureAuditerAccess = async () => {
  try {
    const auth = await getAuthenticatedProfile();
    if (!auth) {
      return {
        isAllowed: false,
        error: "You are not logged in",
      };
    }

    if (
      auth.role === "superuser" ||
      auth.role === "org_admin" ||
      auth.role === "auditer"
    ) {
      return {
        isAllowed: true,
        auth,
      };
    }

    return {
      isAllowed: false,
      error: "Forbidden",
    };
  } catch (error) {
    return {
      isAllowed: false,
      error: error.message || "Access verification failed",
    };
  }
};
