import { AuthorizationError } from "@/lib/auth/session";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export async function requireStripeCoopAccess(session, coopId) {
  if (session?.role === "superadmin" || session?.role === "superuser") return session;
  if (session?.role === "coopadmin") {
    try {
      await ensureCoopAdminAccess(coopId);
      return session;
    } catch (error) {
      if (error?.code === 404 || error?.code === 400 || error?.message === "FORBIDDEN") {
        throw new AuthorizationError();
      }
      throw error;
    }
  }
  throw new AuthorizationError();
}
