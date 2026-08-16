import { AuthorizationError } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export async function requireTicketAccess(session, ticket) {
  if (session.role === "superuser") return session;

  if (session.role === "coopadmin") {
    const coopId = ticket?.forCoop?.$id || ticket?.forCoop;
    if (!coopId) throw new AuthorizationError();
    await ensureCoopAdminAccess(coopId);
    return session;
  }

  if (["auditer", "aud_E"].includes(session.role)) {
    const leadAuditor = ticket?.leadAuditor?.$id || ticket?.leadAuditor;
    if (leadAuditor && leadAuditor === session.teamMemberId) return session;
  }

  throw new AuthorizationError();
}
