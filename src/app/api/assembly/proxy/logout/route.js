import { cookies } from "next/headers";

import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  COLLECTION_ID_ASSEMBLY_ATTENDANCE,
  DATABASE_ID,
  createAdminClient,
} from "@/lib/appwrite-server";

// logout proxy
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("proxy-session")?.value;
    if (token) {
      const { databases } = createAdminClient();
      const sessions = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_ASSEMBLY_ATTENDANCE,
        [Query.equal("proxySessionToken", token), Query.limit(1)],
      );
      if (sessions.documents[0]) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID_ASSEMBLY_ATTENDANCE,
          sessions.documents[0].$id,
          {
            proxyLoggedIn: false,
            proxySessionToken: "",
            proxyIpAddress: "",
          },
        );
      }
    }
    cookieStore.delete("proxy-session");

    return NextResponse.json({
      success: true,

      message: "Proxy logged out successfully",
    });
  } catch (error) {
    console.error("PROXY_LOGOUT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,

        error: "Logout failed",
      },
      {
        status: 500,
      },
    );
  }
}
