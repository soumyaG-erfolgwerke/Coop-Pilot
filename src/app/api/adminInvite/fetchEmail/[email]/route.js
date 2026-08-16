import {
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { resolveSession, requireRole, sessionErrorResponse } from "@/lib/auth/session";

const { databases } = createAdminClient();

export const GET = async (request, { params }) => {
  const { email } = await params;
  // console.log("Received GET request for email:", email);
  
  try {
    const session = await resolveSession();
    requireRole(session, ["coopadmin", "superuser", "superadmin"]);
    if (typeof email !== "string" || email.length > 254 || !email.includes("@")) {
      return NextResponse.json({ profile: null }, { status: 400 });
    }
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [
        Query.equal("contactEmail", email),
        Query.equal("role", "coopadmin"),
        Query.limit(1),
      ],
    );
    const found = res.documents[0];
    const profile = found ? { FirstName: found.FirstName, LastName: found.LastName } : null;
    return NextResponse.json({ profile: profile || null }, { status: 200 });
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return sessionErrorResponse(error);
    // Check if error is a 404 (document not found)
    if (error?.code === 404) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
};
