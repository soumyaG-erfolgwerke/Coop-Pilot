import { Query } from "node-appwrite";
import { COLLECTION_ID_COOPXMEMBER, DATABASE_ID, createAdminClient } from "@/lib/appwrite-server";
import { AuthorizationError } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export function requireMemberIdentity(session, userId) {
  if (["superuser", "superadmin"].includes(session.role) || session.userId === userId) return session;
  throw new AuthorizationError();
}

export async function requireCoopAdministration(session, coopId) {
  if (["superuser", "superadmin"].includes(session.role)) return session;
  if (session.role === "coopadmin") {
    await ensureCoopAdminAccess(coopId);
    return session;
  }
  throw new AuthorizationError();
}

export async function requireCoopMembership(session, coopId, userId = session.userId) {
  if (["superuser", "superadmin"].includes(session.role)) return session;
  if (session.role === "coopadmin") {
    await ensureCoopAdminAccess(coopId);
    return session;
  }
  requireMemberIdentity(session, userId);
  const { databases } = createAdminClient();
  const memberships = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_COOPXMEMBER,
    [
      Query.equal("coopId", coopId), Query.equal("userId", userId),
      Query.equal("status", ["Active", "NoticeGiven"]), Query.limit(1),
    ],
  );
  if (memberships.total > 0) return session;
  throw new AuthorizationError();
}
