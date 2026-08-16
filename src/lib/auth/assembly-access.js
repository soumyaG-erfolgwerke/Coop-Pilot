import {
  COLLECTION_ID_ASSEMBLIES,
  DATABASE_ID,
  createAdminClient,
} from "@/lib/appwrite-server";
import { requireRole, resolveSession } from "@/lib/auth/session";
import { requireCooperativeAccess } from "@/lib/auth/transaction-access";

export async function requireAssemblyAdmin(assemblyId) {
  const session = requireRole(await resolveSession(), ["superuser", "coopadmin"]);
  const { databases } = createAdminClient();
  const assembly = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID_ASSEMBLIES,
    assemblyId,
  );
  await requireCooperativeAccess(session, assembly.coopId);
  return { session, assembly };
}
