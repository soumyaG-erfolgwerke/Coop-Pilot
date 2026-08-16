import { AuthorizationError } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export function requireMemberSelf(session, memberId) {
  if (session.role === "superuser" || session.userId === memberId) return session;
  throw new AuthorizationError();
}

export async function requireCooperativeAccess(session, coopId) {
  if (session.role === "superuser") return session;
  if (session.role === "coopadmin" && coopId) {
    await ensureCoopAdminAccess(coopId);
    return session;
  }
  throw new AuthorizationError();
}

export async function requireTransactionAccess(session, transaction) {
  if (session.role === "superuser") return session;
  const memberId = transaction?.memberId?.$id || transaction?.memberId;
  if (memberId && memberId === session.userId) return session;
  const coopId = transaction?.coopId?.$id || transaction?.coopId;
  return requireCooperativeAccess(session, coopId);
}
