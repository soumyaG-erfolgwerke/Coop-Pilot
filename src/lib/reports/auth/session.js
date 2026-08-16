/**
 **[HELPER] Functions to manage user sessions and resolve user info based on Appwrite sessions. It includes:
 * - `getSession`: Retrieves and parses the Appwrite session from cookies.
 * - `resolveUser`: Fetches user account information from Appwrite using the session data.
 * Used in the Share Register Report API route.
 */

import { getSessionSecret } from "@/lib/auth/session";
import { appwriteFetchWithSession } from "@/lib/appwrite-server";

const getSession = async () => {
  const cookieValue = await getSessionSecret();
  return cookieValue ? { cookieValue } : null;
};

const resolveUser = async (session) => {
  if (!session?.cookieValue && !session?.secret) return null;

  try {
    const res = await appwriteFetchWithSession(
      session.cookieValue || session.secret,
      "/account",
    );

    if (!res.ok) return null;

    const account = await res.json();

    return {
      userId: account?.$id || null,
      email: account?.email || null,
      name: account?.name || null,
    };
  } catch {
    return null;
  }
};

export { getSession, resolveUser };
