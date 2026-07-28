import { ID } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDIT_ORG_LOGS,
} from "@/lib/appwrite-server";

export async function createAuditLog({
  auditOrgId,
  logNote,
  role,
}) {
  if (!auditOrgId || !logNote || !role) {
    throw new Error("auditOrgId, logNote, and role are required");
  }

  const { databases } = createAdminClient();

  return await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID_AUDIT_ORG_LOGS,
    ID.unique(),
    {
      auditOrgId,
      logNote,
      for: role,
    }
  );
}