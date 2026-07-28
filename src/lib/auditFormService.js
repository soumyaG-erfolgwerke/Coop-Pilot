import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_FORMS,
  COLLECTION_ID_CURRENT_AUDIT_FORM,
} from "@/lib/appwrite-server";
import { ID, Query } from "node-appwrite";

/**
 * Get the latest draft template by orgId and auditType.
 * @param {string} orgId
 * @param {string} auditType
 * @returns {Promise<object|null>}
 */
export async function getDraftForm(orgId, auditType) {
  const { databases } = createAdminClient();
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_AUDIT_FORMS,
    [
      Query.equal("auditOrgs", orgId),
      Query.equal("auditType", auditType.toLowerCase()),
      Query.equal("AuditStatus", "DRAFT"),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ],
  );
  return response.documents[0] || null;
}

/**
 * Create a new audit form draft in Appwrite.
 * @param {object} params
 * @param {string} params.auditOrgId
 * @param {string} params.auditType
 * @param {object} params.template
 * @param {string} params.version
 * @returns {Promise<object>}
 */
export async function createAuditForm({
  auditOrgId,
  auditType,
  template = {},
  version,
}) {
  const { databases } = createAdminClient();
  const currentYear = new Date().getFullYear().toString();
  const normalizedAuditType = auditType.toLowerCase();

  const auditForm = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID_AUDIT_FORMS,
    ID.unique(),
    {
      auditType: normalizedAuditType,
      auditOrgs: auditOrgId,
      version: version || `${currentYear}.0`,
      template: JSON.stringify(template),
      AuditStatus: "DRAFT",
    },
  );
  return auditForm;
}

/**
 * Fetch an audit form by its document ID.
 * @param {string} formId
 * @returns {Promise<object>}
 */
export async function getAuditFormById(formId) {
  const { databases } = createAdminClient();
  const auditForm = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID_AUDIT_FORMS,
    formId,
  );
  return auditForm;
}

/**
 * Update an audit form's template, version, and status.
 * Also handles updating/creating current version mapping on Completed status.
 * @param {string} formId
 * @param {object} updates
 * @param {object} [updates.template]
 * @param {string} [updates.version]
 * @param {string} [updates.status]
 * @returns {Promise<object>}
 */
export async function updateAuditForm(
  formId,
  { template, version, status, macros },
) {
  const { databases } = createAdminClient();

  const updatePayload = {};
  if (template) {
    updatePayload.template =
      typeof template === "string" ? template : JSON.stringify(template);
  }
  if (version) {
    updatePayload.version = version;
  }
  if (status) {
    updatePayload.AuditStatus = status.toUpperCase();
  }
  if (macros !== undefined) {
    updatePayload.macros = macros;
  }

  const auditForm = await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID_AUDIT_FORMS,
    formId,
    updatePayload,
  );

  // If status is updated to Completed, update or create CurrentAuditForm for version control
  if (status === "Completed") {
    const orgId = auditForm.auditOrgs?.$id || auditForm.auditOrgs;
    const auditType = auditForm.auditType?.toLowerCase();
    const currentVersion = version || auditForm.version;

    if (orgId && auditType) {
      const currentFormsList = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_CURRENT_AUDIT_FORM,
        [Query.equal("orgId", orgId), Query.equal("auditType", auditType)],
      );

      if (currentFormsList.documents.length > 0) {
        const currentFormDoc = currentFormsList.documents[0];
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_CURRENT_AUDIT_FORM,
          currentFormDoc.$id,
          {
            version: currentVersion,
            auditForms: formId,
          },
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID_CURRENT_AUDIT_FORM,
          ID.unique(),
          {
            orgId,
            version: currentVersion,
            auditType,
            auditForms: formId,
          },
        );
      }
    }
  }

  return auditForm;
}

/**
 * Fetch the latest active (non-discarded) audit form by orgId and auditType.
 * @param {string} orgId
 * @param {string} auditType
 * @returns {Promise<object|null>}
 */
export async function getLatestAuditForm(orgId, auditType) {
  const { databases } = createAdminClient();
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_AUDIT_FORMS,
    [
      Query.equal("auditOrgs", orgId),
      Query.equal("auditType", auditType.toLowerCase()),
      Query.notEqual("AuditStatus", "Discarded"),
      Query.orderDesc("version"),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ],
  );
  return response.documents[0] || null;
}

/**
 * List all audit forms for a given organization ID.
 * @param {string} orgId
 * @returns {Promise<{total: number, documents: object[]}>}
 */
export async function listAuditForms(orgId) {
  const { databases } = createAdminClient();
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_AUDIT_FORMS,
    [
      Query.equal("auditOrgs", orgId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
  );
  return {
    total: response.total,
    documents: response.documents,
  };
}
