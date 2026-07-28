/**
 **[HELPER] Functions to manage user sessions and resolve user info based on Appwrite sessions. It includes:
 * - `getSession`: Retrieves and parses the Appwrite session from cookies.
 * - `resolveUser`: Fetches user account information from Appwrite using the session data.
 * Used in the Share Register Report API route.
 */

import { cookies } from "next/headers";
import { appwriteFetchWithSession } from "@/lib/appwrite-server";

const getSession = async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("appwrite-session")?.value;

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    cookieStore.delete("appwrite-session");
    return null;
  }
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
      userId: session.userId,
      email: account?.email || null,
      name: account?.name || null,
    };
  } catch {
    return null;
  }
};

export { getSession, resolveUser };