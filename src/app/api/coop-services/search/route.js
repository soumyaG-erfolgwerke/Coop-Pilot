import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_COOPERATIVES,
} from "@/lib/appwrite-server";
import { stripInternalFields } from "@/lib/helpers/_helpers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("coop") || "").trim();

    if (!q) {
      return NextResponse.json({
        success: true,
        coops: [],
      });
    }

    const { databases } = createAdminClient();

    // Search by cooperative name and registration number in parallel
    const [nameResults, regResults] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        [
          Query.search("name", q),
          Query.limit(50),
        ]
      ),

      databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_COOPERATIVES,
        [
          Query.search("RegNumber", q),
          Query.limit(50),
        ]
      ),
    ]);

    // Merge results and remove duplicates
    const uniqueDocs = new Map();

    [...nameResults.documents, ...regResults.documents].forEach((doc) => {
      uniqueDocs.set(doc.$id, doc);
    });

    console.log("Search query:", q, "Name results:", nameResults.total, "RegNumber results:", regResults.total, "Unique coops found:", uniqueDocs.size);
    // Keep only cooperatives that are not attached to an audit org
    const coops = [...uniqueDocs.values()]
      .filter((doc) => {
        const auditOrgId = doc.auditOrgId;

        return (
          auditOrgId === null ||
          auditOrgId === undefined ||
          auditOrgId === ""
        );
      })
      .map((doc) => stripInternalFields(doc));
      console.log("Search results for query:", q, "Coops found:", coops.length);
    return NextResponse.json({
      success: true,
      coops,
    });
  } catch (error) {
    console.error("Coop search failed:", error);

    return NextResponse.json(
      {
        success: false,
        coops: [],
      },
      { status: 500 }
    );
  }
}