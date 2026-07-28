import { COLLECTION_ID_AUDITLOGS, createAdminClient, DATABASE_ID } from "@/lib/appwrite-server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { getAuthenticatedProfile } from "@/lib/helpers/_helpers";

export async function GET(req) {
  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);

  const coopId = searchParams.get("coopId");

  try {
    if (!coopId) {
      return NextResponse.json(
        { success: false, error: "coopId is required" },
        { status: 400 },
      );
    }

    const user = await getAuthenticatedProfile();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 },
      );
    }

    let queries = [
      Query.equal("coopId", coopId),
      Query.orderDesc("performedAt"),
    ];
    
    queries.push(
      Query.or([
        Query.equal("targetType", "ALL"),
        Query.and([
          Query.equal("targetType", "USER"),
          Query.equal("targetId", user.userId),
        ]),
      ])
    );

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_AUDITLOGS,
      queries,
    );

    const logs = res.documents.map((log) => {
      let metadata = {};
      try {
        metadata = log.metadata ? JSON.parse(log.metadata) : {};
      } catch (e) {
        console.error(`Failed to parse metadata for log ${log.$id}:`, e);
      }
      return {
        ...log,
        metadata,
      };
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Fetch Audit Logs Error:", error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
