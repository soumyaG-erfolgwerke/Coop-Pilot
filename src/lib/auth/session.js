import { cookies } from "next/headers";
import { Query } from "node-appwrite";
import {
  appwriteFetchWithSession,
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_AUDITTEAM_MEMBERS,
  COLLECTION_ID_PROFILE,
} from "@/lib/appwrite-server";

export const SESSION_COOKIE_NAME = "appwrite-session";

export class AuthenticationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
    this.status = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
    this.status = 403;
  }
}

export function readSessionSecret(rawCookieValue) {
  if (!rawCookieValue || typeof rawCookieValue !== "string") return null;

  // The preferred cookie is JSON containing only the opaque Appwrite secret.
  // Raw values and legacy JSON are accepted temporarily during session rollout,
  // but legacy identity/role fields are deliberately ignored.
  try {
    const parsed = JSON.parse(rawCookieValue);
    return parsed?.cookieValue || parsed?.secret || null;
  } catch {
    return rawCookieValue;
  }
}

export async function getSessionSecret() {
  const cookieStore = await cookies();
  return readSessionSecret(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

async function loadApplicationProfile(account, labels) {
  const { databases } = createAdminClient();
  const isTeamMember = labels.includes("teamMember");

  if (isTeamMember) {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITTEAM_MEMBERS,
      [Query.equal("email", account.email), Query.limit(1)],
    );
    const profile = result.documents[0] || null;
    if (!profile) return { profile: null, role: null, isTeamMember: true };
    if (profile.isActive === false) {
      throw new AuthorizationError("Account is inactive");
    }
    return {
      profile,
      role: profile.role || null,
      isTeamMember: true,
      auditOrgId: profile.auditOrgId || null,
      teamMemberId: profile.$id,
    };
  }

  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_PROFILE,
    [Query.equal("userId", account.$id), Query.limit(1)],
  );
  const profile = result.documents[0] || null;
  return {
    profile,
    role: profile?.role || null,
    isTeamMember: false,
    coopId: profile?.coopId || profile?.cooperativeId || null,
  };
}

export async function resolveSession({ requireProfile = true } = {}) {
  const secret = await getSessionSecret();
  if (!secret) throw new AuthenticationError();

  let response;
  try {
    response = await appwriteFetchWithSession(secret, "/account", {
      cache: "no-store",
    });
  } catch {
    throw new AuthenticationError();
  }

  if (!response.ok) throw new AuthenticationError();
  const account = await response.json();
  if (!account?.$id) throw new AuthenticationError();

  const labels = Array.isArray(account.labels) ? account.labels : [];
  const application = await loadApplicationProfile(account, labels);
  if (requireProfile && !application.profile) {
    throw new AuthorizationError("Application profile is unavailable");
  }

  return {
    secret,
    userId: account.$id,
    email: account.email || null,
    labels,
    account,
    ...application,
  };
}

export function requireRole(session, allowedRoles) {
  const allowed = new Set(Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]);
  // A newly registered cooperative administrator receives its role before the
  // verification workflow completes. Never let that provisional role authorize
  // privileged APIs; verification endpoints deliberately use resolveSession()
  // directly and remain available to the account owner.
  if (session?.profile?.isVerified === false) {
    throw new AuthorizationError("Account verification is incomplete");
  }
  if (!session?.role || !allowed.has(session.role)) {
    throw new AuthorizationError();
  }
  return session;
}

export function sessionErrorResponse(error) {
  const status = error?.status === 403 ? 403 : 401;
  return Response.json(
    { success: false, error: status === 403 ? "Forbidden" : "Unauthorized" },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
