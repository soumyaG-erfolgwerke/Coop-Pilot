import { Query } from "node-appwrite";
import {
  AUDIT_BUCKET_ID,
  AVV_BUCKET_id,
  COLLECTION_ID_AUDIT_HISTORY,
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_COOP_DOCS,
  COLLECTION_ID_COOP_REPORTS,
  COLLECTION_ID_COOPXMEMBER,
  COLLECTION_ID_COOPERATIVES,
  COLLECTION_ID_DOCUMENTS,
  COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
  COLLECTION_ID_FOUNDING_AUDIT_MEMBERS,
  COLLECTION_ID_KYC_APPLICATIONS,
  COLLECTION_ID_KYC_DOCUMENTS,
  COLLECTION_ID_NIEDERSCHRIFT,
  COLLECTION_ID_ONBOARDINGLOGS,
  COLLECTION_ID_PROFILE,
  DATABASE_ID,
  FOUNDING_AUDIT_BUCKET_ID,
  REPORTS_BUCKET_ID,
  createAdminClient,
} from "@/lib/appwrite-server";
import { AuthorizationError } from "@/lib/auth/session";
import {
  requireCoopAdministration,
  requireCoopMembership,
  requireMemberIdentity,
} from "@/lib/auth/membership-access";
import { requireAuditOrgAccess, requireCoopAuditAccess } from "@/lib/auth/audit-access";

export const PRIVATE_FILE_BUCKETS = new Set([
  AUDIT_BUCKET_ID,
  AVV_BUCKET_id,
  REPORTS_BUCKET_ID,
  FOUNDING_AUDIT_BUCKET_ID,
]);

const platformRoles = new Set(["superuser", "superadmin"]);
const auditRoles = new Set(["org_admin", "auditer", "aud_E", "aud_T"]);

function referencesFile(document, fileId) {
  return Object.values(document || {}).some((value) => {
    if (typeof value === "string") return value.includes(fileId);
    if (Array.isArray(value)) return value.some((item) => String(item).includes(fileId));
    return false;
  });
}

async function scanReferences(collectionId, fileId, maxDocuments = 1000) {
  const { databases } = createAdminClient();
  const matches = [];
  for (let offset = 0; offset < maxDocuments; offset += 100) {
    const page = await databases.listDocuments(DATABASE_ID, collectionId, [
      Query.limit(100),
      Query.offset(offset),
    ]);
    matches.push(...page.documents.filter((document) => referencesFile(document, fileId)));
    if (page.documents.length < 100 || offset + 100 >= page.total) break;
  }
  return matches;
}

async function findByFileId(collectionId, fileId) {
  const { databases } = createAdminClient();
  try {
    const result = await databases.listDocuments(DATABASE_ID, collectionId, [
      Query.equal("fileId", fileId),
      Query.limit(10),
    ]);
    return result.documents;
  } catch {
    return scanReferences(collectionId, fileId);
  }
}

async function authorizeCoopReference(session, coopId, { administrationOnly = false } = {}) {
  if (!coopId) throw new AuthorizationError();
  if (auditRoles.has(session.role)) return requireCoopAuditAccess(coopId);
  if (administrationOnly) return requireCoopAdministration(session, coopId);
  return requireCoopMembership(session, coopId);
}

