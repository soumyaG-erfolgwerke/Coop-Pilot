import {
  COLLECTION_ID_PROFILE,
  createAdminClient,
  DATABASE_ID,
} from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

const { databases } = createAdminClient();

export const GET = async (request, { params }) => {
  const { email } = await params;
  // console.log("Received GET request for email:", email);
  
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [
        Query.equal("contactEmail", email),
        Query.equal("role", "coopadmin"),
        Query.limit(1),
      ],
    );
    const profile = res.documents[0];
    return NextResponse.json({ profile: profile || null }, { status: 200 });
  } catch (error) {
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