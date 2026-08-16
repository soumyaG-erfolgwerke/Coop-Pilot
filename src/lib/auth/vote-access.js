import { Query } from "node-appwrite";
import { cookies, headers } from "next/headers";
import { AuthenticationError, AuthorizationError, resolveSession } from "@/lib/auth/session";
import {
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
  COLLECTION_ID_ASSEMBLY_PROXIES,
  COLLECTION_ID_COOPXMEMBER,
  DATABASE_ID,
  createAdminClient,
} from "@/lib/appwrite-server";
import { ensureCoopAdminAccess } from "@/lib/helpers/_helpers";

export async function requireCoopParticipant(session, coopId) {
  if (session.role === "superuser") return session;
  if (session.role === "coopadmin") {
    await ensureCoopAdminAccess(coopId);
    return session;
  }
  if (!["member", "proxy"].includes(session.role)) throw new AuthorizationError();
  const { databases } = createAdminClient();
  const memberships = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_COOPXMEMBER,
    [
      Query.equal("userId", session.userId),
      Query.equal("coopId", coopId),
      Query.equal("status", ["active", "noticegiven"]),
      Query.limit(1),
    ],
  );
  if (memberships.total < 1) throw new AuthorizationError();
  return session;
}

export async function resolveVotingActor() {
  try {
    return await resolveSession();
  } catch (error) {
    if (error?.status !== 401) throw error;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("proxy-session")?.value;
  if (!token) throw new AuthenticationError();
  const { databases } = createAdminClient();
  const attendanceResult = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_ASSEMBLY_ATTENDANCE,
    [
      Query.equal("proxySessionToken", token),
      Query.equal("proxyLoggedIn", true),
      Query.limit(1),
    ],
  );
  const attendance = attendanceResult.documents[0];
  if (!attendance) throw new AuthenticationError();

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const rawIp = forwarded?.split(",")[0]?.trim() || "unknown";
  const ip = rawIp === "::1" ? "127.0.0.1" : rawIp;
  if (attendance.proxyIpAddress !== ip) throw new AuthorizationError();

  const proxy = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID_ASSEMBLY_PROXIES,
    attendance.proxyTableId,
  );
  if (!proxy || !proxy.ownerUserId || proxy.status === "revoked") {
    throw new AuthenticationError();
  }
  return {
    role: "proxy",
    userId: proxy.ownerUserId,
    proxyAssemblyId: proxy.assemblyId,
    proxyTableId: proxy.$id,
  };
}
