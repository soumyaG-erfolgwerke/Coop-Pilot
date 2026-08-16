import { Query } from "node-appwrite";
import {
  COLLECTION_ID_AUDIT_ORGS,
  COLLECTION_ID_COOPERATIVES,
  DATABASE_ID,
  createAdminClient,
} from "@/lib/appwrite-server";
import { AuthorizationError, requireRole, resolveSession } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export async function requireCoopAuditAccess(coopId, { allowCoopAdmin = true } = {}) {
  const session = await resolveSession();
  if (["superuser", "superadmin"].includes(session.role)) return session;
  if (allowCoopAdmin && session.role === "coopadmin") {
    await ensureCoopAdminAccess(coopId);
    return session;
  }
  const { databases } = createAdminClient();
  const coop = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID_COOPERATIVES,
    coopId,
  );
  const assignedOrgId = coop.auditOrgId?.$id || coop.auditOrgId;
  if (!assignedOrgId) throw new AuthorizationError();
  if (["auditer", "aud_E"].includes(session.role) && session.auditOrgId === assignedOrgId) {
    return session;
  }
  if (session.role === "org_admin") {
    const orgs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", session.email), Query.equal("$id", assignedOrgId), Query.limit(1)],
    );
    if (orgs.total > 0) return session;
  }
  throw new AuthorizationError();
}

export async function requireAuditOrgAccess(auditOrgId) {
  const session = await resolveSession();
  if (["superuser", "superadmin"].includes(session.role)) return session;
  if (["auditer", "aud_E", "aud_T"].includes(session.role) && session.auditOrgId === auditOrgId) {
    return session;
  }
  if (session.role === "org_admin") {
    const { databases } = createAdminClient();
    const orgs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_ORGS,
      [Query.equal("admin_email", session.email), Query.equal("$id", auditOrgId), Query.limit(1)],
    );
    if (orgs.total > 0) return session;
  }
  throw new AuthorizationError();
}

export async function requireAuditStaff() {
  return requireRole(await resolveSession(), [
    "superuser", "superadmin", "org_admin", "auditer", "aud_E", "aud_T",
  ]);
}

export async function requireAuditEditor(coopId) {
  const session = await requireCoopAuditAccess(coopId, { allowCoopAdmin: false });
  if (!["superuser", "superadmin", "org_admin", "auditer", "aud_E"].includes(session.role)) {
    throw new AuthorizationError();
  }
  return session;
}