async function authorizeAuditBucket(session, fileId) {
  const cooperatives = await scanReferences(COLLECTION_ID_COOPERATIVES, fileId);
  for (const cooperative of cooperatives) {
    try {
      return await authorizeCoopReference(session, cooperative.$id);
    } catch {}
  }

  const auditOrganizations = await scanReferences(COLLECTION_ID_AUDIT_ORGS, fileId);
  for (const organization of auditOrganizations) {
    try {
      return await requireAuditOrgAccess(organization.$id);
    } catch {}
  }

  const documents = await findByFileId(COLLECTION_ID_DOCUMENTS, fileId);
  for (const document of documents) {
    if (document.userId === session.userId) return session;
    try {
      return await authorizeCoopReference(session, document.coopId);
    } catch {}
  }

  const legacyDocuments = await findByFileId(COLLECTION_ID_COOP_DOCS, fileId);
  for (const document of legacyDocuments) {
    try {
      return await authorizeCoopReference(session, document.coopId);
    } catch {}
  }

  const kycDocuments = await findByFileId(COLLECTION_ID_KYC_DOCUMENTS, fileId);
  for (const document of kycDocuments) {
    if (document.userId === session.userId) return session;
    if (session.role === "coopadmin" && document.kycApplicationId) {
      try {
        const { databases } = createAdminClient();
        const application = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_KYC_APPLICATIONS,
          document.kycApplicationId,
        );
        return await requireCoopAdministration(session, application.coopId);
      } catch {}
    }
  }

  const minutes = await findByFileId(COLLECTION_ID_NIEDERSCHRIFT, fileId);
  for (const document of minutes) {
    try {
      return await authorizeCoopReference(session, document.coopId);
    } catch {}
  }

  const auditReports = await scanReferences(COLLECTION_ID_AUDIT_HISTORY, fileId);
  for (const report of auditReports) {
    try {
      return await requireCoopAuditAccess(report.coopId);
    } catch {}
  }

  const onboardingFiles = await scanReferences(COLLECTION_ID_ONBOARDINGLOGS, fileId);
  for (const record of onboardingFiles) {
    try {
      return await authorizeCoopReference(session, record.coopId, { administrationOnly: true });
    } catch {}
  }

  throw new AuthorizationError();
}

async function authorizeAvvBucket(session, fileId) {
  const memberships = await scanReferences(COLLECTION_ID_COOPXMEMBER, fileId);
  for (const membership of memberships) {
    if (membership.userId === session.userId) return session;
    try {
      return await requireCoopAdministration(session, membership.coopId);
    } catch {}
  }

  const profiles = await scanReferences(COLLECTION_ID_PROFILE, fileId);
  for (const profile of profiles) {
    try {
      return requireMemberIdentity(session, profile.userId);
    } catch {}
  }
  throw new AuthorizationError();
}

async function authorizeReportsBucket(session, fileId) {
  const reports = await scanReferences(COLLECTION_ID_COOP_REPORTS, fileId);
  for (const report of reports) {
    try {
      return await authorizeCoopReference(session, report.coopId);
    } catch {}
  }
  throw new AuthorizationError();
}

async function authorizeFoundingAuditBucket(session, fileId) {
  const instances = await scanReferences(COLLECTION_ID_FOUNDING_AUDIT_INSTANCES, fileId);
  for (const instance of instances) {
    try {
      return await requireCoopAuditAccess(instance.coopId);
    } catch {}
  }

  const members = await scanReferences(COLLECTION_ID_FOUNDING_AUDIT_MEMBERS, fileId);
  if (members.length) {
    const { databases } = createAdminClient();
    for (const member of members) {
      try {
        const instance = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_ID_FOUNDING_AUDIT_INSTANCES,
          member.auditId,
        );
        return await requireCoopAuditAccess(instance.coopId);
      } catch {}
    }
  }
  throw new AuthorizationError();
}

export async function authorizeFileAccess(session, bucketId, fileId) {
  if (platformRoles.has(session.role)) return session;
  if (!PRIVATE_FILE_BUCKETS.has(bucketId)) throw new AuthorizationError();
  if (bucketId === AUDIT_BUCKET_ID) return authorizeAuditBucket(session, fileId);
  if (bucketId === AVV_BUCKET_id) return authorizeAvvBucket(session, fileId);
  if (bucketId === REPORTS_BUCKET_ID) return authorizeReportsBucket(session, fileId);
  if (bucketId === FOUNDING_AUDIT_BUCKET_ID) return authorizeFoundingAuditBucket(session, fileId);
  throw new AuthorizationError();
}

export async function isIntentionallyPublicFile(bucketId, fileId) {
  if (bucketId !== AUDIT_BUCKET_ID) return false;
  const { databases } = createAdminClient();
  const [cooperatives, auditOrganizations] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTION_ID_COOPERATIVES, [Query.limit(100)]),
    databases.listDocuments(DATABASE_ID, COLLECTION_ID_AUDIT_ORGS, [Query.limit(100)]),
  ]);
  if (
    cooperatives.documents.some((item) =>
      [item.logo, item.bannerUrl].some((value) => typeof value === "string" && value.includes(fileId)),
    )
  ) return true;
  return auditOrganizations.documents.some(
    (item) => typeof item.logo_url === "string" && item.logo_url.includes(fileId),
  );
}
